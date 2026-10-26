from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Subject,
    SyllabusTopic,
    Task,
    Exam,
    DSAProblem,
    FocusSession,
    StudySession,
    PersonalTimetableEntry,
    UserProfile,
)
from app.services.conflict_service import expand_timetable_for_date


DAILY_QUOTES = [
    {
        "quote": "First, solve the problem. Then, write the code.",
        "author": "John Johnson",
    },
    {
        "quote": "Programs must be written for people to read, and only incidentally for machines to execute.",
        "author": "Harold Abelson (SICP)",
    },
    {
        "quote": "The only way to learn a new programming language is by writing programs in it.",
        "author": "Dennis Ritchie",
    },
    {
        "quote": "Premature optimization is the root of all evil in programming.",
        "author": "Donald Knuth",
    },
    {
        "quote": "Consistency in algorithms and fundamentals compounds faster than cramming before exams.",
        "author": "CSE Study Principle",
    },
    {
        "quote": "Talk is cheap. Show me the code.",
        "author": "Linus Torvalds",
    },
    {
        "quote": "Simplicity is prerequisite for reliability.",
        "author": "Edsger W. Dijkstra",
    },
]


def compute_streaks(active_dates_set: set, reference_date: date) -> Dict[str, int]:
    """Compute current study streak and longest study streak from a set of YYYY-MM-DD strings."""
    if not active_dates_set:
        return {"current_streak": 0, "longest_streak": 0}

    sorted_dates = sorted(
        [date.fromisoformat(d) for d in active_dates_set if d and len(d) == 10]
    )
    if not sorted_dates:
        return {"current_streak": 0, "longest_streak": 0}

    # Longest streak
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i - 1]).days
        if diff == 1:
            current_run += 1
            longest = max(longest, current_run)
        elif diff > 1:
            current_run = 1

    # Current streak (active today or yesterday)
    today_str = reference_date.isoformat()
    yesterday_str = (reference_date - timedelta(days=1)).isoformat()

    if today_str not in active_dates_set and yesterday_str not in active_dates_set:
        current_streak = 0
    else:
        cursor = reference_date if today_str in active_dates_set else (reference_date - timedelta(days=1))
        current_streak = 0
        while cursor.isoformat() in active_dates_set:
            current_streak += 1
            cursor -= timedelta(days=1)

    return {"current_streak": current_streak, "longest_streak": max(longest, current_streak)}


def collect_daily_completed_minutes(
    db: Session,
    user_id: int,
    start_date_str: str,
    end_date_str: str,
) -> Dict[str, float]:
    """
    Calculate actual completed study minutes per date in [start_date_str, end_date_str]
    from real database records:
    1) StudySession records
    2) FocusSession (mode == 'focus' and is_completed == True)
    3) PersonalTimetableEntry occurrences marked status == 'completed'
    """
    daily_minutes: Dict[str, float] = {}
    start_dt = date.fromisoformat(start_date_str)
    end_dt = date.fromisoformat(end_date_str)

    curr = start_dt
    while curr <= end_dt:
        daily_minutes[curr.isoformat()] = 0.0
        curr += timedelta(days=1)

    # 1. Explicit StudySessions
    study_sessions = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.session_date >= start_date_str,
            StudySession.session_date <= end_date_str,
        )
        .all()
    )
    tracked_timetable_dates = set()
    for ss in study_sessions:
        if ss.session_date in daily_minutes:
            daily_minutes[ss.session_date] += float(ss.duration_minutes or 0)
        if ss.timetable_entry_id:
            tracked_timetable_dates.add((ss.timetable_entry_id, ss.session_date))

    # 2. Completed Pomodoro focus sessions
    focus_sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.mode == "focus",
            FocusSession.is_completed == True,
            FocusSession.session_date >= start_date_str,
            FocusSession.session_date <= end_date_str,
        )
        .all()
    )
    for fs in focus_sessions:
        if fs.session_date in daily_minutes:
            daily_minutes[fs.session_date] += float(fs.duration_minutes or 0)

    # 3. Completed PersonalTimetableEntry occurrences not already logged in StudySession
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.isoformat()
        day_events = expand_timetable_for_date(db, user_id, d_str, include_college=False, include_personal=True)
        for ev in day_events:
            if (
                ev["status"] == "completed"
                and ev["activity_type"] not in ("Break", "Personal activity")
                and (ev["id"], d_str) not in tracked_timetable_dates
            ):
                daily_minutes[d_str] += float(ev["duration_minutes"] or 0)
        curr += timedelta(days=1)

    return daily_minutes


