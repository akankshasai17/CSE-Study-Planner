from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


def validate_hhmm(value: str) -> str:
    if not value:
        return value
    parts = value.strip().split(":")
    if len(parts) != 2:
        raise ValueError("Time must be in HH:MM format (e.g., 09:30)")
    h, m = int(parts[0]), int(parts[1])
    if not (0 <= h <= 23 and 0 <= m <= 59):
        raise ValueError("Hour must be 00-23 and minute must be 00-59")
    return f"{h:02d}:{m:02d}"


def time_to_minutes(hhmm: str) -> int:
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


# ==================== AUTH & USER PROFILE ====================

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    college_name: Optional[str] = ""
    semester: Optional[int] = 5


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)


class UserProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    college_name: str
    semester: int
    branch: str
    roll_number: str
    bio: str
    daily_study_hour_target: float
    preferred_study_start_time: str
    preferred_study_end_time: str
    preferred_session_duration: int
    preferred_break_duration: int
    available_weekdays: List[int]
    academic_week: str
    college_working_days: List[int]
    college_start_time: str
    college_end_time: str
    lunch_start_time: str
    lunch_end_time: str
    daily_dsa_goal: int
    weekly_dsa_goal: int
    theme_preference: str
    timezone_preference: str


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    college_name: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)
    branch: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None
    daily_study_hour_target: Optional[float] = Field(None, ge=0.5, le=18.0)
    preferred_study_start_time: Optional[str] = None
    preferred_study_end_time: Optional[str] = None
    preferred_session_duration: Optional[int] = Field(None, ge=15, le=240)
    preferred_break_duration: Optional[int] = Field(None, ge=0, le=60)
    available_weekdays: Optional[List[int]] = None
    academic_week: Optional[str] = None
    college_working_days: Optional[List[int]] = None
    college_start_time: Optional[str] = None
    college_end_time: Optional[str] = None
    lunch_start_time: Optional[str] = None
    lunch_end_time: Optional[str] = None
    daily_dsa_goal: Optional[int] = Field(None, ge=1, le=50)
    weekly_dsa_goal: Optional[int] = Field(None, ge=1, le=200)
    theme_preference: Optional[str] = None
    timezone_preference: Optional[str] = None


class NotificationPreferenceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    browser_notifications_enabled: bool
    task_due_reminders: bool
    exam_countdown_alerts: bool
    study_session_reminders: bool
    daily_goal_reminders: bool
    pomodoro_sound_enabled: bool
    reminder_lead_minutes: int


class NotificationPreferenceUpdateRequest(BaseModel):
    browser_notifications_enabled: Optional[bool] = None
    task_due_reminders: Optional[bool] = None
    exam_countdown_alerts: Optional[bool] = None
    study_session_reminders: Optional[bool] = None
    daily_goal_reminders: Optional[bool] = None
    pomodoro_sound_enabled: Optional[bool] = None
    reminder_lead_minutes: Optional[int] = Field(None, ge=1, le=120)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileSchema] = None
    notification_preferences: Optional[NotificationPreferenceSchema] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== SUBJECTS & SYLLABUS TOPICS ====================

class SyllabusTopicCreate(BaseModel):
    chapter_number: int = Field(default=1, ge=1, le=50)
    chapter_title: str = Field(default="Module 1", max_length=255)
    module_name: str = Field(default="Unit 1", max_length=255)
    topic_title: str = Field(..., min_length=1, max_length=255)
    estimated_hours: float = Field(default=2.0, ge=0.25, le=100.0)
    is_completed: bool = False
    notes: str = ""
    order_index: int = 0


class SyllabusTopicUpdate(BaseModel):
    chapter_number: Optional[int] = Field(None, ge=1, le=50)
    chapter_title: Optional[str] = None
    module_name: Optional[str] = None
    topic_title: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0.25, le=100.0)
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    order_index: Optional[int] = None


class SyllabusTopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    user_id: int
    chapter_number: int
    chapter_title: str
    module_name: str
    topic_title: str
    estimated_hours: float
    is_completed: bool
    completed_at: Optional[datetime] = None
    notes: str
    order_index: int
    created_at: datetime


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(default="", max_length=50)
    description: str = ""
    semester: int = Field(default=5, ge=1, le=12)
    credits: int = Field(default=4, ge=1, le=10)
    priority: str = Field(default="Medium")
    color: str = Field(default="#2563eb")
    target_completion_date: Optional[str] = None
    target_study_hours: float = Field(default=40.0, ge=1.0, le=500.0)
    completed_study_hours: float = Field(default=0.0, ge=0.0, le=500.0)
    initial_topics: Optional[List[SyllabusTopicCreate]] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = None
    description: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)
    credits: Optional[int] = Field(None, ge=1, le=10)
    priority: Optional[str] = None
    color: Optional[str] = None
    target_completion_date: Optional[str] = None
    target_study_hours: Optional[float] = Field(None, ge=1.0, le=500.0)
    completed_study_hours: Optional[float] = Field(None, ge=0.0, le=500.0)


class SubjectStudyHoursLog(BaseModel):
    hours_to_add: float = Field(..., gt=0, le=24)
    topic_id: Optional[int] = None
    session_date: Optional[str] = None
    notes: Optional[str] = ""


class SubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    code: str
    description: str
    semester: int
    credits: int
    priority: str
    color: str
    target_completion_date: Optional[str] = None
    target_study_hours: float
    completed_study_hours: float
    created_at: datetime
    updated_at: datetime
    topics: List[SyllabusTopicResponse] = []
    total_topics: int = 0
    completed_topics: int = 0
    syllabus_completion_percentage: float = 0.0
    hours_completion_percentage: float = 0.0


# ==================== TIMETABLE (COLLEGE & PERSONAL) ====================

