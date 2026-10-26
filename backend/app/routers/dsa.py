from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, DSAProblem, PersonalTimetableEntry
from app.schemas.schemas import DSAProblemCreate, DSAProblemUpdate, DSAProblemResponse

router = APIRouter(prefix="/api/dsa", tags=["DSA Practice Tracker"])


DSA_TOPICS = [
    "Arrays",
    "Strings",
    "Hashing",
    "Two Pointers",
    "Sliding Window",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Binary Search",
    "Recursion",
    "Backtracking",
    "Trees",
    "Binary Search Trees",
    "Heaps",
    "Graphs",
    "Greedy Algorithms",
    "Dynamic Programming",
    "Tries",
    "Bit Manipulation",
]


class ScheduleDSARevisionPayload(BaseModel):
    specific_date: str
    start_time: str = "20:00"
    end_time: str = "21:00"


@router.get("/topics")
def get_dsa_topics(current_user: User = Depends(get_current_user)):
    return {"topics": DSA_TOPICS}


@router.get("/stats")
def get_dsa_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_dt = date.today()
    today_str = today_dt.isoformat()
    week_start_str = (today_dt - timedelta(days=today_dt.weekday())).isoformat()

    problems = db.query(DSAProblem).filter(DSAProblem.user_id == current_user.id).all()
    total = len(problems)
    solved = [p for p in problems if p.status == "Solved"]
    attempted = [p for p in problems if p.status == "Attempted"]
    needs_revision = [p for p in problems if p.status == "Needs Revision"]
    not_started = [p for p in problems if p.status == "Not Started"]

    easy_total = sum(1 for p in problems if p.difficulty == "Easy")
    easy_solved = sum(1 for p in solved if p.difficulty == "Easy")
    medium_total = sum(1 for p in problems if p.difficulty == "Medium")
    medium_solved = sum(1 for p in solved if p.difficulty == "Medium")
    hard_total = sum(1 for p in problems if p.difficulty == "Hard")
    hard_solved = sum(1 for p in solved if p.difficulty == "Hard")

    solved_today = sum(1 for p in solved if p.date_solved == today_str)
    solved_this_week = sum(1 for p in solved if p.date_solved and p.date_solved >= week_start_str)

    daily_goal = current_user.profile.daily_dsa_goal if current_user.profile else 2
    weekly_goal = current_user.profile.weekly_dsa_goal if current_user.profile else 14

    # Topic breakdown & weak topic detection
    topic_map: Dict[str, Dict[str, Any]] = {}
    for t_name in DSA_TOPICS:
        topic_map[t_name] = {
            "topic": t_name,
            "total": 0,
            "solved": 0,
            "attempted": 0,
            "needs_revision": 0,
            "avg_time_minutes": 0,
            "total_time": 0,
        }

    for p in problems:
        t_key = p.topic if p.topic in topic_map else p.topic
        if t_key not in topic_map:
            topic_map[t_key] = {
                "topic": t_key,
                "total": 0,
                "solved": 0,
                "attempted": 0,
                "needs_revision": 0,
                "avg_time_minutes": 0,
                "total_time": 0,
            }
        entry = topic_map[t_key]
        entry["total"] += 1
        entry["total_time"] += p.time_taken_minutes or 0
        if p.status == "Solved":
            entry["solved"] += 1
        elif p.status == "Attempted":
            entry["attempted"] += 1
        elif p.status == "Needs Revision":
            entry["needs_revision"] += 1

    topic_stats = []
    weak_topics = []
    for k, v in topic_map.items():
        if v["total"] > 0:
            v["avg_time_minutes"] = round(v["total_time"] / v["total"], 1)
            v["solve_rate"] = round((v["solved"] / v["total"]) * 100.0, 1)
            topic_stats.append(v)
            if v["needs_revision"] > 0 or v["attempted"] > v["solved"] or v["solve_rate"] < 50.0:
                weak_topics.append(v)

    # 14-day problem-solving activity chart
    activity_chart = []
    for i in range(13, -1, -1):
        d_str = (today_dt - timedelta(days=i)).isoformat()
        solved_on_d = sum(1 for p in solved if p.date_solved == d_str)
        attempted_on_d = sum(1 for p in problems if p.date_attempted == d_str)
        activity_chart.append({
            "date": d_str,
            "label": d_str[5:],
            "solved": solved_on_d,
            "attempted": attempted_on_d,
        })

    return {
        "total_problems": total,
        "solved_count": len(solved),
        "attempted_count": len(attempted),
        "needs_revision_count": len(needs_revision),
        "not_started_count": len(not_started),
        "difficulty_stats": {
            "easy": {"total": easy_total, "solved": easy_solved},
            "medium": {"total": medium_total, "solved": medium_solved},
            "hard": {"total": hard_total, "solved": hard_solved},
        },
        "goals": {
            "daily_goal": daily_goal,
            "solved_today": solved_today,
            "weekly_goal": weekly_goal,
            "solved_this_week": solved_this_week,
        },
        "topic_stats": topic_stats,
        "weak_topics": weak_topics,
        "activity_chart": activity_chart,
    }


