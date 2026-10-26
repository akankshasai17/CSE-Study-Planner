from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    User,
    Subject,
    CollegeTimetableEntry,
    PersonalTimetableEntry,
    RecurrenceRule,
    StudySession,
)
from app.schemas.schemas import (
    CollegeTimetableCreate,
    CollegeTimetableUpdate,
    CollegeTimetableResponse,
    PersonalTimetableCreate,
    PersonalTimetableUpdate,
    PersonalTimetableResponse,
    ConflictCheckRequest,
    ScheduleGeneratorRequest,
)
from app.services.conflict_service import (
    parse_hhmm_to_minutes,
    expand_timetable_for_date,
    check_timetable_conflicts,
)
from app.services.scheduler_service import generate_rule_based_study_schedule

router = APIRouter(prefix="/api/timetable", tags=["Weekly Timetable & Schedule Generator"])


class StatusUpdatePayload(BaseModel):
    status: str  # scheduled, completed, skipped
    occurrence_date: Optional[str] = None
    scope: str = "single"  # single or series


class MoveEntryPayload(BaseModel):
    specific_date: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: str
    end_time: str
    allow_overlap: bool = False


class AcceptGeneratedSchedulePayload(BaseModel):
    sessions: List[Dict[str, Any]]
    replace_existing_generated: bool = False


# ==================== WEEKLY & DAILY COMBINED TIMETABLE + STATS ====================