class CollegeTimetableCreate(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str = Field(..., min_length=1, max_length=255)
    class_type: str = Field(default="College lecture")
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str
    end_time: str
    faculty_name: str = ""
    room_number: str = ""
    semester: int = 5
    color: str = "#4f46e5"
    notes: str = ""
    allow_overlap: bool = False

    @field_validator("start_time", "end_time")
    @classmethod
    def check_time_format(cls, v: str) -> str:
        return validate_hhmm(v)


class CollegeTimetableUpdate(BaseModel):
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    class_type: Optional[str] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    faculty_name: Optional[str] = None
    room_number: Optional[str] = None
    semester: Optional[int] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    allow_overlap: bool = False


class CollegeTimetableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: Optional[int] = None
    subject_name: str
    class_type: str
    day_of_week: int
    start_time: str
    end_time: str
    faculty_name: str
    room_number: str
    semester: int
    color: str
    notes: str
    created_at: datetime


class RecurrenceRuleSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    frequency: str
    days_of_week: List[int]
    start_date: str
    end_date: Optional[str] = None
    excluded_dates: List[str] = []
    occurrence_overrides: Dict[str, Any] = {}


class PersonalTimetableCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject_id: Optional[int] = None
    subject_name: str = ""
    topic_id: Optional[int] = None
    topic_title: str = ""
    task_id: Optional[int] = None
    activity_type: str = "Self-study"
    specific_date: Optional[str] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: str
    end_time: str
    break_duration_minutes: int = Field(default=0, ge=0, le=120)
    location_or_link: str = ""
    priority: str = "Medium"
    notes: str = ""
    repeat_pattern: str = "none"  # none, daily, weekdays, selected_days, weekly
    selected_days: Optional[List[int]] = None
    recurrence_start_date: Optional[str] = None
    recurrence_end_date: Optional[str] = None
    reminder_minutes: int = 15
    color: str = "#2563eb"
    status: str = "scheduled"
    allow_overlap: bool = False

    @field_validator("start_time", "end_time")
    @classmethod
    def check_time_format(cls, v: str) -> str:
        return validate_hhmm(v)


class PersonalTimetableUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_title: Optional[str] = None
    task_id: Optional[int] = None
    activity_type: Optional[str] = None
    specific_date: Optional[str] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    break_duration_minutes: Optional[int] = None
    location_or_link: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    repeat_pattern: Optional[str] = None
    selected_days: Optional[List[int]] = None
    recurrence_end_date: Optional[str] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
    status: Optional[str] = None
    allow_overlap: bool = False
    # For recurring entries: "series" or "single"
    edit_scope: str = "series"
    occurrence_date: Optional[str] = None


class PersonalTimetableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    task_id: Optional[int] = None
    title: str
    subject_name: str
    topic_title: str
    activity_type: str
    specific_date: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: str
    end_time: str
    break_duration_minutes: int
    location_or_link: str
    priority: str
    notes: str
    repeat_pattern: str
    reminder_minutes: int
    color: str
    status: str
    is_generated: bool
    created_at: datetime
    updated_at: datetime
    recurrence_rule: Optional[RecurrenceRuleSchema] = None


class ConflictCheckRequest(BaseModel):
    specific_date: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: str
    end_time: str
    repeat_pattern: str = "none"
    selected_days: Optional[List[int]] = None
    exclude_entry_id: Optional[int] = None
    exclude_source: Optional[str] = None  # "personal" or "college"


class ScheduleGeneratorRequest(BaseModel):
    subject_ids: List[int] = []
    start_date: str  # YYYY-MM-DD
    days_count: int = Field(default=7, ge=1, le=28)
    daily_start_time: str = "18:00"
    daily_end_time: str = "22:00"
    session_duration_minutes: int = Field(default=50, ge=20, le=180)
    break_duration_minutes: int = Field(default=10, ge=0, le=60)
    available_weekdays: List[int] = [0, 1, 2, 3, 4, 5, 6]
    max_daily_study_hours: float = Field(default=4.0, ge=0.5, le=14.0)
    prioritize_upcoming_exams: bool = True
    prioritize_pending_topics: bool = True


# ==================== STUDY PLANNER ====================

class StudyGoalCreate(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    timetable_entry_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    chapter_name: str = ""
    topic_name: str = ""
    estimated_hours: float = Field(default=2.0, ge=0.25, le=100.0)
    actual_hours: float = Field(default=0.0, ge=0.0, le=100.0)
    target_date: Optional[str] = None
    status: str = "pending"
    notes: str = ""
    resources_url: str = ""


class StudyGoalUpdate(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    timetable_entry_id: Optional[int] = None
    title: Optional[str] = None
    chapter_name: Optional[str] = None
    topic_name: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    target_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    resources_url: Optional[str] = None


class StudyGoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan_id: int
    user_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    timetable_entry_id: Optional[int] = None
    title: str
    chapter_name: str
    topic_name: str
    estimated_hours: float
    actual_hours: float
    target_date: Optional[str] = None
    status: str
    notes: str
    resources_url: str
    completed_at: Optional[datetime] = None
    created_at: datetime


class StudyPlanCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    plan_type: str = "weekly"  # daily, weekly, custom, exam_syllabus
    start_date: str
    end_date: str
    subject_id: Optional[int] = None
    exam_id: Optional[int] = None
    target_hours: float = Field(default=10.0, ge=0.5, le=500.0)
    status: str = "active"
    initial_goals: Optional[List[StudyGoalCreate]] = None


class StudyPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    plan_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    subject_id: Optional[int] = None
    exam_id: Optional[int] = None
    target_hours: Optional[float] = None
    status: Optional[str] = None


class StudyPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str
    plan_type: str
    start_date: str
    end_date: str
    subject_id: Optional[int] = None
    exam_id: Optional[int] = None
    target_hours: float
    status: str
    created_at: datetime
    goals: List[StudyGoalResponse] = []
    planned_hours: float = 0.0
    actual_hours: float = 0.0
    completion_percentage: float = 0.0


# ==================== TASKS & ASSIGNMENTS ====================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    subject_id: Optional[int] = None
    subject_name: str = ""
    assignment_type: str = "Assignment"
    due_date: str
    due_time: str = "23:59"
    priority: str = "Medium"  # Low, Medium, High, Urgent
    status: str = "Pending"   # Pending, In Progress, Completed
    estimated_minutes: int = Field(default=60, ge=5, le=1440)
    actual_minutes: int = Field(default=0, ge=0, le=1440)
    notes: str = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    assignment_type: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    notes: Optional[str] = None
    linked_timetable_id: Optional[int] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: Optional[int] = None
    subject_name: str
    title: str
    description: str
    assignment_type: str
    due_date: str
    due_time: str
    priority: str
    status: str
    estimated_minutes: int
    actual_minutes: int
    notes: str
    linked_timetable_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_overdue: bool = False


# ==================== EXAMS ====================

class ExamSyllabusItem(BaseModel):
    id: str
    title: str
    completed: bool = False
    estimated_hours: float = 2.0


class ExamCreate(BaseModel):
    exam_name: str = Field(..., min_length=1, max_length=255)
    subject_id: Optional[int] = None
    subject_name: str = Field(..., min_length=1, max_length=255)
    exam_date: str
    start_time: str = "09:30"
    end_time: str = "12:30"
    venue: str = ""
    exam_type: str = "Midterm"
    syllabus_topics: List[Dict[str, Any]] = []
    preparation_status: str = "Not Started"
    confidence_level: int = Field(default=3, ge=1, le=5)
    notes: str = ""


class ExamUpdate(BaseModel):
    exam_name: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    exam_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    exam_type: Optional[str] = None
    syllabus_topics: Optional[List[Dict[str, Any]]] = None
    preparation_status: Optional[str] = None
    confidence_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class ExamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: Optional[int] = None
    exam_name: str
    subject_name: str
    exam_date: str
    start_time: str
    end_time: str
    venue: str
    exam_type: str
    syllabus_topics: List[Dict[str, Any]]
    preparation_status: str
    confidence_level: int
    notes: str
    created_at: datetime
    updated_at: datetime
    days_remaining: int = 0
    is_completed_exam: bool = False
    syllabus_completion_percentage: float = 0.0
    conflicting_exam_ids: List[int] = []


# ==================== DSA TRACKER ====================

class DSAProblemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    platform: str = "LeetCode"
    problem_url: str = ""
    topic: str = "Arrays"
    difficulty: str = "Medium"  # Easy, Medium, Hard
    date_attempted: Optional[str] = None
    date_solved: Optional[str] = None
    status: str = "Not Started"  # Not Started, Attempted, Solved, Needs Revision
    time_taken_minutes: int = Field(default=0, ge=0, le=1440)
    solution_notes: str = ""
    approach: str = ""
    time_complexity: str = "O(n)"
    space_complexity: str = "O(1)"
    review_date: Optional[str] = None


class DSAProblemUpdate(BaseModel):
    title: Optional[str] = None
    platform: Optional[str] = None
    problem_url: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    date_attempted: Optional[str] = None
    date_solved: Optional[str] = None
    status: Optional[str] = None
    time_taken_minutes: Optional[int] = Field(None, ge=0, le=1440)
    solution_notes: Optional[str] = None
    approach: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    review_date: Optional[str] = None
    linked_timetable_id: Optional[int] = None


class DSAProblemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    platform: str
    problem_url: str
    topic: str
    difficulty: str
    date_attempted: Optional[str] = None
    date_solved: Optional[str] = None
    status: str
    time_taken_minutes: int
    solution_notes: str
    approach: str
    time_complexity: str
    space_complexity: str
    review_date: Optional[str] = None
    linked_timetable_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# ==================== POMODORO FOCUS SESSIONS ====================

class FocusSessionCreate(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str = ""
    task_id: Optional[int] = None
    task_title: str = ""
    mode: str = "focus"  # focus, short_break, long_break
    duration_minutes: int = Field(..., ge=1, le=240)
    session_date: str
    started_at: str = ""
    completed_at: str = ""
    is_completed: bool = True
    notes: str = ""


class FocusSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: Optional[int] = None
    subject_name: str
    task_id: Optional[int] = None
    task_title: str
    mode: str
    duration_minutes: int
    session_date: str
    started_at: str
    completed_at: str
    is_completed: bool
    notes: str
    created_at: datetime
