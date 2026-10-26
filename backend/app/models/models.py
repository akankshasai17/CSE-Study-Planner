from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notification_preferences = relationship(
        "NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    college_timetable = relationship("CollegeTimetableEntry", back_populates="user", cascade="all, delete-orphan")
    personal_timetable = relationship("PersonalTimetableEntry", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")
    dsa_problems = relationship("DSAProblem", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    college_name = Column(String(255), default="", nullable=False)
    semester = Column(Integer, default=5, nullable=False)
    branch = Column(String(255), default="Computer Science & Engineering", nullable=False)
    roll_number = Column(String(100), default="", nullable=False)
    bio = Column(Text, default="", nullable=False)

    # Study & Schedule Generator Preferences
    daily_study_hour_target = Column(Float, default=4.0, nullable=False)
    preferred_study_start_time = Column(String(10), default="18:00", nullable=False)
    preferred_study_end_time = Column(String(10), default="22:00", nullable=False)
    preferred_session_duration = Column(Integer, default=50, nullable=False)  # minutes
    preferred_break_duration = Column(Integer, default=10, nullable=False)  # minutes
    available_weekdays = Column(JSON, default=lambda: [0, 1, 2, 3, 4, 5, 6], nullable=False)

    # College configuration metadata
    academic_week = Column(String(100), default="Week 1", nullable=False)
    college_working_days = Column(JSON, default=lambda: [0, 1, 2, 3, 4], nullable=False)
    college_start_time = Column(String(10), default="09:00", nullable=False)
    college_end_time = Column(String(10), default="16:30", nullable=False)
    lunch_start_time = Column(String(10), default="12:30", nullable=False)
    lunch_end_time = Column(String(10), default="13:30", nullable=False)

    # DSA Goals
    daily_dsa_goal = Column(Integer, default=2, nullable=False)
    weekly_dsa_goal = Column(Integer, default=14, nullable=False)

    # UI & Regional Preferences
    theme_preference = Column(String(20), default="light", nullable=False)
    timezone_preference = Column(String(100), default="Asia/Kolkata", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    browser_notifications_enabled = Column(Boolean, default=False, nullable=False)
    task_due_reminders = Column(Boolean, default=True, nullable=False)
    exam_countdown_alerts = Column(Boolean, default=True, nullable=False)
    study_session_reminders = Column(Boolean, default=True, nullable=False)
    daily_goal_reminders = Column(Boolean, default=True, nullable=False)
    pomodoro_sound_enabled = Column(Boolean, default=True, nullable=False)
    reminder_lead_minutes = Column(Integer, default=15, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="notification_preferences")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), default="", nullable=False)
    description = Column(Text, default="", nullable=False)
    semester = Column(Integer, default=5, nullable=False)
    credits = Column(Integer, default=4, nullable=False)
    priority = Column(String(30), default="Medium", nullable=False)  # Low, Medium, High, Critical
    color = Column(String(30), default="#2563eb", nullable=False)
    target_completion_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    target_study_hours = Column(Float, default=40.0, nullable=False)
    completed_study_hours = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="subjects")
    topics = relationship("SyllabusTopic", back_populates="subject", cascade="all, delete-orphan", order_by="SyllabusTopic.chapter_number, SyllabusTopic.order_index")


class SyllabusTopic(Base):
    __tablename__ = "syllabus_topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_number = Column(Integer, default=1, nullable=False)
    chapter_title = Column(String(255), default="Module 1", nullable=False)
    module_name = Column(String(255), default="Unit 1", nullable=False)
    topic_title = Column(String(255), nullable=False)
    estimated_hours = Column(Float, default=2.0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, default="", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subject = relationship("Subject", back_populates="topics")


class CollegeTimetableEntry(Base):
    __tablename__ = "college_timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_name = Column(String(255), nullable=False)
    class_type = Column(String(50), default="College lecture", nullable=False)  # College lecture, Lab session, Break
    day_of_week = Column(Integer, nullable=False, index=True)  # 0=Monday .. 6=Sunday
    start_time = Column(String(10), nullable=False)  # HH:MM (24-hr)
    end_time = Column(String(10), nullable=False)    # HH:MM (24-hr)
    faculty_name = Column(String(255), default="", nullable=False)
    room_number = Column(String(100), default="", nullable=False)
    semester = Column(Integer, default=5, nullable=False)
    color = Column(String(30), default="#4f46e5", nullable=False)
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="college_timetable")


class PersonalTimetableEntry(Base):
    __tablename__ = "personal_timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey("syllabus_topics.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    subject_name = Column(String(255), default="", nullable=False)
    topic_title = Column(String(255), default="", nullable=False)
    activity_type = Column(String(60), default="Self-study", nullable=False)
    # One-time entries have specific_date; recurring entries have day_of_week and repeat_pattern != "none"
    specific_date = Column(String(20), nullable=True, index=True)  # YYYY-MM-DD
    day_of_week = Column(Integer, nullable=True, index=True)       # 0=Monday .. 6=Sunday
    start_time = Column(String(10), nullable=False)                # HH:MM
    end_time = Column(String(10), nullable=False)                  # HH:MM
    break_duration_minutes = Column(Integer, default=0, nullable=False)
    location_or_link = Column(String(500), default="", nullable=False)
    priority = Column(String(30), default="Medium", nullable=False)
    notes = Column(Text, default="", nullable=False)
    repeat_pattern = Column(String(40), default="none", nullable=False)  # none, daily, weekdays, selected_days, weekly
    reminder_minutes = Column(Integer, default=15, nullable=False)
    color = Column(String(30), default="#2563eb", nullable=False)
    status = Column(String(30), default="scheduled", nullable=False)  # scheduled, completed, skipped
    is_generated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="personal_timetable")
    recurrence_rule = relationship(
        "RecurrenceRule", back_populates="timetable_entry", uselist=False, cascade="all, delete-orphan"
    )


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id = Column(Integer, primary_key=True, index=True)
    timetable_entry_id = Column(
        Integer, ForeignKey("personal_timetable_entries.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    frequency = Column(String(40), nullable=False)  # daily, weekdays, selected_days, weekly
    days_of_week = Column(JSON, default=list, nullable=False)  # list of ints [0..6]
    start_date = Column(String(20), nullable=False)            # YYYY-MM-DD
    end_date = Column(String(20), nullable=True)               # YYYY-MM-DD
    excluded_dates = Column(JSON, default=list, nullable=False)  # list of YYYY-MM-DD strings
    # Per-occurrence overrides: {"YYYY-MM-DD": {"status": "completed"|"skipped", "title": ..., "start_time": ..., "end_time": ...}}
    occurrence_overrides = Column(JSON, default=dict, nullable=False)

    timetable_entry = relationship("PersonalTimetableEntry", back_populates="recurrence_rule")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=False)
    plan_type = Column(String(40), default="weekly", nullable=False)  # daily, weekly, custom, exam_syllabus
    start_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(20), nullable=False)    # YYYY-MM-DD
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="SET NULL"), nullable=True)
    target_hours = Column(Float, default=10.0, nullable=False)
    status = Column(String(30), default="active", nullable=False)  # active, completed, archived
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="study_plans")
    goals = relationship("StudyGoal", back_populates="plan", cascade="all, delete-orphan")