@router.get("/week")
def get_weekly_timetable(
    start_date: Optional[str] = Query(None, description="Monday YYYY-MM-DD (defaults to current week's Monday)"),
    subject_id: Optional[int] = Query(None),
    activity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    source_filter: Optional[str] = Query(None, description="all, college, or personal"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    if start_date:
        try:
            ref_dt = date.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
    else:
        ref_dt = today_dt

    monday_dt = ref_dt - timedelta(days=ref_dt.weekday())
    sunday_dt = monday_dt + timedelta(days=6)
    now_hhmm = datetime.now().strftime("%H:%M")
    today_str = today_dt.isoformat()

    include_college = source_filter in (None, "all", "college")
    include_personal = source_filter in (None, "all", "personal")

    days_map: Dict[str, List[Dict[str, Any]]] = {}
    all_week_occurrences: List[Dict[str, Any]] = []

    for i in range(7):
        d_dt = monday_dt + timedelta(days=i)
        d_str = d_dt.isoformat()
        evs = expand_timetable_for_date(
            db, current_user.id, d_str, include_college=include_college, include_personal=include_personal
        )

        # Apply filters
        if subject_id is not None:
            evs = [e for e in evs if e.get("subject_id") == subject_id]
        if activity_type:
            evs = [e for e in evs if e.get("activity_type", "").lower() == activity_type.lower()]
        if search:
            q_low = search.strip().lower()
            evs = [
                e
                for e in evs
                if q_low in e.get("title", "").lower()
                or q_low in e.get("subject_name", "").lower()
                or q_low in e.get("topic_title", "").lower()
            ]

        days_map[d_str] = evs
        all_week_occurrences.extend(evs)

    # Compute real timetable statistics for the week
    study_events = [
        e for e in all_week_occurrences if e.get("activity_type") not in ("Break", "Personal activity")
    ]
    personal_study_events = [e for e in study_events if e["source"] == "personal"]

    scheduled_minutes_total = sum(e["duration_minutes"] for e in study_events if e.get("status") != "skipped")
    completed_minutes_total = sum(
        e["duration_minutes"] for e in personal_study_events if e.get("status") == "completed"
    )

    total_personal_sessions = len(personal_study_events)
    completed_sessions_count = sum(1 for e in personal_study_events if e.get("status") == "completed")
    skipped_sessions_count = sum(1 for e in personal_study_events if e.get("status") == "skipped")

    missed_sessions_count = 0
    upcoming_sessions_count = 0
    remaining_scheduled_sessions = 0

    for e in personal_study_events:
        st = e.get("status", "scheduled")
        if st == "scheduled":
            remaining_scheduled_sessions += 1
            if e["date"] < today_str or (e["date"] == today_str and e["end_time"] < now_hhmm):
                missed_sessions_count += 1
            else:
                upcoming_sessions_count += 1
        elif st == "skipped":
            missed_sessions_count += 1

    # Subject-wise scheduled time breakdown
    subject_minutes_map: Dict[str, int] = {}
    for e in study_events:
        if e.get("status") == "skipped":
            continue
        s_name = e.get("subject_name") or e.get("title") or "General"
        subject_minutes_map[s_name] = subject_minutes_map.get(s_name, 0) + e["duration_minutes"]

    subject_wise_time = [
        {"subject_name": k, "hours": round(v / 60.0, 2), "minutes": v}
        for k, v in sorted(subject_minutes_map.items(), key=lambda x: x[1], reverse=True)
    ]

    completion_pct = (
        round((completed_sessions_count / total_personal_sessions) * 100.0, 1)
        if total_personal_sessions > 0
        else 0.0
    )

    return {
        "week_start": monday_dt.isoformat(),
        "week_end": sunday_dt.isoformat(),
        "days": days_map,
        "occurrences": all_week_occurrences,
        "statistics": {
            "scheduled_hours_current_week": round(scheduled_minutes_total / 60.0, 2),
            "completed_study_hours": round(completed_minutes_total / 60.0, 2),
            "remaining_scheduled_sessions": remaining_scheduled_sessions,
            "completed_sessions": completed_sessions_count,
            "skipped_sessions": skipped_sessions_count,
            "upcoming_sessions": upcoming_sessions_count,
            "missed_study_sessions": missed_sessions_count,
            "schedule_completion_percentage": completion_pct,
            "subject_wise_scheduled_time": subject_wise_time,
        },
    }


@router.get("/day")
def get_day_timetable(
    target_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    occurrences = expand_timetable_for_date(
        db, current_user.id, target_date, include_college=True, include_personal=True
    )
    return {"date": target_date, "occurrences": occurrences}


# ==================== CONFLICT DETECTION ====================

@router.post("/check-conflicts")
def check_conflicts_endpoint(
    payload: ConflictCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            specific_date=payload.specific_date,
            day_of_week=payload.day_of_week,
            repeat_pattern=payload.repeat_pattern,
            selected_days=payload.selected_days,
            exclude_entry_id=payload.exclude_entry_id,
            exclude_source=payload.exclude_source,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "has_conflict": len(conflicts) > 0,
        "conflicts": conflicts,
    }


# ==================== COLLEGE TIMETABLE CRUD ====================

@router.get("/college", response_model=List[CollegeTimetableResponse])
def list_college_timetable(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(CollegeTimetableEntry)
        .filter(CollegeTimetableEntry.user_id == current_user.id)
        .order_by(CollegeTimetableEntry.day_of_week.asc(), CollegeTimetableEntry.start_time.asc())
        .all()
    )
    return entries


@router.post("/college", response_model=CollegeTimetableResponse, status_code=status.HTTP_201_CREATED)
def create_college_timetable_entry(
    payload: CollegeTimetableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s_min = parse_hhmm_to_minutes(payload.start_time)
    e_min = parse_hhmm_to_minutes(payload.end_time)
    if s_min >= e_min:
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time.")

    if not payload.allow_overlap:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            day_of_week=payload.day_of_week,
            repeat_pattern="weekly",
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Time slot overlaps with an existing class or study session.",
                    "conflicts": conflicts,
                },
            )

    entry = CollegeTimetableEntry(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        subject_name=payload.subject_name.strip(),
        class_type=payload.class_type,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        faculty_name=payload.faculty_name.strip(),
        room_number=payload.room_number.strip(),
        semester=payload.semester,
        color=payload.color,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/college/{entry_id}", response_model=CollegeTimetableResponse)
def update_college_timetable_entry(
    entry_id: int,
    payload: CollegeTimetableUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(CollegeTimetableEntry)
        .filter(CollegeTimetableEntry.id == entry_id, CollegeTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="College timetable entry not found.")

    new_start = payload.start_time if payload.start_time is not None else entry.start_time
    new_end = payload.end_time if payload.end_time is not None else entry.end_time
    new_day = payload.day_of_week if payload.day_of_week is not None else entry.day_of_week

    if parse_hhmm_to_minutes(new_start) >= parse_hhmm_to_minutes(new_end):
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time.")

    if not payload.allow_overlap:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=new_start,
            end_time=new_end,
            day_of_week=new_day,
            repeat_pattern="weekly",
            exclude_entry_id=entry.id,
            exclude_source="college",
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Updated time slot overlaps with an existing entry.",
                    "conflicts": conflicts,
                },
            )

    update_data = payload.model_dump(exclude_unset=True, exclude={"allow_overlap"})
    for k, v in update_data.items():
        setattr(entry, k, v)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/college/{entry_id}")
def delete_college_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(CollegeTimetableEntry)
        .filter(CollegeTimetableEntry.id == entry_id, CollegeTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="College timetable entry not found.")
    db.delete(entry)
    db.commit()
    return {"message": "College class removed.", "id": entry_id}


# ==================== PERSONAL TIMETABLE CRUD ====================

@router.get("/personal", response_model=List[PersonalTimetableResponse])
def list_personal_timetable(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.user_id == current_user.id)
        .order_by(PersonalTimetableEntry.start_time.asc())
        .all()
    )
    return entries


@router.post("/personal", response_model=PersonalTimetableResponse, status_code=status.HTTP_201_CREATED)
def create_personal_timetable_entry(
    payload: PersonalTimetableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s_min = parse_hhmm_to_minutes(payload.start_time)
    e_min = parse_hhmm_to_minutes(payload.end_time)
    if s_min >= e_min:
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time.")

    # Resolve day_of_week and specific_date
    spec_date = payload.specific_date
    dow = payload.day_of_week
    if spec_date and dow is None:
        dow = date.fromisoformat(spec_date).weekday()
    elif not spec_date and dow is not None and payload.repeat_pattern == "none":
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        spec_date = (monday + timedelta(days=dow)).isoformat()

    if not payload.allow_overlap:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            specific_date=spec_date,
            day_of_week=dow,
            repeat_pattern=payload.repeat_pattern,
            selected_days=payload.selected_days,
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Schedule conflict detected! Another session overlaps with this time slot.",
                    "conflicts": conflicts,
                },
            )

    subject_name = payload.subject_name.strip()
    if payload.subject_id and not subject_name:
        subj = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == current_user.id).first()
        if subj:
            subject_name = subj.name

    entry = PersonalTimetableEntry(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        subject_name=subject_name,
        topic_id=payload.topic_id,
        topic_title=payload.topic_title.strip(),
        task_id=payload.task_id,
        title=payload.title.strip(),
        activity_type=payload.activity_type,
        specific_date=spec_date,
        day_of_week=dow,
        start_time=payload.start_time,
        end_time=payload.end_time,
        break_duration_minutes=payload.break_duration_minutes,
        location_or_link=payload.location_or_link.strip(),
        priority=payload.priority,
        notes=payload.notes,
        repeat_pattern=payload.repeat_pattern,
        reminder_minutes=payload.reminder_minutes,
        color=payload.color,
        status=payload.status,
        is_generated=False,
    )
    db.add(entry)
    db.flush()

    if payload.repeat_pattern and payload.repeat_pattern != "none":
        if payload.repeat_pattern == "daily":
            days_list = [0, 1, 2, 3, 4, 5, 6]
        elif payload.repeat_pattern == "weekdays":
            days_list = [0, 1, 2, 3, 4]
        elif payload.repeat_pattern == "selected_days":
            days_list = payload.selected_days or ([dow] if dow is not None else [0])
        else:  # weekly
            days_list = [dow] if dow is not None else [0]

        rule = RecurrenceRule(
            timetable_entry_id=entry.id,
            user_id=current_user.id,
            frequency=payload.repeat_pattern,
            days_of_week=days_list,
            start_date=payload.recurrence_start_date or spec_date or date.today().isoformat(),
            end_date=payload.recurrence_end_date,
            excluded_dates=[],
            occurrence_overrides={},
        )
        db.add(rule)

    db.commit()
    db.refresh(entry)
    return entry