@router.get("", response_model=List[DSAProblemResponse])
def list_dsa_problems(
    platform: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(DSAProblem).filter(DSAProblem.user_id == current_user.id)
    if platform:
        q = q.filter(DSAProblem.platform == platform)
    if topic:
        q = q.filter(DSAProblem.topic == topic)
    if difficulty:
        q = q.filter(DSAProblem.difficulty == difficulty)
    if status_filter:
        q = q.filter(DSAProblem.status == status_filter)

    problems = q.order_by(DSAProblem.updated_at.desc()).all()
    if search:
        s_low = search.strip().lower()
        problems = [
            p
            for p in problems
            if s_low in p.title.lower()
            or s_low in p.topic.lower()
            or s_low in p.platform.lower()
            or s_low in p.approach.lower()
        ]
    return problems


@router.post("", response_model=DSAProblemResponse, status_code=status.HTTP_201_CREATED)
def create_dsa_problem(
    payload: DSAProblemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    date_solved = payload.date_solved
    date_attempted = payload.date_attempted

    if payload.status == "Solved" and not date_solved:
        date_solved = today_str
    if payload.status in ("Attempted", "Solved", "Needs Revision") and not date_attempted:
        date_attempted = today_str

    prob = DSAProblem(
        user_id=current_user.id,
        title=payload.title.strip(),
        platform=payload.platform,
        problem_url=payload.problem_url.strip(),
        topic=payload.topic,
        difficulty=payload.difficulty,
        date_attempted=date_attempted,
        date_solved=date_solved,
        status=payload.status,
        time_taken_minutes=payload.time_taken_minutes,
        solution_notes=payload.solution_notes,
        approach=payload.approach,
        time_complexity=payload.time_complexity,
        space_complexity=payload.space_complexity,
        review_date=payload.review_date,
    )
    db.add(prob)
    db.commit()
    db.refresh(prob)
    return prob


@router.put("/{problem_id}", response_model=DSAProblemResponse)
def update_dsa_problem(
    problem_id: int,
    payload: DSAProblemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    prob = db.query(DSAProblem).filter(DSAProblem.id == problem_id, DSAProblem.user_id == current_user.id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="DSA problem not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("status") == "Solved" and not prob.date_solved and not update_data.get("date_solved"):
        prob.date_solved = today_str
    if update_data.get("status") in ("Attempted", "Solved", "Needs Revision") and not prob.date_attempted:
        prob.date_attempted = today_str

    for k, v in update_data.items():
        setattr(prob, k, v)

    db.commit()
    db.refresh(prob)
    return prob


@router.post("/{problem_id}/schedule-revision", response_model=DSAProblemResponse)
def schedule_dsa_revision_session(
    problem_id: int,
    payload: ScheduleDSARevisionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prob = db.query(DSAProblem).filter(DSAProblem.id == problem_id, DSAProblem.user_id == current_user.id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="DSA problem not found.")

    dow = date.fromisoformat(payload.specific_date).weekday()
    tt_entry = PersonalTimetableEntry(
        user_id=current_user.id,
        subject_name="Data Structures and Algorithms",
        topic_title=f"{prob.topic} ({prob.difficulty})",
        title=f"DSA Revision: {prob.title}",
        activity_type="DSA practice",
        specific_date=payload.specific_date,
        day_of_week=dow,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location_or_link=prob.problem_url,
        priority="High",
        notes=f"Platform: {prob.platform} | Complexity: Time {prob.time_complexity}, Space {prob.space_complexity}\nApproach: {prob.approach}",
        repeat_pattern="none",
        color="#059669",
        status="scheduled",
        is_generated=False,
    )
    db.add(tt_entry)
    db.flush()

    prob.review_date = payload.specific_date
    prob.linked_timetable_id = tt_entry.id
    db.commit()
    db.refresh(prob)
    return prob


@router.delete("/{problem_id}")
def delete_dsa_problem(
    problem_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prob = db.query(DSAProblem).filter(DSAProblem.id == problem_id, DSAProblem.user_id == current_user.id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="DSA problem not found.")
    db.delete(prob)
    db.commit()
    return {"message": "DSA problem deleted.", "id": problem_id}