class StudyGoal(Base):
    __tablename__ = "study_goals"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("syllabus_topics.id", ondelete="SET NULL"), nullable=True)
    timetable_entry_id = Column(Integer, ForeignKey("personal_timetable_entries.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    chapter_name = Column(String(255), default="", nullable=False)
    topic_name = Column(String(255), default="", nullable=False)
    estimated_hours = Column(Float, default=2.0, nullable=False)
    actual_hours = Column(Float, default=0.0, nullable=False)
    target_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    status = Column(String(30), default="pending", nullable=False)  # pending, in_progress, completed
    notes = Column(Text, default="", nullable=False)
    resources_url = Column(String(500), default="", nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    plan = relationship("StudyPlan", back_populates="goals")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey("syllabus_topics.id", ondelete="SET NULL"), nullable=True)
    timetable_entry_id = Column(Integer, ForeignKey("personal_timetable_entries.id", ondelete="SET NULL"), nullable=True)
    study_goal_id = Column(Integer, ForeignKey("study_goals.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    session_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(10), default="", nullable=False)
    end_time = Column(String(10), default="", nullable=False)
    duration_minutes = Column(Integer, default=0, nullable=False)
    planned_minutes = Column(Integer, default=0, nullable=False)
    session_type = Column(String(50), default="Self-study", nullable=False)
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="study_sessions")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_name = Column(String(255), default="", nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=False)
    assignment_type = Column(String(60), default="Assignment", nullable=False)
    due_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    due_time = Column(String(10), default="23:59", nullable=False)  # HH:MM
    priority = Column(String(30), default="Medium", nullable=False)  # Low, Medium, High, Urgent
    status = Column(String(30), default="Pending", nullable=False)   # Pending, In Progress, Completed
    estimated_minutes = Column(Integer, default=60, nullable=False)
    actual_minutes = Column(Integer, default=0, nullable=False)
    notes = Column(Text, default="", nullable=False)
    linked_timetable_id = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="tasks")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    exam_name = Column(String(255), nullable=False)
    subject_name = Column(String(255), nullable=False)
    exam_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(10), default="09:30", nullable=False)
    end_time = Column(String(10), default="12:30", nullable=False)
    venue = Column(String(255), default="", nullable=False)
    exam_type = Column(String(60), default="Midterm", nullable=False)
    syllabus_topics = Column(JSON, default=list, nullable=False)  # [{"id": str, "title": str, "completed": bool, "estimated_hours": float}]
    preparation_status = Column(String(50), default="Not Started", nullable=False)
    confidence_level = Column(Integer, default=3, nullable=False)  # 1 to 5
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="exams")


