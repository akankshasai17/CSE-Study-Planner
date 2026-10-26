from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    User,
    StudyPlan,
    StudyGoal,
    Subject,
    SyllabusTopic,
    Exam,
    PersonalTimetableEntry,
)
from app.schemas.schemas import (
    StudyPlanCreate,
    StudyPlanUpdate,
    StudyPlanResponse,
    StudyGoalCreate,
    StudyGoalUpdate,
    StudyGoalResponse,
)

router = APIRouter(prefix="/api/study-plans", tags=["Study Planner"])


class ConnectTimetableSessionPayload(BaseModel):
    specific_date: str
    start_time: str = "18:00"
    end_time: str = "19:00"
    color: str = "#2563eb"


def enrich_plan(plan: StudyPlan) -> StudyPlanResponse:
    goals = plan.goals or []
    planned_hrs = round(sum(g.estimated_hours for g in goals), 2)
    actual_hrs = round(sum(g.actual_hours for g in goals), 2)
    comp_count = sum(1 for g in goals if g.status == "completed")
    comp_pct = round((comp_count / len(goals)) * 100.0, 1) if goals else 0.0

    resp = StudyPlanResponse.model_validate(plan)
    resp.planned_hours = planned_hrs
    resp.actual_hours = actual_hrs
    resp.completion_percentage = comp_pct
    return resp


@router.get("", response_model=List[StudyPlanResponse])
def list_study_plans(
    plan_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id)
    if plan_type:
        q = q.filter(StudyPlan.plan_type == plan_type)
    plans = q.order_by(StudyPlan.created_at.desc()).all()
    return [enrich_plan(p) for p in plans]