def collect_all_active_study_dates(db: Session, user_id: int) -> set:
    """Return all dates (YYYY-MM-DD) where the user completed a study session, focus session, DSA problem, or completed timetable session."""
    active_dates = set()

    for ss in db.query(StudySession.session_date).filter(StudySession.user_id == user_id, StudySession.duration_minutes > 0).all():
        if ss[0]:
            active_dates.add(ss[0])

    for fs in (
        db.query(FocusSession.session_date)
        .filter(FocusSession.user_id == user_id, FocusSession.mode == "focus", FocusSession.is_completed == True)
        .all()
    ):
        if fs[0]:
            active_dates.add(fs[0])

    for dp in (
        db.query(DSAProblem.date_solved)
        .filter(DSAProblem.user_id == user_id, DSAProblem.status == "Solved", DSAProblem.date_solved.isnot(None))
        .all()
    ):
        if dp[0]:
            active_dates.add(dp[0])

    for pt in (
        db.query(PersonalTimetableEntry)
        .filter(PersonalTimetableEntry.user_id == user_id)
        .all()
    ):
        if pt.status == "completed" and pt.specific_date:
            active_dates.add(pt.specific_date)
        if pt.recurrence_rule and pt.recurrence_rule.occurrence_overrides:
            for d_str, ov in pt.recurrence_rule.occurrence_overrides.items():
                if isinstance(ov, dict) and ov.get("status") == "completed":
                    active_dates.add(d_str)

    return active_dates


