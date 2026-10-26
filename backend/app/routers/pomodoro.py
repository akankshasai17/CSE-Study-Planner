from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, FocusSession, Subject, Task
from app.schemas.schemas import FocusSessionCreate, FocusSessionResponse

router = APIRouter(prefix="/api/pomodoro", tags=["Pomodoro Focus Timer"])


@router.get("/stats")
def get_pomodoro_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    today_str = today_dt.isoformat()
    week_start_str = (today_dt - timedelta(days=today_dt.weekday())).isoformat()

    completed_focus = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.mode == "focus",
            FocusSession.is_completed == True,
        )
        .all()
    )

    total_sessions = len(completed_focus)
    total_focus_minutes = sum(s.duration_minutes for s in completed_focus)
    today_sessions = sum(1 for s in completed_focus if s.session_date == today_str)
    today_minutes = sum(s.duration_minutes for s in completed_focus if s.session_date == today_str)
    week_sessions = sum(1 for s in completed_focus if s.session_date >= week_start_str)
    week_minutes = sum(s.duration_minutes for s in completed_focus if s.session_date >= week_start_str)

    return {
        "total_completed_sessions": total_sessions,
        "total_focus_minutes": total_focus_minutes,
        "total_focus_hours": round(total_focus_minutes / 60.0, 2),
        "today_sessions": today_sessions,
        "today_focus_minutes": today_minutes,
        "week_sessions": week_sessions,
        "week_focus_minutes": week_minutes,
    }


@router.get("/sessions", response_model=List[FocusSessionResponse])
def list_focus_sessions(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.is_completed == True)
        .order_by(FocusSession.created_at.desc())
        .limit(limit)
        .all()
    )
    return sessions


@router.post("/sessions", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def save_focus_session(
    payload: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interrupted sessions cannot be saved as completed Pomodoro sessions.",
        )

    subject_name = payload.subject_name.strip()
    subj = None
    if payload.subject_id:
        subj = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == current_user.id).first()
        if subj and not subject_name:
            subject_name = subj.name

    task_title = payload.task_title.strip()
    task = None
    if payload.task_id:
        task = db.query(Task).filter(Task.id == payload.task_id, Task.user_id == current_user.id).first()
        if task and not task_title:
            task_title = task.title

    session = FocusSession(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        subject_name=subject_name,
        task_id=payload.task_id,
        task_title=task_title,
        mode=payload.mode,
        duration_minutes=payload.duration_minutes,
        session_date=payload.session_date or date.today().isoformat(),
        started_at=payload.started_at,
        completed_at=payload.completed_at,
        is_completed=True,
        notes=payload.notes,
    )
    db.add(session)

    # Update associated subject study hours and task actual minutes for focus sessions
    if payload.mode == "focus":
        if subj:
            subj.completed_study_hours = round(subj.completed_study_hours + (payload.duration_minutes / 60.0), 2)
        if task:
            task.actual_minutes = (task.actual_minutes or 0) + payload.duration_minutes

    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}")
def delete_focus_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sess = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == current_user.id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Focus session not found.")
    db.delete(sess)
    db.commit()
    return {"message": "Focus session deleted.", "id": session_id}
