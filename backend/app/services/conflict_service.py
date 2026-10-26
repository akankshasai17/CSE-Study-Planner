from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import CollegeTimetableEntry, PersonalTimetableEntry, RecurrenceRule


def parse_hhmm_to_minutes(hhmm: str) -> int:
    try:
        parts = hhmm.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0


def minutes_to_hhmm(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def intervals_overlap(start1: int, end1: int, start2: int, end2: int) -> bool:
    return max(start1, start2) < min(end1, end2)


def does_recurring_entry_apply_on_date(entry: PersonalTimetableEntry, target_date_str: str) -> bool:
    """Determine if a personal timetable entry occurs on target_date_str (YYYY-MM-DD)."""
    try:
        target_dt = date.fromisoformat(target_date_str)
    except ValueError:
        return False

    weekday = target_dt.weekday()  # 0=Monday .. 6=Sunday

    if entry.repeat_pattern == "none" or not entry.repeat_pattern:
        return entry.specific_date == target_date_str

    rule: Optional[RecurrenceRule] = entry.recurrence_rule
    if rule:
        if rule.excluded_dates and target_date_str in rule.excluded_dates:
            return False
        if rule.start_date and target_date_str < rule.start_date:
            return False
        if rule.end_date and target_date_str > rule.end_date:
            return False

        freq = rule.frequency or entry.repeat_pattern
        if freq == "daily":
            return True
        if freq == "weekdays":
            return weekday in [0, 1, 2, 3, 4]
        if freq == "selected_days":
            days = rule.days_of_week if rule.days_of_week is not None else []
            return weekday in days
        if freq == "weekly":
            if rule.days_of_week:
                return weekday in rule.days_of_week
            if entry.day_of_week is not None:
                return weekday == entry.day_of_week
            if entry.specific_date:
                return date.fromisoformat(entry.specific_date).weekday() == weekday

    # Fallback if recurrence_rule record is not attached
    if entry.repeat_pattern == "daily":
        return True
    if entry.repeat_pattern == "weekdays":
        return weekday in [0, 1, 2, 3, 4]
    if entry.repeat_pattern == "weekly":
        if entry.day_of_week is not None:
            return weekday == entry.day_of_week
        if entry.specific_date:
            return date.fromisoformat(entry.specific_date).weekday() == weekday
    return False


def expand_timetable_for_date(
    db: Session,
    user_id: int,
    target_date_str: str,
    include_college: bool = True,
    include_personal: bool = True,
) -> List[Dict[str, Any]]:
    """Return all occurrences (college classes + personal one-time & recurring) for a given date YYYY-MM-DD."""
    try:
        target_dt = date.fromisoformat(target_date_str)
    except ValueError:
        return []

    weekday = target_dt.weekday()
    occurrences: List[Dict[str, Any]] = []

    if include_college:
        college_entries = (
            db.query(CollegeTimetableEntry)
            .filter(CollegeTimetableEntry.user_id == user_id, CollegeTimetableEntry.day_of_week == weekday)
            .all()
        )
        for c in college_entries:
            s_min = parse_hhmm_to_minutes(c.start_time)
            e_min = parse_hhmm_to_minutes(c.end_time)
            occurrences.append({
                "id": c.id,
                "occurrence_id": f"college-{c.id}-{target_date_str}",
                "source": "college",
                "title": f"{c.subject_name} ({c.class_type})",
                "subject_id": c.subject_id,
                "subject_name": c.subject_name,
                "topic_id": None,
                "topic_title": c.room_number or c.faculty_name or c.class_type,
                "activity_type": c.class_type,
                "date": target_date_str,
                "day_of_week": weekday,
                "start_time": c.start_time,
                "end_time": c.end_time,
                "duration_minutes": max(0, e_min - s_min),
                "faculty_name": c.faculty_name,
                "room_number": c.room_number,
                "location_or_link": c.room_number,
                "priority": "High",
                "notes": c.notes,
                "repeat_pattern": "weekly",
                "color": c.color or "#4f46e5",
                "status": "scheduled",
                "is_recurring": True,
                "is_generated": False,
            })

    if include_personal:
        personal_entries = (
            db.query(PersonalTimetableEntry)
            .filter(PersonalTimetableEntry.user_id == user_id)
            .all()
        )
        for p in personal_entries:
            if not does_recurring_entry_apply_on_date(p, target_date_str):
                continue

            override = {}
            if p.recurrence_rule and p.recurrence_rule.occurrence_overrides:
                override = p.recurrence_rule.occurrence_overrides.get(target_date_str, {})

            start_t = override.get("start_time", p.start_time)
            end_t = override.get("end_time", p.end_time)
            status_val = override.get("status", p.status)
            title_val = override.get("title", p.title)
            notes_val = override.get("notes", p.notes)

            s_min = parse_hhmm_to_minutes(start_t)
            e_min = parse_hhmm_to_minutes(end_t)

            occurrences.append({
                "id": p.id,
                "occurrence_id": f"personal-{p.id}-{target_date_str}",
                "source": "personal",
                "title": title_val,
                "subject_id": p.subject_id,
                "subject_name": p.subject_name,
                "topic_id": p.topic_id,
                "topic_title": p.topic_title,
                "task_id": p.task_id,
                "activity_type": p.activity_type,
                "date": target_date_str,
                "day_of_week": weekday,
                "start_time": start_t,
                "end_time": end_t,
                "duration_minutes": max(0, e_min - s_min),
                "break_duration_minutes": p.break_duration_minutes,
                "location_or_link": p.location_or_link,
                "priority": p.priority,
                "notes": notes_val,
                "repeat_pattern": p.repeat_pattern,
                "reminder_minutes": p.reminder_minutes,
                "color": p.color or "#2563eb",
                "status": status_val,
                "is_recurring": p.repeat_pattern != "none",
                "is_generated": p.is_generated,
            })

    occurrences.sort(key=lambda x: x["start_time"])
    return occurrences


def check_timetable_conflicts(
    db: Session,
    user_id: int,
    start_time: str,
    end_time: str,
    specific_date: Optional[str] = None,
    day_of_week: Optional[int] = None,
    repeat_pattern: str = "none",
    selected_days: Optional[List[int]] = None,
    exclude_entry_id: Optional[int] = None,
    exclude_source: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Detect overlapping entries on the target date or recurring weekdays.
    Returns a list of conflicting entry descriptors.
    """
    s_min = parse_hhmm_to_minutes(start_time)
    e_min = parse_hhmm_to_minutes(end_time)
    if s_min >= e_min:
        raise ValueError("Start time must be earlier than end time.")

    conflicts: List[Dict[str, Any]] = []
    seen_conflict_keys = set()

    # Determine which dates/weekdays to inspect
    dates_to_check: List[str] = []
    weekdays_to_check: List[int] = []

    today = date.today()
    monday_of_this_week = today - timedelta(days=today.weekday())

    if repeat_pattern == "none" and specific_date:
        dates_to_check.append(specific_date)
    else:
        if repeat_pattern == "daily":
            weekdays_to_check = [0, 1, 2, 3, 4, 5, 6]
        elif repeat_pattern == "weekdays":
            weekdays_to_check = [0, 1, 2, 3, 4]
        elif repeat_pattern == "selected_days" and selected_days:
            weekdays_to_check = list(selected_days)
        elif day_of_week is not None:
            weekdays_to_check = [day_of_week]
        elif specific_date:
            weekdays_to_check = [date.fromisoformat(specific_date).weekday()]

        base_dt = date.fromisoformat(specific_date) if specific_date else monday_of_this_week
        base_monday = base_dt - timedelta(days=base_dt.weekday())
        for wd in weekdays_to_check:
            d_str = (base_monday + timedelta(days=wd)).isoformat()
            dates_to_check.append(d_str)

    for d_str in dates_to_check:
        day_events = expand_timetable_for_date(db, user_id, d_str, include_college=True, include_personal=True)
        for ev in day_events:
            if exclude_entry_id and ev["id"] == exclude_entry_id and (not exclude_source or ev["source"] == exclude_source):
                continue
            if ev.get("status") == "skipped":
                continue

            ev_s = parse_hhmm_to_minutes(ev["start_time"])
            ev_e = parse_hhmm_to_minutes(ev["end_time"])
            if intervals_overlap(s_min, e_min, ev_s, ev_e):
                key = (ev["source"], ev["id"], ev["start_time"], ev["end_time"])
                if key not in seen_conflict_keys:
                    seen_conflict_keys.add(key)
                    conflicts.append({
                        "id": ev["id"],
                        "source": ev["source"],
                        "title": ev["title"],
                        "subject_name": ev["subject_name"],
                        "activity_type": ev["activity_type"],
                        "date": d_str,
                        "day_of_week": ev["day_of_week"],
                        "start_time": ev["start_time"],
                        "end_time": ev["end_time"],
                    })

    return conflicts