@router.put("/personal/{entry_id}", response_model=PersonalTimetableResponse)
def update_personal_timetable_entry(
    entry_id: int,
    payload: PersonalTimetableUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.id == entry_id, PersonalTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found.")

    # Handle single occurrence edit on a recurring entry
    if entry.repeat_pattern != "none" and payload.edit_scope == "single" and payload.occurrence_date:
        rule = entry.recurrence_rule
        if rule:
            overrides = dict(rule.occurrence_overrides or {})
            curr_ov = dict(overrides.get(payload.occurrence_date, {}))
            if payload.title is not None:
                curr_ov["title"] = payload.title
            if payload.start_time is not None:
                curr_ov["start_time"] = payload.start_time
            if payload.end_time is not None:
                curr_ov["end_time"] = payload.end_time
            if payload.status is not None:
                curr_ov["status"] = payload.status
            if payload.notes is not None:
                curr_ov["notes"] = payload.notes
            overrides[payload.occurrence_date] = curr_ov
            rule.occurrence_overrides = overrides
            db.commit()
            db.refresh(entry)
            return entry

    new_start = payload.start_time if payload.start_time is not None else entry.start_time
    new_end = payload.end_time if payload.end_time is not None else entry.end_time
    if parse_hhmm_to_minutes(new_start) >= parse_hhmm_to_minutes(new_end):
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time.")

    new_date = payload.specific_date if payload.specific_date is not None else entry.specific_date
    new_dow = payload.day_of_week if payload.day_of_week is not None else entry.day_of_week
    new_repeat = payload.repeat_pattern if payload.repeat_pattern is not None else entry.repeat_pattern

    if not payload.allow_overlap:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=new_start,
            end_time=new_end,
            specific_date=new_date,
            day_of_week=new_dow,
            repeat_pattern=new_repeat,
            selected_days=payload.selected_days,
            exclude_entry_id=entry.id,
            exclude_source="personal",
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Schedule conflict detected with an existing timetable entry.",
                    "conflicts": conflicts,
                },
            )

    update_data = payload.model_dump(
        exclude_unset=True,
        exclude={"allow_overlap", "edit_scope", "occurrence_date", "selected_days", "recurrence_end_date"},
    )
    for k, v in update_data.items():
        setattr(entry, k, v)

    if new_date and entry.day_of_week is None:
        entry.day_of_week = date.fromisoformat(new_date).weekday()

    if entry.repeat_pattern != "none":
        rule = entry.recurrence_rule
        if not rule:
            rule = RecurrenceRule(
                timetable_entry_id=entry.id,
                user_id=current_user.id,
                frequency=entry.repeat_pattern,
                days_of_week=payload.selected_days or ([entry.day_of_week] if entry.day_of_week is not None else [0]),
                start_date=entry.specific_date or date.today().isoformat(),
                end_date=payload.recurrence_end_date,
                excluded_dates=[],
                occurrence_overrides={},
            )
            db.add(rule)
        else:
            rule.frequency = entry.repeat_pattern
            if payload.selected_days is not None:
                rule.days_of_week = payload.selected_days
            if payload.recurrence_end_date is not None:
                rule.end_date = payload.recurrence_end_date

    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/personal/{entry_id}/status", response_model=PersonalTimetableResponse)
