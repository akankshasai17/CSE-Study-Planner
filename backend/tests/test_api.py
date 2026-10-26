import os
import sys
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, get_db

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_cse_study_planner.db")
SQLALCHEMY_TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


client = TestClient(app)


def get_auth_headers(email: str, name: str = "Test Student", password: str = "SecretPass123!"):
    res = client.post(
        "/api/auth/register",
        json={"full_name": name, "email": email, "password": password, "college_name": "IIT CSE", "semester": 5},
    )
    if res.status_code == 400:
        res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_user_registration_login_and_protected_routes():
    # Unauthenticated request to protected route must fail with 401
    unauth = client.get("/api/subjects")
    assert unauth.status_code == 401

    # Register user 1
    reg = client.post(
        "/api/auth/register",
        json={
            "full_name": "Akanksha CSE",
            "email": "akanksha@cse.edu",
            "password": "StrongPassword123",
            "college_name": "NIT CSE",
            "semester": 5,
        },
    )
    assert reg.status_code == 201
    data = reg.json()
    assert "access_token" in data
    assert data["user"]["email"] == "akanksha@cse.edu"
    assert "hashed_password" not in data["user"]

    # Login user 1
    login = client.post(
        "/api/auth/login",
        json={"email": "akanksha@cse.edu", "password": "StrongPassword123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile and preferences
    prof = client.put(
        "/api/auth/profile",
        headers=headers,
        json={"daily_study_hour_target": 5.0, "preferred_session_duration": 60},
    )
    assert prof.status_code == 200
    assert prof.json()["profile"]["daily_study_hour_target"] == 5.0


def test_subject_crud_and_syllabus_topics():
    headers = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")

    # Create subject with initial topics
    res = client.post(
        "/api/subjects",
        headers=headers,
        json={
            "name": "Operating Systems",
            "code": "CS403",
            "description": "Kernels, Processes, Memory",
            "semester": 5,
            "credits": 4,
            "priority": "High",
            "color": "#0891b2",
            "target_study_hours": 40.0,
            "initial_topics": [
                {
                    "chapter_number": 1,
                    "chapter_title": "Process Management",
                    "module_name": "Unit 1",
                    "topic_title": "CPU Scheduling",
                    "estimated_hours": 3.0,
                    "is_completed": False,
                },
                {
                    "chapter_number": 2,
                    "chapter_title": "Deadlocks",
                    "module_name": "Unit 2",
                    "topic_title": "Banker's Algorithm",
                    "estimated_hours": 2.5,
                    "is_completed": False,
                },
            ],
        },
    )
    assert res.status_code == 201
    subj = res.json()
    subj_id = subj["id"]
    assert subj["total_topics"] == 2
    assert subj["syllabus_completion_percentage"] == 0.0

    # Mark first topic as completed
    topic_id = subj["topics"][0]["id"]
    t_res = client.put(
        f"/api/subjects/{subj_id}/topics/{topic_id}",
        headers=headers,
        json={"is_completed": True},
    )
    assert t_res.status_code == 200
    assert t_res.json()["is_completed"] is True

    # Log study hours
    log_res = client.post(
        f"/api/subjects/{subj_id}/log-hours",
        headers=headers,
        json={"hours_to_add": 2.0, "topic_id": topic_id, "notes": "Solved scheduling numericals"},
    )
    assert log_res.status_code == 200
    updated_subj = log_res.json()
    assert updated_subj["completed_study_hours"] == 2.0
    assert updated_subj["syllabus_completion_percentage"] == 50.0


def test_college_and_personal_timetable_conflict_and_recurring():
    headers = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")
    today_dt = date.today()
    monday_dt = today_dt - timedelta(days=today_dt.weekday())
    monday_str = monday_dt.isoformat()

    # 1. Create a Monday College Lecture 09:00 - 10:00
    col_res = client.post(
        "/api/timetable/college",
        headers=headers,
        json={
            "subject_name": "Operating Systems",
            "class_type": "College lecture",
            "day_of_week": 0,
            "start_time": "09:00",
            "end_time": "10:00",
            "faculty_name": "Dr. Sharma",
            "room_number": "LH-201",
            "semester": 5,
        },
    )
    assert col_res.status_code == 201

    # 2. Attempt to create an overlapping personal study session on Monday 09:30 - 10:30 (should return 409 Conflict)
    conflict_res = client.post(
        "/api/timetable/personal",
        headers=headers,
        json={
            "title": "OS Morning Study",
            "subject_name": "Operating Systems",
            "activity_type": "Self-study",
            "specific_date": monday_str,
            "start_time": "09:30",
            "end_time": "10:30",
            "repeat_pattern": "none",
            "allow_overlap": False,
        },
    )
    assert conflict_res.status_code == 409
    assert "conflicts" in conflict_res.json()["detail"]

    # 3. Create non-conflicting recurring weekday session 18:00 - 19:00
    rec_res = client.post(
        "/api/timetable/personal",
        headers=headers,
        json={
            "title": "Evening DSA Practice",
            "subject_name": "Data Structures and Algorithms",
            "topic_title": "Dynamic Programming",
            "activity_type": "DSA practice",
            "specific_date": monday_str,
            "start_time": "18:00",
            "end_time": "19:00",
            "repeat_pattern": "weekdays",
            "recurrence_start_date": monday_str,
        },
    )
    assert rec_res.status_code == 201
    rec_entry = rec_res.json()
    rec_id = rec_entry["id"]

    # 4. Fetch weekly view and verify Monday through Friday have the recurring session without duplicates
    wk_res = client.get(f"/api/timetable/week?start_date={monday_str}", headers=headers)
    assert wk_res.status_code == 200
    wk_data = wk_res.json()
    assert len(wk_data["days"][monday_str]) == 2  # 1 college lecture + 1 recurring personal session

    # 5. Mark single occurrence on Monday as completed
    st_res = client.patch(
        f"/api/timetable/personal/{rec_id}/status",
        headers=headers,
        json={"status": "completed", "occurrence_date": monday_str, "scope": "single"},
    )
    assert st_res.status_code == 200

    # 6. Delete single occurrence on Tuesday
    tuesday_str = (monday_dt + timedelta(days=1)).isoformat()
    del_single = client.delete(
        f"/api/timetable/personal/{rec_id}?scope=single&occurrence_date={tuesday_str}",
        headers=headers,
    )
    assert del_single.status_code == 200

    wk_after = client.get(f"/api/timetable/week?start_date={monday_str}", headers=headers).json()
    assert len(wk_after["days"][tuesday_str]) == 0  # Tuesday occurrence excluded!
    wednesday_str = (monday_dt + timedelta(days=2)).isoformat()
    assert len(wk_after["days"][wednesday_str]) == 1  # Wednesday still intact!


def test_automatic_study_schedule_generator():
    headers = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")
    today_str = date.today().isoformat()

    gen_res = client.post(
        "/api/timetable/generate-preview",
        headers=headers,
        json={
            "subject_ids": [],
            "start_date": today_str,
            "days_count": 5,
            "daily_start_time": "19:30",
            "daily_end_time": "22:00",
            "session_duration_minutes": 50,
            "break_duration_minutes": 10,
            "available_weekdays": [0, 1, 2, 3, 4, 5, 6],
            "max_daily_study_hours": 3.0,
        },
    )
    assert gen_res.status_code == 200
    preview = gen_res.json()
    assert "rule-based scheduling algorithm" in preview["algorithm_explanation"]
    assert len(preview["proposed_sessions"]) > 0

    # Accept first 2 generated sessions
    accept_res = client.post(
        "/api/timetable/accept-generated",
        headers=headers,
        json={"sessions": preview["proposed_sessions"][:2], "replace_existing_generated": False},
    )
    assert accept_res.status_code == 201
    assert len(accept_res.json()) == 2


def test_tasks_exams_dsa_and_pomodoro():
    headers = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")
    today_str = date.today().isoformat()
    next_week_str = (date.today() + timedelta(days=7)).isoformat()

    # 1. Task CRUD + schedule session
    t_res = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Implement Page Replacement Simulator",
            "subject_name": "Operating Systems",
            "assignment_type": "Coding Task",
            "due_date": next_week_str,
            "due_time": "23:59",
            "priority": "High",
            "status": "Pending",
            "estimated_minutes": 90,
        },
    )
    assert t_res.status_code == 201
    task_id = t_res.json()["id"]

    sched_t = client.post(
        f"/api/tasks/{task_id}/schedule-session",
        headers=headers,
        json={"specific_date": today_str, "start_time": "15:00", "end_time": "16:00"},
    )
    assert sched_t.status_code == 200
    assert sched_t.json()["linked_timetable_id"] is not None

    # 2. Exam CRUD + Exam Conflict Detection + Revision Schedule Generation
    ex1 = client.post(
        "/api/exams",
        headers=headers,
        json={
            "exam_name": "Midterm Exam 1",
            "subject_name": "Operating Systems",
            "exam_date": next_week_str,
            "start_time": "09:30",
            "end_time": "12:30",
            "venue": "Hall A",
            "exam_type": "Midterm",
            "syllabus_topics": [
                {"id": "1", "title": "CPU Scheduling", "completed": True, "estimated_hours": 2.0},
                {"id": "2", "title": "Deadlocks & Virtual Memory", "completed": False, "estimated_hours": 3.0},
            ],
        },
    )
    assert ex1.status_code == 201
    exam1_id = ex1.json()["id"]

    # Create conflicting exam on same date & overlapping time
    ex2 = client.post(
        "/api/exams",
        headers=headers,
        json={
            "exam_name": "DBMS Lab Viva",
            "subject_name": "Database Management Systems",
            "exam_date": next_week_str,
            "start_time": "11:00",
            "end_time": "13:00",
            "venue": "Lab 3",
            "exam_type": "Viva",
        },
    )
    assert ex2.status_code == 201
    assert exam1_id in ex2.json()["conflicting_exam_ids"]

    rev_res = client.post(
        f"/api/exams/{exam1_id}/generate-revision-schedule",
        headers=headers,
        json={
            "daily_start_time": "20:00",
            "daily_end_time": "22:00",
            "session_duration_minutes": 45,
            "break_duration_minutes": 10,
            "max_sessions_per_day": 1,
            "save_to_timetable": True,
        },
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["sessions_count"] >= 1

    # 3. DSA Tracker CRUD
    dsa_res = client.post(
        "/api/dsa",
        headers=headers,
        json={
            "title": "LRU Cache",
            "platform": "LeetCode",
            "problem_url": "https://leetcode.com/problems/lru-cache/",
            "topic": "Hashing",
            "difficulty": "Medium",
            "status": "Solved",
            "time_taken_minutes": 35,
            "approach": "HashMap + Doubly Linked List",
            "time_complexity": "O(1)",
            "space_complexity": "O(capacity)",
        },
    )
    assert dsa_res.status_code == 201
    dsa_stats = client.get("/api/dsa/stats", headers=headers).json()
    assert dsa_stats["solved_count"] == 1

    # 4. Pomodoro Focus Session saving (and rejecting interrupted sessions)
    bad_pomo = client.post(
        "/api/pomodoro/sessions",
        headers=headers,
        json={
            "mode": "focus",
            "duration_minutes": 25,
            "session_date": today_str,
            "is_completed": False,
        },
    )
    assert bad_pomo.status_code == 400

    good_pomo = client.post(
        "/api/pomodoro/sessions",
        headers=headers,
        json={
            "subject_name": "Operating Systems",
            "task_id": task_id,
            "mode": "focus",
            "duration_minutes": 25,
            "session_date": today_str,
            "is_completed": True,
            "notes": "Deep focus on page replacement",
        },
    )
    assert good_pomo.status_code == 201
    pomo_stats = client.get("/api/pomodoro/stats", headers=headers).json()
    assert pomo_stats["total_focus_minutes"] == 25


def test_analytics_and_user_data_isolation():
    # User 1 has data
    headers1 = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")
    dash1 = client.get("/api/analytics/dashboard", headers=headers1).json()
    assert dash1["summary_cards"]["total_subjects"] >= 1
    assert dash1["summary_cards"]["dsa_problems_solved"] == 1
    assert dash1["summary_cards"]["current_study_streak"] >= 1

    report1 = client.get("/api/analytics/report?days=14", headers=headers1).json()
    assert report1["metrics"]["total_completed_study_sessions"] >= 1

    # User 2 is a brand new user -> must see zero records (strict data isolation)
    headers2 = get_auth_headers("second_student@cse.edu", name="Second Student", password="Password456!")
    dash2 = client.get("/api/analytics/dashboard", headers=headers2).json()
    assert dash2["summary_cards"]["total_subjects"] == 0
    assert dash2["summary_cards"]["dsa_problems_solved"] == 0
    assert dash2["summary_cards"]["pending_tasks"] == 0
    assert dash2["is_empty_account"] is True

    subj_list2 = client.get("/api/subjects", headers=headers2).json()
    assert len(subj_list2) == 0


def test_study_planner_and_database_persistence():
    headers = get_auth_headers("akanksha@cse.edu", password="StrongPassword123")
    today_str = date.today().isoformat()
    next_week_str = (date.today() + timedelta(days=7)).isoformat()

    # 1. Create a Study Plan with initial goals
    sp_res = client.post(
        "/api/study-plans",
        headers=headers,
        json={
            "title": "Week 5 Operating Systems & DSA Sprint",
            "description": "Cover Deadlocks and Graph Algorithms",
            "plan_type": "weekly",
            "start_date": today_str,
            "end_date": next_week_str,
            "target_hours": 10.0,
            "initial_goals": [
                {
                    "title": "Master Banker's Algorithm & Resource Allocation Graphs",
                    "subject_name": "Operating Systems",
                    "chapter_title": "Chapter 2: Deadlocks",
                    "topic_title": "Deadlock Avoidance",
                    "estimated_hours": 2.5,
                    "completed_hours": 0.0,
                    "target_date": next_week_str,
                    "status": "pending",
                    "priority": "High",
                }
            ],
        },
    )
    assert sp_res.status_code == 201
    plan = sp_res.json()
    plan_id = plan["id"]
    goal_id = plan["goals"][0]["id"]
    assert len(plan["goals"]) == 1
    assert plan["completion_percentage"] == 0.0

    # 2. Update goal status to completed
    ug_res = client.put(
        f"/api/study-plans/{plan_id}/goals/{goal_id}",
        headers=headers,
        json={"status": "completed", "actual_hours": 2.5},
    )
    assert ug_res.status_code == 200
    assert ug_res.json()["status"] == "completed"

    # 3. Verify Database Persistence after engine disposal & fresh connection
    engine.dispose()
    plans_after = client.get("/api/study-plans", headers=headers).json()
    matching = [p for p in plans_after if p["id"] == plan_id]
    assert len(matching) == 1
    assert matching[0]["completion_percentage"] == 100.0
    assert matching[0]["actual_hours"] == 2.5