class DSAProblem(Base):
    __tablename__ = "dsa_problems"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    platform = Column(String(60), default="LeetCode", nullable=False)
    problem_url = Column(String(500), default="", nullable=False)
    topic = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(30), default="Medium", nullable=False)  # Easy, Medium, Hard
    date_attempted = Column(String(20), nullable=True)  # YYYY-MM-DD
    date_solved = Column(String(20), nullable=True, index=True)  # YYYY-MM-DD
    status = Column(String(40), default="Not Started", nullable=False)  # Not Started, Attempted, Solved, Needs Revision
    time_taken_minutes = Column(Integer, default=0, nullable=False)
    solution_notes = Column(Text, default="", nullable=False)
    approach = Column(Text, default="", nullable=False)
    time_complexity = Column(String(100), default="O(n)", nullable=False)
    space_complexity = Column(String(100), default="O(1)", nullable=False)
    review_date = Column(String(20), nullable=True)
    linked_timetable_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="dsa_problems")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_name = Column(String(255), default="", nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    task_title = Column(String(255), default="", nullable=False)
    mode = Column(String(30), default="focus", nullable=False)  # focus, short_break, long_break
    duration_minutes = Column(Integer, nullable=False)
    session_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    started_at = Column(String(40), default="", nullable=False)
    completed_at = Column(String(40), default="", nullable=False)
    is_completed = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="focus_sessions")


Index("ix_personal_tt_user_date", PersonalTimetableEntry.user_id, PersonalTimetableEntry.specific_date)
Index("ix_tasks_user_status_due", Task.user_id, Task.status, Task.due_date)
Index("ix_exams_user_date", Exam.user_id, Exam.exam_date)
Index("ix_dsa_user_status_topic", DSAProblem.user_id, DSAProblem.status, DSAProblem.topic)