def update_personal_timetable_status(
    entry_id: int,
    payload: StatusUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.id == entry_id, PersonalTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found.")

    was_completed = False
    target_date = payload.occurrence_date or entry.specific_date or date.today().isoformat()

    if entry.repeat_pattern != "none" and payload.scope == "single" and payload.occurrence_date:
        rule = entry.recurrence_rule
        if rule:
            overrides = dict(rule.occurrence_overrides or {})
            curr_ov = dict(overrides.get(payload.occurrence_date, {}))
            was_completed = curr_ov.get("status") == "completed"
            curr_ov["status"] = payload.status
            overrides[payload.occurrence_date] = curr_ov
            rule.occurrence_overrides = overrides
    else:
        was_completed = entry.status == "completed"
        entry.status = payload.status

    # If newly marked completed, record study session and increment subject completed hours
    if payload.status == "completed" and not was_completed:
        s_min = parse_hhmm_to_minutes(entry.start_time)
        e_min = parse_hhmm_to_minutes(entry.end_time)
        dur_mins = max(0, e_min - s_min)

        if dur_mins > 0 and entry.activity_type not in ("Break", "Personal activity"):
            study_sess = StudySession(
                user_id=current_user.id,
                subject_id=entry.subject_id,
                topic_id=entry.topic_id,
                timetable_entry_id=entry.id,
                title=entry.title,
                session_date=target_date,
                start_time=entry.start_time,
                end_time=entry.end_time,
                duration_minutes=dur_mins,
                planned_minutes=dur_mins,
                session_type=entry.activity_type,
                notes=entry.notes,
            )
            db.add(study_sess)
            if entry.subject_id:
                subj = (
                    db.query(Subject)
                    .filter(Subject.id == entry.subject_id, Subject.user_id == current_user.id)
                    .first()
                )
                if subj:
                    subj.completed_study_hours = round(subj.completed_study_hours + (dur_mins / 60.0), 2)

    db.commit()
    db.refresh(entry)
    return entry


@router.post("/personal/{entry_id}/duplicate", response_model=PersonalTimetableResponse, status_code=status.HTTP_201_CREATED)
def duplicate_personal_timetable_entry(
    entry_id: int,
    target_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.id == entry_id, PersonalTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found.")

    dup_date = target_date or entry.specific_date
    dup_dow = date.fromisoformat(dup_date).weekday() if dup_date else entry.day_of_week

    new_entry = PersonalTimetableEntry(
        user_id=current_user.id,
        subject_id=entry.subject_id,
        subject_name=entry.subject_name,
        topic_id=entry.topic_id,
        topic_title=entry.topic_title,
        task_id=entry.task_id,
        title=f"{entry.title} (Copy)",
        activity_type=entry.activity_type,
        specific_date=dup_date,
        day_of_week=dup_dow,
        start_time=start_time or entry.start_time,
        end_time=end_time or entry.end_time,
        break_duration_minutes=entry.break_duration_minutes,
        location_or_link=entry.location_or_link,
        priority=entry.priority,
        notes=entry.notes,
        repeat_pattern="none",
        reminder_minutes=entry.reminder_minutes,
        color=entry.color,
        status="scheduled",
        is_generated=False,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.patch("/personal/{entry_id}/move", response_model=PersonalTimetableResponse)
def move_personal_timetable_entry(
    entry_id: int,
    payload: MoveEntryPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.id == entry_id, PersonalTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found.")

    if parse_hhmm_to_minutes(payload.start_time) >= parse_hhmm_to_minutes(payload.end_time):
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time.")

    new_date = payload.specific_date or entry.specific_date
    new_dow = payload.day_of_week if payload.day_of_week is not None else (
        date.fromisoformat(new_date).weekday() if new_date else entry.day_of_week
    )

    if not payload.allow_overlap:
        conflicts = check_timetable_conflicts(
            db=db,
            user_id=current_user.id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            specific_date=new_date,
            day_of_week=new_dow,
            repeat_pattern=entry.repeat_pattern,
            exclude_entry_id=entry.id,
            exclude_source="personal",
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Target time slot conflicts with an existing schedule entry.",
                    "conflicts": conflicts,
                },
            )

    entry.specific_date = new_date
    entry.day_of_week = new_dow
    entry.start_time = payload.start_time
    entry.end_time = payload.end_time
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/personal/{entry_id}")
def delete_personal_timetable_entry(
    entry_id: int,
    scope: str = Query("series", description="series or single"),
    occurrence_date: Optional[str] = Query(None, description="YYYY-MM-DD when scope=single"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.id == entry_id, PersonalTimetableEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found.")

    if entry.repeat_pattern != "none" and scope == "single" and occurrence_date:
        rule = entry.recurrence_rule
        if rule:
            excl = list(rule.excluded_dates or [])
            if occurrence_date not in excl:
                excl.append(occurrence_date)
            rule.excluded_dates = excl
            db.commit()
            return {"message": f"Occurrence on {occurrence_date} removed from recurring series.", "id": entry_id}

    db.delete(entry)
    db.commit()
    return {"message": "Timetable entry deleted.", "id": entry_id}


# ==================== AUTOMATIC RULE-BASED SCHEDULE GENERATOR ====================

@router.post("/generate-preview")
def generate_schedule_preview(
    payload: ScheduleGeneratorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = generate_rule_based_study_schedule(
            db=db,
            user_id=current_user.id,
            subject_ids=payload.subject_ids,
            start_date_str=payload.start_date,
            days_count=payload.days_count,
            daily_start_time=payload.daily_start_time,
            daily_end_time=payload.daily_end_time,
            session_duration_minutes=payload.session_duration_minutes,
            break_duration_minutes=payload.break_duration_minutes,
            available_weekdays=payload.available_weekdays,
            max_daily_study_hours=payload.max_daily_study_hours,
            prioritize_upcoming_exams=payload.prioritize_upcoming_exams,
            prioritize_pending_topics=payload.prioritize_pending_topics,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/accept-generated", response_model=List[PersonalTimetableResponse], status_code=status.HTTP_201_CREATED)
def accept_generated_schedule(
    payload: AcceptGeneratedSchedulePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.replace_existing_generated:
        db.query(PersonalTimetableEntry).filter(
            PersonalTimetableEntry.user_id == current_user.id,
            PersonalTimetableEntry.is_generated == True,
            PersonalTimetableEntry.status == "scheduled",
        ).delete(synchronize_session=False)

    created_entries: List[PersonalTimetableEntry] = []
    for item in payload.sessions:
        spec_date = item.get("specific_date")
        dow = item.get("day_of_week")
        if spec_date and dow is None:
            dow = date.fromisoformat(spec_date).weekday()

        entry = PersonalTimetableEntry(
            user_id=current_user.id,
            subject_id=item.get("subject_id"),
            subject_name=item.get("subject_name", ""),
            topic_id=item.get("topic_id"),
            topic_title=item.get("topic_title", ""),
            title=item.get("title", "Study Session"),
            activity_type=item.get("activity_type", "Self-study"),
            specific_date=spec_date,
            day_of_week=dow,
            start_time=item.get("start_time", "18:00"),
            end_time=item.get("end_time", "18:50"),
            break_duration_minutes=item.get("break_duration_minutes", 10),
            priority=item.get("priority", "Medium"),
            notes=item.get("notes", "Generated by Rule-Based Study Schedule Generator"),
            repeat_pattern="none",
            color=item.get("color", "#2563eb"),
            status="scheduled",
            is_generated=True,
        )
        db.add(entry)
        created_entries.append(entry)

    db.commit()
    for e in created_entries:
        db.refresh(e)
    return created_entries