@router.post("", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(
    payload: StudyPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = StudyPlan(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description,
        plan_type=payload.plan_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        subject_id=payload.subject_id,
        exam_id=payload.exam_id,
        target_hours=payload.target_hours,
        status=payload.status,
    )
    db.add(plan)
    db.flush()

    if payload.initial_goals:
        for g in payload.initial_goals:
            goal = StudyGoal(
                plan_id=plan.id,
                user_id=current_user.id,
                subject_id=g.subject_id or payload.subject_id,
                topic_id=g.topic_id,
                timetable_entry_id=g.timetable_entry_id,
                title=g.title.strip(),
                chapter_name=g.chapter_name,
                topic_name=g.topic_name,
                estimated_hours=g.estimated_hours,
                actual_hours=g.actual_hours,
                target_date=g.target_date or payload.end_date,
                status=g.status,
                notes=g.notes,
                resources_url=g.resources_url,
            )
            db.add(goal)

    db.commit()
    db.refresh(plan)
    return enrich_plan(plan)


@router.post("/from-exam/{exam_id}", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan_from_exam_syllabus(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a structured study plan automatically from an exam's syllabus (or its associated subject's syllabus)."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    today_str = date.today().isoformat()
    end_date_str = exam.exam_date if exam.exam_date >= today_str else today_str

    plan = StudyPlan(
        user_id=current_user.id,
        title=f"Exam Prep Plan: {exam.exam_name} ({exam.subject_name})",
        description=f"Structured revision and topic mastery plan generated from {exam.exam_name} syllabus.",
        plan_type="exam_syllabus",
        start_date=today_str,
        end_date=end_date_str,
        subject_id=exam.subject_id,
        exam_id=exam.id,
        target_hours=12.0,
        status="active",
    )
    db.add(plan)
    db.flush()

    total_est = 0.0
    if exam.syllabus_topics:
        for item in exam.syllabus_topics:
            est = float(item.get("estimated_hours", 2.0))
            total_est += est
            is_comp = bool(item.get("completed", False))
            goal = StudyGoal(
                plan_id=plan.id,
                user_id=current_user.id,
                subject_id=exam.subject_id,
                title=item.get("title", "Syllabus Topic"),
                chapter_name=exam.subject_name,
                topic_name=item.get("title", "Syllabus Topic"),
                estimated_hours=est,
                actual_hours=est if is_comp else 0.0,
                target_date=end_date_str,
                status="completed" if is_comp else "pending",
                notes=f"Exam preparation for {exam.exam_name}",
            )
            db.add(goal)
    elif exam.subject_id:
        subj_topics = (
            db.query(SyllabusTopic)
            .filter(SyllabusTopic.subject_id == exam.subject_id, SyllabusTopic.user_id == current_user.id)
            .all()
        )
        for st in subj_topics:
            total_est += st.estimated_hours
            goal = StudyGoal(
                plan_id=plan.id,
                user_id=current_user.id,
                subject_id=exam.subject_id,
                topic_id=st.id,
                title=st.topic_title,
                chapter_name=st.chapter_title,
                topic_name=st.topic_title,
                estimated_hours=st.estimated_hours,
                actual_hours=st.estimated_hours if st.is_completed else 0.0,
                target_date=end_date_str,
                status="completed" if st.is_completed else "pending",
                notes=st.notes,
            )
            db.add(goal)

    if total_est > 0:
        plan.target_hours = round(total_est, 2)

    db.commit()
    db.refresh(plan)
    return enrich_plan(plan)


@router.put("/{plan_id}", response_model=StudyPlanResponse)
def update_study_plan(
    plan_id: int,
    payload: StudyPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)

    db.commit()
    db.refresh(plan)
    return enrich_plan(plan)


@router.delete("/{plan_id}")
def delete_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")
    db.delete(plan)
    db.commit()
    return {"message": "Study plan deleted.", "id": plan_id}


# ==================== STUDY GOALS / TOPICS WITHIN A PLAN ====================

@router.post("/{plan_id}/goals", response_model=StudyGoalResponse, status_code=status.HTTP_201_CREATED)
def add_study_goal(
    plan_id: int,
    payload: StudyGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")

    goal = StudyGoal(
        plan_id=plan.id,
        user_id=current_user.id,
        subject_id=payload.subject_id or plan.subject_id,
        topic_id=payload.topic_id,
        timetable_entry_id=payload.timetable_entry_id,
        title=payload.title.strip(),
        chapter_name=payload.chapter_name,
        topic_name=payload.topic_name,
        estimated_hours=payload.estimated_hours,
        actual_hours=payload.actual_hours,
        target_date=payload.target_date or plan.end_date,
        status=payload.status,
        notes=payload.notes,
        resources_url=payload.resources_url,
        completed_at=datetime.now(timezone.utc) if payload.status == "completed" else None,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{plan_id}/goals/{goal_id}", response_model=StudyGoalResponse)
def update_study_goal(
    plan_id: int,
    goal_id: int,
    payload: StudyGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(StudyGoal)
        .filter(
            StudyGoal.id == goal_id,
            StudyGoal.plan_id == plan_id,
            StudyGoal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Study goal not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data:
        if update_data["status"] == "completed" and goal.status != "completed":
            goal.completed_at = datetime.now(timezone.utc)
            if goal.actual_hours == 0:
                goal.actual_hours = goal.estimated_hours
        elif update_data["status"] != "completed":
            goal.completed_at = None

    for k, v in update_data.items():
        setattr(goal, k, v)

    db.commit()
    db.refresh(goal)
    return goal


@router.post("/{plan_id}/goals/{goal_id}/schedule-timetable", response_model=StudyGoalResponse)
def connect_goal_to_timetable(
    plan_id: int,
    goal_id: int,
    payload: ConnectTimetableSessionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(StudyGoal)
        .filter(
            StudyGoal.id == goal_id,
            StudyGoal.plan_id == plan_id,
            StudyGoal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Study goal not found.")

    subject_name = ""
    if goal.subject_id:
        subj = db.query(Subject).filter(Subject.id == goal.subject_id, Subject.user_id == current_user.id).first()
        if subj:
            subject_name = subj.name

    dow = date.fromisoformat(payload.specific_date).weekday()
    tt_entry = PersonalTimetableEntry(
        user_id=current_user.id,
        subject_id=goal.subject_id,
        subject_name=subject_name,
        topic_id=goal.topic_id,
        topic_title=goal.topic_name or goal.chapter_name,
        title=f"Study Plan: {goal.title}",
        activity_type="Self-study",
        specific_date=payload.specific_date,
        day_of_week=dow,
        start_time=payload.start_time,
        end_time=payload.end_time,
        priority="High",
        notes=goal.notes or f"Scheduled from Study Plan #{plan_id}",
        repeat_pattern="none",
        color=payload.color,
        status="scheduled",
        is_generated=False,
    )
    db.add(tt_entry)
    db.flush()

    goal.timetable_entry_id = tt_entry.id
    if goal.status == "pending":
        goal.status = "in_progress"

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{plan_id}/goals/{goal_id}")
def delete_study_goal(
    plan_id: int,
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(StudyGoal)
        .filter(
            StudyGoal.id == goal_id,
            StudyGoal.plan_id == plan_id,
            StudyGoal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Study goal not found.")
    db.delete(goal)
    db.commit()
    return {"message": "Study goal deleted.", "id": goal_id}
