from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Exam, Subject, SyllabusTopic, PersonalTimetableEntry
from app.schemas.schemas import ExamCreate, ExamUpdate, ExamResponse
from app.services.conflict_service import (
    parse_hhmm_to_minutes,
    minutes_to_hhmm,
    intervals_overlap,
    expand_timetable_for_date,
)

router = APIRouter(prefix="/api/exams", tags=["Examination Timetable & Preparation"])


class ExamRevisionGeneratorRequest(BaseModel):
    daily_start_time: str = "18:00"
    daily_end_time: str = "22:00"
    session_duration_minutes: int = Field(default=60, ge=25, le=180)
    break_duration_minutes: int = Field(default=10, ge=0, le=60)
    max_sessions_per_day: int = Field(default=2, ge=1, le=6)
    save_to_timetable: bool = True


def compute_exam_conflicts(exams: List[Exam]) -> Dict[int, List[int]]:
    """Detect conflicting examination dates and times across a user's exams."""
    conflict_map: Dict[int, List[int]] = {ex.id: [] for ex in exams}
    for i in range(len(exams)):
        for j in range(i + 1, len(exams)):
            e1, e2 = exams[i], exams[j]
            if e1.exam_date == e2.exam_date:
                s1 = parse_hhmm_to_minutes(e1.start_time)
                end1 = parse_hhmm_to_minutes(e1.end_time)
                s2 = parse_hhmm_to_minutes(e2.start_time)
                end2 = parse_hhmm_to_minutes(e2.end_time)
                if intervals_overlap(s1, end1, s2, end2):
                    conflict_map[e1.id].append(e2.id)
                    conflict_map[e2.id].append(e1.id)
    return conflict_map


def enrich_exam(ex: Exam, today_dt: date, conflict_ids: List[int]) -> ExamResponse:
    try:
        exam_dt = date.fromisoformat(ex.exam_date)
        days_rem = (exam_dt - today_dt).days
    except ValueError:
        days_rem = 0

    topics = ex.syllabus_topics or []
    comp_pct = (
        round((sum(1 for t in topics if t.get("completed")) / len(topics)) * 100.0, 1)
        if topics
        else 0.0
    )

    resp = ExamResponse.model_validate(ex)
    resp.days_remaining = days_rem
    resp.is_completed_exam = days_rem < 0 or ex.preparation_status == "Completed"
    resp.syllabus_completion_percentage = comp_pct
    resp.conflicting_exam_ids = conflict_ids
    return resp


