from datetime import date, datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    User,
    Subject,
    Task,
    Exam,
    DSAProblem,
    FocusSession,
    StudySession,
    PersonalTimetableEntry,
)
from app.services.conflict_service import expand_timetable_for_date
from app.services.analytics_service import (
    build_dashboard_summary,
    collect_daily_completed_minutes,
    collect_all_active_study_dates,
    compute_streaks,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics, Dashboard & Calendar"])


@router.get("/dashboard")
def get_dashboard_data(
    target_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_dashboard_summary(db, current_user.id, target_date)


@router.get("/report")
def get_analytics_report(
    days: int = Query(30, ge=7, le=365),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    end_dt = date.fromisoformat(end_date) if end_date else today_dt
    start_dt = date.fromisoformat(start_date) if start_date else (end_dt - timedelta(days=days - 1))
    if start_dt > end_dt:
        start_dt, end_dt = end_dt, start_dt

    start_str = start_dt.isoformat()
    end_str = end_dt.isoformat()

    # 1. Daily study hours & Planned vs Actual study time
    daily_completed_mins = collect_daily_completed_minutes(db, current_user.id, start_str, end_str)
    daily_study_chart = []
    planned_vs_actual_chart = []

    curr = start_dt
    while curr <= end_dt:
        d_str = curr.isoformat()
        day_evs = expand_timetable_for_date(db, current_user.id, d_str, include_college=False, include_personal=True)
        planned_mins = sum(
            e["duration_minutes"]
            for e in day_evs
            if e.get("status") != "skipped" and e.get("activity_type") not in ("Break", "Personal activity")
        )
        actual_mins = daily_completed_mins.get(d_str, 0.0)
        p_hrs = round(planned_mins / 60.0, 2)
        a_hrs = round(actual_mins / 60.0, 2)

        daily_study_chart.append({
            "date": d_str,
            "label": d_str[5:],
            "hours": a_hrs,
        })
        planned_vs_actual_chart.append({
            "date": d_str,
            "label": d_str[5:],
            "planned_hours": p_hrs,
            "actual_hours": a_hrs,
        })
        curr += timedelta(days=1)

    # 2. Weekly study hours aggregation (last 8 weeks or within range)
    weekly_buckets: Dict[str, Dict[str, Any]] = {}
    for item in planned_vs_actual_chart:
        d_obj = date.fromisoformat(item["date"])
        wk_monday = (d_obj - timedelta(days=d_obj.weekday())).isoformat()
        if wk_monday not in weekly_buckets:
            weekly_buckets[wk_monday] = {
                "week_start": wk_monday,
                "label": f"Wk {wk_monday[5:]}",
                "planned_hours": 0.0,
                "actual_hours": 0.0,
            }
        weekly_buckets[wk_monday]["planned_hours"] = round(
            weekly_buckets[wk_monday]["planned_hours"] + item["planned_hours"], 2
        )
        weekly_buckets[wk_monday]["actual_hours"] = round(
            weekly_buckets[wk_monday]["actual_hours"] + item["actual_hours"], 2
        )
    weekly_study_chart = list(weekly_buckets.values())

    # 3. Monthly study hours aggregation
    monthly_buckets: Dict[str, Dict[str, Any]] = {}
    for item in planned_vs_actual_chart:
        ym = item["date"][:7]
        if ym not in monthly_buckets:
            monthly_buckets[ym] = {
                "month": ym,
                "planned_hours": 0.0,
                "actual_hours": 0.0,
            }
        monthly_buckets[ym]["planned_hours"] = round(
            monthly_buckets[ym]["planned_hours"] + item["planned_hours"], 2
        )
        monthly_buckets[ym]["actual_hours"] = round(
            monthly_buckets[ym]["actual_hours"] + item["actual_hours"], 2
        )
    monthly_study_chart = list(monthly_buckets.values())

    # 4. Subject-wise study time & 5. Subject completion percentage
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    subject_study_time_chart = []
    subject_completion_chart = []

    for s in subjects:
        topics = s.topics or []
        total_t = len(topics)
        comp_t = sum(1 for t in topics if t.is_completed)
        syllabus_pct = round((comp_t / total_t) * 100.0, 1) if total_t > 0 else 0.0
        hours_pct = round(min(100.0, (s.completed_study_hours / max(1.0, s.target_study_hours)) * 100.0), 1)

        subject_study_time_chart.append({
            "subject": s.name,
            "code": s.code or s.name[:8],
            "completed_hours": round(s.completed_study_hours, 2),
            "target_hours": round(s.target_study_hours, 2),
            "color": s.color,
        })
        subject_completion_chart.append({
            "subject": s.name,
            "code": s.code or s.name[:8],
            "syllabus_completion_percentage": syllabus_pct,
            "hours_completion_percentage": hours_pct,
            "color": s.color,
        })

    most_studied_subject = None
    least_studied_subject = None
    if subjects:
        sorted_by_hrs = sorted(subjects, key=lambda x: x.completed_study_hours, reverse=True)
        most_studied_subject = {
            "name": sorted_by_hrs[0].name,
            "hours": round(sorted_by_hrs[0].completed_study_hours, 2),
        }
        least_studied_subject = {
            "name": sorted_by_hrs[-1].name,
            "hours": round(sorted_by_hrs[-1].completed_study_hours, 2),
        }

    # 6. Task completion rate
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    t_comp = sum(1 for t in tasks if t.status == "Completed")
    t_prog = sum(1 for t in tasks if t.status == "In Progress")
    t_pend = sum(1 for t in tasks if t.status == "Pending")
    task_completion_rate = round((t_comp / len(tasks)) * 100.0, 1) if tasks else 0.0
    task_chart = [
        {"status": "Completed", "count": t_comp, "color": "#10b981"},
        {"status": "In Progress", "count": t_prog, "color": "#3b82f6"},
        {"status": "Pending", "count": t_pend, "color": "#f59e0b"},
    ]

    # 7. DSA problems solved over time
    dsa_problems = (
        db.query(DSAProblem)
        .filter(DSAProblem.user_id == current_user.id, DSAProblem.status == "Solved")
        .all()
    )
    dsa_by_date: Dict[str, int] = {}
    for p in dsa_problems:
        if p.date_solved:
            dsa_by_date[p.date_solved] = dsa_by_date.get(p.date_solved, 0) + 1

    dsa_over_time_chart = []
    cumulative_dsa = 0
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.isoformat()
        cnt = dsa_by_date.get(d_str, 0)
        cumulative_dsa += cnt
        dsa_over_time_chart.append({
            "date": d_str,
            "label": d_str[5:],
            "solved_count": cnt,
            "cumulative_solved": cumulative_dsa,
        })
        curr += timedelta(days=1)

    # 8. Focus sessions completed over time
    focus_sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.mode == "focus",
            FocusSession.is_completed == True,
        )
        .all()
    )
    focus_by_date: Dict[str, Dict[str, int]] = {}
    for fs in focus_sessions:
        if fs.session_date not in focus_by_date:
            focus_by_date[fs.session_date] = {"sessions": 0, "minutes": 0}
        focus_by_date[fs.session_date]["sessions"] += 1
        focus_by_date[fs.session_date]["minutes"] += fs.duration_minutes

    focus_sessions_chart = []
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.isoformat()
        info = focus_by_date.get(d_str, {"sessions": 0, "minutes": 0})
        focus_sessions_chart.append({
            "date": d_str,
            "label": d_str[5:],
            "sessions": info["sessions"],
            "minutes": info["minutes"],
        })
        curr += timedelta(days=1)

    # Streaks & additional metrics
    active_dates = collect_all_active_study_dates(db, current_user.id)
    streaks = compute_streaks(active_dates, today_dt)

    study_sessions_count = db.query(StudySession).filter(StudySession.user_id == current_user.id).count()
    total_completed_sessions = study_sessions_count + len(focus_sessions)

    # Weekly goal completion
    daily_target = current_user.profile.daily_study_hour_target if current_user.profile else 4.0
    weekly_target_hours = round(daily_target * 7.0, 2)
    this_monday = (today_dt - timedelta(days=today_dt.weekday())).isoformat()
    this_sunday = (today_dt + timedelta(days=(6 - today_dt.weekday()))).isoformat()
    this_week_mins = sum(collect_daily_completed_minutes(db, current_user.id, this_monday, this_sunday).values())
    this_week_hours = round(this_week_mins / 60.0, 2)
    weekly_goal_completion_pct = round(min(100.0, (this_week_hours / max(1.0, weekly_target_hours)) * 100.0), 1)

    return {
        "range": {"start_date": start_str, "end_date": end_str, "days": (end_dt - start_dt).days + 1},
        "metrics": {
            "current_study_streak": streaks["current_streak"],
            "longest_study_streak": streaks["longest_streak"],
            "most_studied_subject": most_studied_subject,
            "least_studied_subject": least_studied_subject,
            "total_completed_study_sessions": total_completed_sessions,
            "weekly_goal_completion_percentage": weekly_goal_completion_pct,
            "weekly_actual_hours": this_week_hours,
            "weekly_target_hours": weekly_target_hours,
            "task_completion_rate": task_completion_rate,
        },
        "charts": {
            "daily_study_hours": daily_study_chart,
            "weekly_study_hours": weekly_study_chart,
            "monthly_study_hours": monthly_study_chart,
            "subject_study_time": subject_study_time_chart,
            "subject_completion": subject_completion_chart,
            "task_completion": task_chart,
            "dsa_solved_over_time": dsa_over_time_chart,
            "focus_sessions_completed": focus_sessions_chart,
            "planned_vs_actual": planned_vs_actual_chart,
        },
    }


@router.get("/calendar")
def get_combined_calendar_events(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Combines:
    1. College classes
    2. Personal study sessions & Revision sessions
    3. Assignments & Tasks
    4. Examinations
    """
    start_dt = date.fromisoformat(start_date)
    end_dt = date.fromisoformat(end_date)
    events: List[Dict[str, Any]] = []

    curr = start_dt
    while curr <= end_dt:
        d_str = curr.isoformat()
        tt_evs = expand_timetable_for_date(db, current_user.id, d_str, include_college=True, include_personal=True)
        for ev in tt_evs:
            events.append({
                "id": ev["occurrence_id"],
                "entity_id": ev["id"],
                "category": "college_class" if ev["source"] == "college" else (
                    "revision" if ev["activity_type"] == "Revision" else "study_session"
                ),
                "title": ev["title"],
                "subject_name": ev.get("subject_name", ""),
                "date": d_str,
                "start_time": ev["start_time"],
                "end_time": ev["end_time"],
                "color": ev.get("color", "#2563eb"),
                "status": ev.get("status", "scheduled"),
                "details": ev.get("topic_title") or ev.get("notes") or ev.get("activity_type"),
            })
        curr += timedelta(days=1)

    # Tasks in range
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.due_date >= start_date, Task.due_date <= end_date)
        .all()
    )
    for t in tasks:
        events.append({
            "id": f"task-{t.id}",
            "entity_id": t.id,
            "category": "assignment",
            "title": f"Due: {t.title}",
            "subject_name": t.subject_name,
            "date": t.due_date,
            "start_time": t.due_time,
            "end_time": t.due_time,
            "color": "#f59e0b" if t.status != "Completed" else "#10b981",
            "status": t.status,
            "details": f"{t.assignment_type} • Priority: {t.priority}",
        })

    # Exams in range
    exams = (
        db.query(Exam)
        .filter(Exam.user_id == current_user.id, Exam.exam_date >= start_date, Exam.exam_date <= end_date)
        .all()
    )
    for ex in exams:
        events.append({
            "id": f"exam-{ex.id}",
            "entity_id": ex.id,
            "category": "exam",
            "title": f"EXAM: {ex.exam_name} ({ex.subject_name})",
            "subject_name": ex.subject_name,
            "date": ex.exam_date,
            "start_time": ex.start_time,
            "end_time": ex.end_time,
            "color": "#dc2626",
            "status": ex.preparation_status,
            "details": f"{ex.exam_type} • Venue: {ex.venue or 'TBA'}",
        })

    events.sort(key=lambda e: (e["date"], e["start_time"]))
    return {"start_date": start_date, "end_date": end_date, "events": events}


@router.get("/notifications-feed")
def get_in_app_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    today_str = today_dt.isoformat()
    soon_str = (today_dt + timedelta(days=3)).isoformat()
    exam_soon_str = (today_dt + timedelta(days=7)).isoformat()

    alerts: List[Dict[str, Any]] = []
    prefs = current_user.notification_preferences

    # 1. Overdue and due-soon tasks
    if not prefs or prefs.task_due_reminders:
        due_tasks = (
            db.query(Task)
            .filter(Task.user_id == current_user.id, Task.status != "Completed", Task.due_date <= soon_str)
            .order_by(Task.due_date.asc())
            .all()
        )
        for t in due_tasks:
            is_overdue = t.due_date < today_str
            alerts.append({
                "id": f"notif-task-{t.id}",
                "type": "task_overdue" if is_overdue else "task_due_soon",
                "severity": "urgent" if is_overdue else "warning",
                "title": f"Overdue Task: {t.title}" if is_overdue else f"Task Due ({t.due_date}): {t.title}",
                "message": f"{t.assignment_type} for {t.subject_name or 'General'} due at {t.due_time}",
                "link": "/tasks",
                "date": t.due_date,
            })

    # 2. Upcoming exams within 7 days
    if not prefs or prefs.exam_countdown_alerts:
        upcoming_exams = (
            db.query(Exam)
            .filter(
                Exam.user_id == current_user.id,
                Exam.exam_date >= today_str,
                Exam.exam_date <= exam_soon_str,
                Exam.preparation_status != "Completed",
            )
            .order_by(Exam.exam_date.asc())
            .all()
        )
        for ex in upcoming_exams:
            days_left = (date.fromisoformat(ex.exam_date) - today_dt).days
            alerts.append({
                "id": f"notif-exam-{ex.id}",
                "type": "exam_countdown",
                "severity": "urgent" if days_left <= 2 else "info",
                "title": f"Exam in {days_left} day(s): {ex.exam_name}",
                "message": f"{ex.subject_name} on {ex.exam_date} ({ex.start_time}–{ex.end_time})",
                "link": "/exams",
                "date": ex.exam_date,
            })

    # 3. Today's scheduled study sessions
    if not prefs or prefs.study_session_reminders:
        todays_events = expand_timetable_for_date(
            db, current_user.id, today_str, include_college=False, include_personal=True
        )
        scheduled_today = [e for e in todays_events if e.get("status") == "scheduled"]
        for ev in scheduled_today[:3]:
            alerts.append({
                "id": f"notif-session-{ev['id']}",
                "type": "study_session",
                "severity": "info",
                "title": f"Today's Session ({ev['start_time']}): {ev['title']}",
                "message": f"{ev['activity_type']} • {ev.get('subject_name') or 'Personal Study'}",
                "link": "/timetable",
                "date": today_str,
            })

    return {"count": len(alerts), "notifications": alerts}
