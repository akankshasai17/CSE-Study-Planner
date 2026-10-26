from datetime import date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Subject, SyllabusTopic, Exam, UserProfile
from app.services.conflict_service import (
    expand_timetable_for_date,
    parse_hhmm_to_minutes,
    minutes_to_hhmm,
    intervals_overlap,
)


PRIORITY_WEIGHTS = {
    "Critical": 4.0,
    "Urgent": 4.0,
    "High": 3.0,
    "Medium": 2.0,
    "Low": 1.0,
}

ACTIVITY_COLORS = [
    "#2563eb",  # blue
    "#7c3aed",  # violet
    "#0891b2",  # cyan
    "#059669",  # emerald
    "#d97706",  # amber
    "#dc2626",  # red
    "#db2777",  # pink
    "#4f46e5",  # indigo
]


def generate_rule_based_study_schedule(
    db: Session,
    user_id: int,
    subject_ids: List[int],
    start_date_str: str,
    days_count: int = 7,
    daily_start_time: str = "18:00",
    daily_end_time: str = "22:00",
    session_duration_minutes: int = 50,
    break_duration_minutes: int = 10,
    available_weekdays: List[int] = None,
    max_daily_study_hours: float = 4.0,
    prioritize_upcoming_exams: bool = True,
    prioritize_pending_topics: bool = True,
) -> Dict[str, Any]:
    """
    Rule-based study schedule generator (deterministic heuristic algorithm, not an AI model).
    Enforces all 10 scheduling rules:
    1. Never schedule over existing college classes.
    2. Avoid existing personal timetable conflicts.
    3. Give priority to exams that are closer and subjects with higher priority.
    4. Distribute study time across selected subjects.
    5. Include breaks between study sessions.
    6. Respect student's available time.
    7. Avoid scheduling outside configured availability.
    8. Schedule pending topics before already completed topics.
    9. Do not exceed configured daily study-hour limit.
    10. Return preview for user review before saving.
    """
    if available_weekdays is None:
        available_weekdays = [0, 1, 2, 3, 4, 5, 6]

    start_dt = date.fromisoformat(start_date_str)
    avail_start_min = parse_hhmm_to_minutes(daily_start_time)
    avail_end_min = parse_hhmm_to_minutes(daily_end_time)
    if avail_start_min >= avail_end_min:
        raise ValueError("Daily available start time must be earlier than end time.")

    max_daily_minutes = int(max_daily_study_hours * 60)

    # Fetch user profile for lunch break times if applicable
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    lunch_s = parse_hhmm_to_minutes(profile.lunch_start_time) if profile and profile.lunch_start_time else -1
    lunch_e = parse_hhmm_to_minutes(profile.lunch_end_time) if profile and profile.lunch_end_time else -1

    # Query selected subjects (or all user subjects if none specified)
    q = db.query(Subject).filter(Subject.user_id == user_id)
    if subject_ids:
        q = q.filter(Subject.id.in_(subject_ids))
    subjects = q.all()

    if not subjects:
        return {
            "algorithm_type": "Deterministic Priority-Weighted Rule-Based Scheduler",
            "algorithm_explanation": (
                "This schedule is produced by a deterministic rule-based scheduling algorithm (not an AI prediction system). "
                "No subjects were found to schedule. Please add subjects first."
            ),
            "proposed_sessions": [],
            "summary": {
                "total_sessions": 0,
                "total_study_hours": 0.0,
                "days_covered": 0,
                "subjects_covered": 0,
            },
        }

    # Fetch upcoming exams to boost subject urgency
    upcoming_exams = (
        db.query(Exam)
        .filter(Exam.user_id == user_id, Exam.exam_date >= start_date_str)
        .all()
    )
    exam_urgency_by_subject: Dict[int, float] = {}
    closest_exam_date_by_subject: Dict[int, str] = {}
    for ex in upcoming_exams:
        if ex.subject_id:
            try:
                days_away = max(1, (date.fromisoformat(ex.exam_date) - start_dt).days)
                urgency_bonus = max(0.5, 30.0 / days_away)
                exam_urgency_by_subject[ex.subject_id] = max(
                    exam_urgency_by_subject.get(ex.subject_id, 0.0), urgency_bonus
                )
                if (
                    ex.subject_id not in closest_exam_date_by_subject
                    or ex.exam_date < closest_exam_date_by_subject[ex.subject_id]
                ):
                    closest_exam_date_by_subject[ex.subject_id] = ex.exam_date
            except ValueError:
                pass

    # Build weighted subject queues with pending topics first, then completed/general topics
    subject_queues: List[Dict[str, Any]] = []
    for idx, subj in enumerate(subjects):
        base_weight = PRIORITY_WEIGHTS.get(subj.priority, 2.0)
        exam_bonus = exam_urgency_by_subject.get(subj.id, 0.0) if prioritize_upcoming_exams else 0.0
        remaining_hours_ratio = max(
            0.2,
            (subj.target_study_hours - subj.completed_study_hours) / max(1.0, subj.target_study_hours),
        )
        total_score = round((base_weight + exam_bonus) * (1.0 + 0.5 * remaining_hours_ratio), 2)

        all_topics = (
            db.query(SyllabusTopic)
            .filter(SyllabusTopic.subject_id == subj.id)
            .order_by(SyllabusTopic.chapter_number.asc(), SyllabusTopic.order_index.asc(), SyllabusTopic.id.asc())
            .all()
        )
        pending_topics = [t for t in all_topics if not t.is_completed]
        completed_topics = [t for t in all_topics if t.is_completed]

        ordered_topics = (pending_topics + completed_topics) if prioritize_pending_topics else all_topics

        subject_queues.append({
            "subject": subj,
            "score": total_score,
            "pending_topics": pending_topics,
            "ordered_topics": ordered_topics,
            "topic_cursor": 0,
            "sessions_assigned": 0,
            "has_upcoming_exam": subj.id in closest_exam_date_by_subject,
            "exam_date": closest_exam_date_by_subject.get(subj.id),
            "color": subj.color or ACTIVITY_COLORS[idx % len(ACTIVITY_COLORS)],
        })

    # Sort subjects by score descending
    subject_queues.sort(key=lambda x: x["score"], reverse=True)

    proposed_sessions: List[Dict[str, Any]] = []
    days_scheduled_set = set()
    subjects_scheduled_set = set()

    for day_offset in range(days_count):
        curr_dt = start_dt + timedelta(days=day_offset)
        curr_date_str = curr_dt.isoformat()
        weekday = curr_dt.weekday()

        if weekday not in available_weekdays:
            continue

        # Get existing events on this date (college + personal)
        existing_events = expand_timetable_for_date(
            db, user_id, curr_date_str, include_college=True, include_personal=True
        )
        busy_intervals = []
        already_scheduled_study_minutes = 0

        for ev in existing_events:
            if ev.get("status") == "skipped":
                continue
            ev_s = parse_hhmm_to_minutes(ev["start_time"])
            ev_e = parse_hhmm_to_minutes(ev["end_time"])
            busy_intervals.append((ev_s, ev_e))
            if ev["source"] == "personal" and ev["activity_type"] not in ("Break", "Personal activity"):
                already_scheduled_study_minutes += max(0, ev_e - ev_s)

        if lunch_s >= 0 and lunch_e > lunch_s:
            busy_intervals.append((lunch_s, lunch_e))

        daily_minutes_remaining = max(0, max_daily_minutes - already_scheduled_study_minutes)
        if daily_minutes_remaining < session_duration_minutes:
            continue

        cursor_min = avail_start_min
        while (
            cursor_min + session_duration_minutes <= avail_end_min
            and daily_minutes_remaining >= session_duration_minutes
        ):
            cand_start = cursor_min
            cand_end = cursor_min + session_duration_minutes

            # Check overlap with any busy interval
            overlapping_ends = [
                b_end for (b_start, b_end) in busy_intervals if intervals_overlap(cand_start, cand_end, b_start, b_end)
            ]
            if overlapping_ends:
                cursor_min = max(overlapping_ends) + 5
                continue

            # Select best subject for this slot: highest (score / (1 + 0.65 * sessions_assigned))
            # so study time is distributed across selected subjects while respecting priority & exam proximity
            best_sq = max(
                subject_queues,
                key=lambda sq: sq["score"] / (1.0 + 0.65 * sq["sessions_assigned"]),
            )

            subj: Subject = best_sq["subject"]
            ordered_topics: List[SyllabusTopic] = best_sq["ordered_topics"]
            topic_obj = None
            topic_title = "Core Concepts & Practice"
            is_pending_topic = True

            if ordered_topics:
                t_idx = best_sq["topic_cursor"] % len(ordered_topics)
                topic_obj = ordered_topics[t_idx]
                topic_title = f"{topic_obj.chapter_title}: {topic_obj.topic_title}"
                is_pending_topic = not topic_obj.is_completed
                best_sq["topic_cursor"] += 1

            if best_sq["has_upcoming_exam"] and best_sq["exam_date"] and best_sq["exam_date"] >= curr_date_str:
                activity_type = "Exam preparation" if is_pending_topic else "Revision"
            else:
                activity_type = "Self-study" if is_pending_topic else "Revision"

            session_title = f"{subj.name} — {topic_obj.topic_title if topic_obj else activity_type}"

            proposed_sessions.append({
                "temp_id": f"gen-{curr_date_str}-{minutes_to_hhmm(cand_start)}",
                "title": session_title,
                "subject_id": subj.id,
                "subject_name": subj.name,
                "topic_id": topic_obj.id if topic_obj else None,
                "topic_title": topic_title,
                "activity_type": activity_type,
                "specific_date": curr_date_str,
                "day_of_week": weekday,
                "start_time": minutes_to_hhmm(cand_start),
                "end_time": minutes_to_hhmm(cand_end),
                "duration_minutes": session_duration_minutes,
                "break_duration_minutes": break_duration_minutes,
                "priority": subj.priority,
                "color": best_sq["color"],
                "notes": (
                    f"Rule-based schedule: Priority={subj.priority}, Weight={best_sq['score']}"
                    + (f", Upcoming Exam on {best_sq['exam_date']}" if best_sq["has_upcoming_exam"] else "")
                ),
                "reason": (
                    f"Prioritized for {subj.name} ({subj.priority} priority"
                    + (f", exam on {best_sq['exam_date']}" if best_sq["has_upcoming_exam"] else "")
                    + (", pending syllabus topic)" if is_pending_topic else ", revision pass)")
                ),
            })

            best_sq["sessions_assigned"] += 1
            days_scheduled_set.add(curr_date_str)
            subjects_scheduled_set.add(subj.id)
            busy_intervals.append((cand_start, cand_end))
            daily_minutes_remaining -= session_duration_minutes

            # Advance cursor by session + break
            cursor_min = cand_end + break_duration_minutes

    total_study_minutes = sum(s["duration_minutes"] for s in proposed_sessions)
    return {
        "algorithm_type": "Deterministic Priority-Weighted Rule-Based Scheduler",
        "algorithm_explanation": (
            "This schedule is generated by a rule-based scheduling algorithm (not an AI prediction system). "
            "It avoids all existing college classes and personal timetable entries, respects your daily study window "
            f"({daily_start_time}–{daily_end_time}) and {max_daily_study_hours}h/day cap, inserts {break_duration_minutes}-minute breaks "
            "between sessions, prioritizes subjects with closer exams and higher priority, and schedules pending syllabus topics before completed ones."
        ),
        "proposed_sessions": proposed_sessions,
        "summary": {
            "total_sessions": len(proposed_sessions),
            "total_study_hours": round(total_study_minutes / 60.0, 2),
            "days_covered": len(days_scheduled_set),
            "subjects_covered": len(subjects_scheduled_set),
            "subject_breakdown": [
                {
                    "subject_id": sq["subject"].id,
                    "subject_name": sq["subject"].name,
                    "priority": sq["subject"].priority,
                    "weight_score": sq["score"],
                    "sessions_count": sq["sessions_assigned"],
                    "hours_allocated": round((sq["sessions_assigned"] * session_duration_minutes) / 60.0, 2),
                }
                for sq in subject_queues
            ],
        },
    }