def build_dashboard_summary(db: Session, user_id: int, target_date_str: Optional[str] = None) -> Dict[str, Any]:
    today_dt = date.fromisoformat(target_date_str) if target_date_str else date.today()
    today_str = today_dt.isoformat()
    now_hhmm = datetime.now().strftime("%H:%M")

    # Subjects
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    total_subjects = len(subjects)

    # Today's timetable (combined college + personal)
    todays_timetable = expand_timetable_for_date(db, user_id, today_str, include_college=True, include_personal=True)

    # Today's scheduled study hours (personal study activities + college classes)
    scheduled_study_minutes_today = sum(
        ev["duration_minutes"]
        for ev in todays_timetable
        if ev.get("status") != "skipped" and ev.get("activity_type") not in ("Break", "Personal activity")
    )
    todays_scheduled_study_hours = round(scheduled_study_minutes_today / 60.0, 2)

    # Actual completed study hours today
    completed_map_today = collect_daily_completed_minutes(db, user_id, today_str, today_str)
    actual_completed_study_hours = round(completed_map_today.get(today_str, 0.0) / 60.0, 2)

    # Next upcoming study session (today after current time, or tomorrow)
    next_session = None
    for ev in todays_timetable:
        if ev.get("status") == "scheduled" and ev["end_time"] >= now_hhmm:
            next_session = ev
            break
    if not next_session:
        for offset in range(1, 4):
            future_d = (today_dt + timedelta(days=offset)).isoformat()
            future_events = expand_timetable_for_date(db, user_id, future_d, include_college=True, include_personal=True)
            scheduled_future = [e for e in future_events if e.get("status") == "scheduled"]
            if scheduled_future:
                next_session = scheduled_future[0]
                break

    # Tasks
    all_tasks = db.query(Task).filter(Task.user_id == user_id).order_by(Task.due_date.asc(), Task.due_time.asc()).all()
    pending_tasks_count = sum(1 for t in all_tasks if t.status != "Completed")
    completed_tasks_count = sum(1 for t in all_tasks if t.status == "Completed")
    in_progress_tasks_count = sum(1 for t in all_tasks if t.status == "In Progress")
    todo_tasks_count = sum(1 for t in all_tasks if t.status == "Pending")

    todays_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "subject_name": t.subject_name,
            "assignment_type": t.assignment_type,
            "due_date": t.due_date,
            "due_time": t.due_time,
            "priority": t.priority,
            "status": t.status,
            "is_overdue": (t.status != "Completed" and t.due_date < today_str),
        }
        for t in all_tasks
        if t.due_date <= today_str or t.status != "Completed"
    ][:8]

    # Upcoming exams
    all_exams = db.query(Exam).filter(Exam.user_id == user_id).order_by(Exam.exam_date.asc(), Exam.start_time.asc()).all()
    upcoming_exams_list = []
    for ex in all_exams:
        try:
            days_rem = (date.fromisoformat(ex.exam_date) - today_dt).days
        except ValueError:
            days_rem = 0
        if days_rem >= 0 and ex.preparation_status != "Completed":
            topics = ex.syllabus_topics or []
            comp_pct = (
                round((sum(1 for item in topics if item.get("completed")) / len(topics)) * 100.0, 1)
                if topics
                else 0.0
            )
            upcoming_exams_list.append({
                "id": ex.id,
                "exam_name": ex.exam_name,
                "subject_name": ex.subject_name,
                "exam_date": ex.exam_date,
                "start_time": ex.start_time,
                "end_time": ex.end_time,
                "exam_type": ex.exam_type,
                "venue": ex.venue,
                "days_remaining": days_rem,
                "preparation_status": ex.preparation_status,
                "confidence_level": ex.confidence_level,
                "syllabus_completion_percentage": comp_pct,
            })

    # DSA solved count
    dsa_problems = db.query(DSAProblem).filter(DSAProblem.user_id == user_id).all()
    dsa_solved_count = sum(1 for p in dsa_problems if p.status == "Solved")

    # Streaks
    active_dates = collect_all_active_study_dates(db, user_id)
    streak_info = compute_streaks(active_dates, today_dt)

    # Weekly study-hours bar chart (Monday to Sunday of current week)
    monday_dt = today_dt - timedelta(days=today_dt.weekday())
    sunday_dt = monday_dt + timedelta(days=6)
    week_completed_map = collect_daily_completed_minutes(
        db, user_id, monday_dt.isoformat(), sunday_dt.isoformat()
    )
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_study_chart = []
    for i in range(7):
        d_dt = monday_dt + timedelta(days=i)
        d_str = d_dt.isoformat()
        evs = expand_timetable_for_date(db, user_id, d_str, include_college=False, include_personal=True)
        planned_mins = sum(
            e["duration_minutes"]
            for e in evs
            if e.get("status") != "skipped" and e.get("activity_type") not in ("Break", "Personal activity")
        )
        actual_mins = week_completed_map.get(d_str, 0.0)
        weekly_study_chart.append({
            "day": day_labels[i],
            "date": d_str,
            "planned_hours": round(planned_mins / 60.0, 2),
            "actual_hours": round(actual_mins / 60.0, 2),
        })

    # Subject-wise progress chart
    subject_progress_chart = []
    for s in subjects:
        topics = s.topics or []
        total_t = len(topics)
        comp_t = sum(1 for t in topics if t.is_completed)
        syllabus_pct = round((comp_t / total_t) * 100.0, 1) if total_t > 0 else 0.0
        hours_pct = round(min(100.0, (s.completed_study_hours / max(1.0, s.target_study_hours)) * 100.0), 1)
        subject_progress_chart.append({
            "id": s.id,
            "name": s.name,
            "code": s.code or s.name[:6].upper(),
            "color": s.color,
            "completed_hours": round(s.completed_study_hours, 2),
            "target_hours": round(s.target_study_hours, 2),
            "syllabus_percentage": syllabus_pct,
            "hours_percentage": hours_pct,
            "completed_topics": comp_t,
            "total_topics": total_t,
        })

    # Task completion breakdown chart
    task_completion_chart = [
        {"name": "Completed", "value": completed_tasks_count, "color": "#10b981"},
        {"name": "In Progress", "value": in_progress_tasks_count, "color": "#3b82f6"},
        {"name": "Pending", "value": todo_tasks_count, "color": "#f59e0b"},
    ]

    # Recent study activity feed (real database records from study_sessions, focus_sessions, dsa_problems, tasks)
    recent_activity = []
    for fs in (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user_id, FocusSession.is_completed == True)
        .order_by(FocusSession.created_at.desc())
        .limit(5)
        .all()
    ):
        recent_activity.append({
            "id": f"focus-{fs.id}",
            "type": "pomodoro",
            "title": f"Completed {fs.duration_minutes}m Focus Session" + (f" ({fs.subject_name})" if fs.subject_name else ""),
            "subtitle": fs.task_title or fs.notes or "Pomodoro Focus Timer",
            "date": fs.session_date,
            "timestamp": fs.created_at.isoformat() if fs.created_at else fs.session_date,
        })

    for ss in (
        db.query(StudySession)
        .filter(StudySession.user_id == user_id)
        .order_by(StudySession.created_at.desc())
        .limit(5)
        .all()
    ):
        recent_activity.append({
            "id": f"study-{ss.id}",
            "type": "study_session",
            "title": f"{ss.title} ({ss.duration_minutes}m)",
            "subtitle": ss.session_type,
            "date": ss.session_date,
            "timestamp": ss.created_at.isoformat() if ss.created_at else ss.session_date,
        })

    for dp in (
        db.query(DSAProblem)
        .filter(DSAProblem.user_id == user_id, DSAProblem.status == "Solved")
        .order_by(DSAProblem.updated_at.desc())
        .limit(5)
        .all()
    ):
        recent_activity.append({
            "id": f"dsa-{dp.id}",
            "type": "dsa",
            "title": f"Solved DSA: {dp.title}",
            "subtitle": f"{dp.platform} • {dp.topic} ({dp.difficulty})",
            "date": dp.date_solved or today_str,
            "timestamp": dp.updated_at.isoformat() if dp.updated_at else today_str,
        })

    for tk in (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.status == "Completed")
        .order_by(Task.updated_at.desc())
        .limit(5)
        .all()
    ):
        recent_activity.append({
            "id": f"task-{tk.id}",
            "type": "task",
            "title": f"Completed Task: {tk.title}",
            "subtitle": f"{tk.assignment_type}" + (f" • {tk.subject_name}" if tk.subject_name else ""),
            "date": tk.due_date,
            "timestamp": tk.updated_at.isoformat() if tk.updated_at else tk.due_date,
        })

    recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
    quote_obj = DAILY_QUOTES[today_dt.toordinal() % len(DAILY_QUOTES)]

    return {
        "date": today_str,
        "summary_cards": {
            "total_subjects": total_subjects,
            "todays_scheduled_study_hours": todays_scheduled_study_hours,
            "actual_completed_study_hours": actual_completed_study_hours,
            "pending_tasks": pending_tasks_count,
            "completed_tasks": completed_tasks_count,
            "upcoming_exams": len(upcoming_exams_list),
            "dsa_problems_solved": dsa_solved_count,
            "current_study_streak": streak_info["current_streak"],
            "longest_study_streak": streak_info["longest_streak"],
        },
        "todays_timetable": todays_timetable,
        "next_upcoming_session": next_session,
        "todays_tasks": todays_tasks,
        "upcoming_exams": upcoming_exams_list[:5],
        "weekly_study_chart": weekly_study_chart,
        "subject_progress_chart": subject_progress_chart,
        "task_completion_chart": task_completion_chart,
        "recent_study_activity": recent_activity[:8],
        "daily_quote": quote_obj,
        "is_empty_account": (
            total_subjects == 0
            and len(todays_timetable) == 0
            and len(all_tasks) == 0
            and len(all_exams) == 0
            and len(dsa_problems) == 0
        ),
    }