@router.get("", response_model=List[ExamResponse])
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    exams = (
        db.query(Exam)
        .filter(Exam.user_id == current_user.id)
        .order_by(Exam.exam_date.asc(), Exam.start_time.asc())
        .all()
    )
    conflict_map = compute_exam_conflicts(exams)
    return [enrich_exam(ex, today_dt, conflict_map.get(ex.id, [])) for ex in exams]


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if parse_hhmm_to_minutes(payload.start_time) >= parse_hhmm_to_minutes(payload.end_time):
        raise HTTPException(status_code=400, detail="Exam start time must be earlier than end time.")

    syllabus_topics = payload.syllabus_topics or []
    if not syllabus_topics and payload.subject_id:
        subj_topics = (
            db.query(SyllabusTopic)
            .filter(SyllabusTopic.subject_id == payload.subject_id, SyllabusTopic.user_id == current_user.id)
            .all()
        )
        syllabus_topics = [
            {
                "id": f"st-{st.id}",
                "title": f"{st.chapter_title}: {st.topic_title}",
                "completed": st.is_completed,
                "estimated_hours": st.estimated_hours,
            }
            for st in subj_topics
        ]

    exam = Exam(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        exam_name=payload.exam_name.strip(),
        subject_name=payload.subject_name.strip(),
        exam_date=payload.exam_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        venue=payload.venue.strip(),
        exam_type=payload.exam_type,
        syllabus_topics=syllabus_topics,
        preparation_status=payload.preparation_status,
        confidence_level=payload.confidence_level,
        notes=payload.notes,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    all_exams = db.query(Exam).filter(Exam.user_id == current_user.id).all()
    conflict_map = compute_exam_conflicts(all_exams)
    return enrich_exam(exam, date.today(), conflict_map.get(exam.id, []))


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    new_start = payload.start_time if payload.start_time is not None else exam.start_time
    new_end = payload.end_time if payload.end_time is not None else exam.end_time
    if parse_hhmm_to_minutes(new_start) >= parse_hhmm_to_minutes(new_end):
        raise HTTPException(status_code=400, detail="Exam start time must be earlier than end time.")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(exam, k, v)

    db.commit()
    db.refresh(exam)

    all_exams = db.query(Exam).filter(Exam.user_id == current_user.id).all()
    conflict_map = compute_exam_conflicts(all_exams)
    return enrich_exam(exam, date.today(), conflict_map.get(exam.id, []))


@router.delete("/{exam_id}")
def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted.", "id": exam_id}


@router.post("/{exam_id}/generate-revision-schedule")
def generate_exam_revision_schedule(
    exam_id: int,
    payload: ExamRevisionGeneratorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a revision schedule leading up to the exam date based on pending syllabus topics
    and available study hours without conflicting with existing classes or sessions.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    today_dt = date.today()
    exam_dt = date.fromisoformat(exam.exam_date)
    days_until = max(1, min(14, (exam_dt - today_dt).days))

    topics = exam.syllabus_topics or []
    pending_topics = [t for t in topics if not t.get("completed")]
    completed_topics = [t for t in topics if t.get("completed")]
    ordered_topics = pending_topics + completed_topics
    if not ordered_topics:
        ordered_topics = [{"title": f"{exam.subject_name} Full Syllabus Revision", "completed": False}]

    avail_s = parse_hhmm_to_minutes(payload.daily_start_time)
    avail_e = parse_hhmm_to_minutes(payload.daily_end_time)
    dur = payload.session_duration_minutes
    brk = payload.break_duration_minutes

    generated_sessions = []
    topic_idx = 0

    for offset in range(days_until):
        curr_dt = today_dt + timedelta(days=offset)
        curr_str = curr_dt.isoformat()
        if curr_str > exam.exam_date and exam_dt >= today_dt:
            break

        existing_evs = expand_timetable_for_date(db, current_user.id, curr_str, include_college=True, include_personal=True)
        busy = [
            (parse_hhmm_to_minutes(e["start_time"]), parse_hhmm_to_minutes(e["end_time"]))
            for e in existing_evs
            if e.get("status") != "skipped"
        ]

        cursor = avail_s
        sessions_today = 0
        while cursor + dur <= avail_e and sessions_today < payload.max_sessions_per_day:
            cand_s = cursor
            cand_e = cursor + dur
            overlaps = [b_e for (b_s, b_e) in busy if intervals_overlap(cand_s, cand_e, b_s, b_e)]
            if overlaps:
                cursor = max(overlaps) + 5
                continue

            t_item = ordered_topics[topic_idx % len(ordered_topics)]
            topic_idx += 1

            sess_data = {
                "title": f"Exam Revision: {exam.subject_name} — {t_item.get('title', 'Revision')}",
                "subject_id": exam.subject_id,
                "subject_name": exam.subject_name,
                "topic_title": t_item.get("title", "Syllabus Revision"),
                "activity_type": "Exam preparation",
                "specific_date": curr_str,
                "day_of_week": curr_dt.weekday(),
                "start_time": minutes_to_hhmm(cand_s),
                "end_time": minutes_to_hhmm(cand_e),
                "duration_minutes": dur,
                "priority": "Urgent",
                "color": "#dc2626",
                "notes": f"Revision session for {exam.exam_name} ({exam.exam_date})",
            }
            generated_sessions.append(sess_data)
            busy.append((cand_s, cand_e))
            sessions_today += 1
            cursor = cand_e + brk

    saved_entries = []
    if payload.save_to_timetable and generated_sessions:
        for s in generated_sessions:
            entry = PersonalTimetableEntry(
                user_id=current_user.id,
                subject_id=s["subject_id"],
                subject_name=s["subject_name"],
                topic_title=s["topic_title"],
                title=s["title"],
                activity_type=s["activity_type"],
                specific_date=s["specific_date"],
                day_of_week=s["day_of_week"],
                start_time=s["start_time"],
                end_time=s["end_time"],
                break_duration_minutes=brk,
                priority="Urgent",
                notes=s["notes"],
                repeat_pattern="none",
                color=s["color"],
                status="scheduled",
                is_generated=True,
            )
            db.add(entry)
            saved_entries.append(entry)
        db.commit()

    return {
        "exam_id": exam.id,
        "exam_name": exam.exam_name,
        "sessions_count": len(generated_sessions),
        "saved_to_timetable": payload.save_to_timetable,
        "sessions": generated_sessions,
    }
