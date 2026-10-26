from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Task, Subject, PersonalTimetableEntry
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks & Assignments"])


class ScheduleTaskSessionPayload(BaseModel):
    specific_date: str
    start_time: str = "19:00"
    end_time: str = "20:00"
    color: str = "#d97706"


PRIORITY_ORDER = {"Urgent": 4, "High": 3, "Medium": 2, "Low": 1}


def enrich_task(t: Task, today_str: str) -> TaskResponse:
    resp = TaskResponse.model_validate(t)
    resp.is_overdue = t.status != "Completed" and t.due_date < today_str
    return resp


@router.get("/stats")
def get_task_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "Completed")
    in_progress = sum(1 for t in tasks if t.status == "In Progress")
    pending = sum(1 for t in tasks if t.status == "Pending")
    overdue = sum(1 for t in tasks if t.status != "Completed" and t.due_date < today_str)
    completion_pct = round((completed / total) * 100.0, 1) if total > 0 else 0.0

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "in_progress_tasks": in_progress,
        "pending_tasks": pending,
        "overdue_tasks": overdue,
        "completion_percentage": completion_pct,
    }


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    assignment_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("due_date", description="due_date or priority"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    q = db.query(Task).filter(Task.user_id == current_user.id)

    if status_filter:
        q = q.filter(Task.status == status_filter)
    if priority:
        q = q.filter(Task.priority == priority)
    if subject_id is not None:
        q = q.filter(Task.subject_id == subject_id)
    if assignment_type:
        q = q.filter(Task.assignment_type == assignment_type)

    tasks = q.all()
    if search:
        s_low = search.strip().lower()
        tasks = [
            t
            for t in tasks
            if s_low in t.title.lower()
            or s_low in t.description.lower()
            or s_low in t.subject_name.lower()
        ]

    if sort_by == "priority":
        tasks.sort(key=lambda t: (-PRIORITY_ORDER.get(t.priority, 0), t.due_date, t.due_time))
    else:
        tasks.sort(key=lambda t: (t.due_date, t.due_time))

    return [enrich_task(t, today_str) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    subject_name = payload.subject_name.strip()
    if payload.subject_id and not subject_name:
        subj = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == current_user.id).first()
        if subj:
            subject_name = subj.name

    task = Task(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        subject_name=subject_name,
        title=payload.title.strip(),
        description=payload.description,
        assignment_type=payload.assignment_type,
        due_date=payload.due_date,
        due_time=payload.due_time,
        priority=payload.priority,
        status=payload.status,
        estimated_minutes=payload.estimated_minutes,
        actual_minutes=payload.actual_minutes,
        notes=payload.notes,
        completed_at=datetime.now(timezone.utc) if payload.status == "Completed" else None,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return enrich_task(task, today_str)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data:
        if update_data["status"] == "Completed" and task.status != "Completed":
            task.completed_at = datetime.now(timezone.utc)
        elif update_data["status"] != "Completed":
            task.completed_at = None

    if "subject_id" in update_data and update_data["subject_id"]:
        subj = db.query(Subject).filter(Subject.id == update_data["subject_id"], Subject.user_id == current_user.id).first()
        if subj and not update_data.get("subject_name"):
            task.subject_name = subj.name

    for k, v in update_data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return enrich_task(task, today_str)


@router.post("/{task_id}/schedule-session", response_model=TaskResponse)
def schedule_timetable_session_for_task(
    task_id: int,
    payload: ScheduleTaskSessionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    dow = date.fromisoformat(payload.specific_date).weekday()
    tt_entry = PersonalTimetableEntry(
        user_id=current_user.id,
        subject_id=task.subject_id,
        subject_name=task.subject_name,
        task_id=task.id,
        topic_title=task.assignment_type,
        title=f"Assignment: {task.title}",
        activity_type="Assignment work",
        specific_date=payload.specific_date,
        day_of_week=dow,
        start_time=payload.start_time,
        end_time=payload.end_time,
        priority=task.priority,
        notes=task.description or task.notes,
        repeat_pattern="none",
        color=payload.color,
        status="scheduled",
        is_generated=False,
    )
    db.add(tt_entry)
    db.flush()

    task.linked_timetable_id = tt_entry.id
    if task.status == "Pending":
        task.status = "In Progress"

    db.commit()
    db.refresh(task)
    return enrich_task(task, today_str)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted.", "id": task_id}
