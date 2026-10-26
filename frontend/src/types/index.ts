export interface UserProfile {
  id: number;
  user_id: number;
  college_name: string;
  semester: number;
  branch: string;
  roll_number: string;
  bio: string;
  daily_study_hour_target: number;
  preferred_study_start_time: string;
  preferred_study_end_time: string;
  preferred_session_duration: number;
  preferred_break_duration: number;
  available_weekdays: number[];
  academic_week: string;
  college_working_days: number[];
  college_start_time: string;
  college_end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  daily_dsa_goal: number;
  weekly_dsa_goal: number;
  theme_preference: string;
  timezone_preference: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  browser_notifications_enabled: boolean;
  task_due_reminders: boolean;
  exam_countdown_alerts: boolean;
  study_session_reminders: boolean;
  daily_goal_reminders: boolean;
  pomodoro_sound_enabled: boolean;
  reminder_lead_minutes: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
  notification_preferences?: NotificationPreference;
}

export interface SyllabusTopic {
  id: number;
  subject_id: number;
  user_id: number;
  chapter_number: number;
  chapter_title: string;
  module_name: string;
  topic_title: string;
  estimated_hours: number;
  is_completed: boolean;
  completed_at?: string | null;
  notes: string;
  order_index: number;
  created_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  code: string;
  description: string;
  semester: number;
  credits: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  color: string;
  target_completion_date?: string | null;
  target_study_hours: number;
  completed_study_hours: number;
  created_at: string;
  updated_at: string;
  topics: SyllabusTopic[];
  total_topics: number;
  completed_topics: number;
  syllabus_completion_percentage: number;
  hours_completion_percentage: number;
}

export interface CollegeTimetableEntry {
  id: number;
  user_id: number;
  subject_id?: number | null;
  subject_name: string;
  class_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  faculty_name: string;
  room_number: string;
  semester: number;
  color: string;
  notes: string;
  created_at: string;
}

export interface PersonalTimetableEntry {
  id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  task_id?: number | null;
  title: string;
  subject_name: string;
  topic_title: string;
  activity_type: string;
  specific_date?: string | null;
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  location_or_link: string;
  priority: string;
  notes: string;
  repeat_pattern: string;
  reminder_minutes: number;
  color: string;
  status: 'scheduled' | 'completed' | 'skipped';
  is_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableOccurrence {
  id: number;
  occurrence_id: string;
  source: 'college' | 'personal';
  title: string;
  subject_id?: number | null;
  subject_name: string;
  topic_id?: number | null;
  topic_title: string;
  task_id?: number | null;
  activity_type: string;
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  break_duration_minutes?: number;
  faculty_name?: string;
  room_number?: string;
  location_or_link?: string;
  priority: string;
  notes: string;
  repeat_pattern: string;
  reminder_minutes?: number;
  color: string;
  status: 'scheduled' | 'completed' | 'skipped';
  is_recurring: boolean;
  is_generated: boolean;
}

export interface TimetableConflict {
  id: number;
  source: 'college' | 'personal';
  title: string;
  subject_name: string;
  activity_type: string;
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface StudyGoal {
  id: number;
  plan_id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  timetable_entry_id?: number | null;
  title: string;
  chapter_name: string;
  topic_name: string;
  estimated_hours: number;
  actual_hours: number;
  target_date?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  resources_url: string;
  completed_at?: string | null;
  created_at: string;
}

export interface StudyPlan {
  id: number;
  user_id: number;
  title: string;
  description: string;
  plan_type: 'daily' | 'weekly' | 'custom' | 'exam_syllabus';
  start_date: string;
  end_date: string;
  subject_id?: number | null;
  exam_id?: number | null;
  target_hours: number;
  status: string;
  created_at: string;
  goals: StudyGoal[];
  planned_hours: number;
  actual_hours: number;
  completion_percentage: number;
}

export interface TaskItem {
  id: number;
  user_id: number;
  subject_id?: number | null;
  subject_name: string;
  title: string;
  description: string;
  assignment_type: string;
  due_date: string;
  due_time: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Completed';
  estimated_minutes: number;
  actual_minutes: number;
  notes: string;
  linked_timetable_id?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface ExamSyllabusItem {
  id: string;
  title: string;
  completed: boolean;
  estimated_hours: number;
}

export interface ExamItem {
  id: number;
  user_id: number;
  subject_id?: number | null;
  exam_name: string;
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  exam_type: string;
  syllabus_topics: ExamSyllabusItem[];
  preparation_status: string;
  confidence_level: number;
  notes: string;
  created_at: string;
  updated_at: string;
  days_remaining: number;
  is_completed_exam: boolean;
  syllabus_completion_percentage: number;
  conflicting_exam_ids: number[];
}

export interface DSAProblem {
  id: number;
  user_id: number;
  title: string;
  platform: string;
  problem_url: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  date_attempted?: string | null;
  date_solved?: string | null;
  status: 'Not Started' | 'Attempted' | 'Solved' | 'Needs Revision';
  time_taken_minutes: number;
  solution_notes: string;
  approach: string;
  time_complexity: string;
  space_complexity: string;
  review_date?: string | null;
  linked_timetable_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: number;
  user_id: number;
  subject_id?: number | null;
  subject_name: string;
  task_id?: number | null;
  task_title: string;
  mode: 'focus' | 'short_break' | 'long_break';
  duration_minutes: number;
  session_date: string;
  started_at: string;
  completed_at: string;
  is_completed: boolean;
  notes: string;
  created_at: string;
}
