import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Edit3,
  Trash2,
  Building2,
  AlertTriangle,
  MoveRight,
  MapPin,
  Repeat,
  List,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import axios from 'axios';
import { api, extractErrorMessage } from '@/services/api';
import {
  Subject,
  TimetableOccurrence,
  TimetableConflict,
  CollegeTimetableEntry,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

const ACTIVITY_TYPES = [
  'Self-study',
  'DSA practice',
  'Assignment work',
  'Exam preparation',
  'Revision',
  'College lecture',
  'Lab session',
  'Break',
  'Personal activity',
];

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLOR_PALETTE = [
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
];

function getMondayOfDate(dateStr: string): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  const day = dt.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  dt.setDate(dt.getDate() - diff);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TimetablePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error, warning } = useToast();
  const [searchParams] = useSearchParams();

  const todayStr = new Date().toISOString().split('T')[0];
  const initialDate = searchParams.get('date') || todayStr;

  // View modes: 'week' | 'day' | 'agenda' | 'college_config'
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'agenda' | 'college_config'>('week');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [weekStart, setWeekStart] = useState<string>(() => getMondayOfDate(initialDate));

  // Filters
  const [sourceFilter, setSourceFilter] = useState<'all' | 'college' | 'personal'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weekData, setWeekData] = useState<any | null>(null);
  const [collegeEntries, setCollegeEntries] = useState<CollegeTimetableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Personal Entry Create / Edit Modal
  const [entryModalOpen, setEntryModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimetableOccurrence | null>(null);
  const [editScope, setEditScope] = useState<'series' | 'single'>('series');
  const [detectedConflicts, setDetectedConflicts] = useState<TimetableConflict[]>([]);
  const [entryForm, setEntryForm] = useState({
    title: '',
    subject_id: '' as number | '',
    subject_name: '',
    topic_id: '' as number | '',
    topic_title: '',
    activity_type: 'Self-study',
    specific_date: todayStr,
    day_of_week: 0,
    start_time: '18:00',
    end_time: '19:00',
    break_duration_minutes: 10,
    location_or_link: '',
    priority: 'High',
    notes: '',
    repeat_pattern: 'none',
    selected_days: [0, 1, 2, 3, 4] as number[],
    recurrence_end_date: '',
    reminder_minutes: 15,
    color: '#2563eb',
  });

  // Entry Detail & Move / Delete Modal
  const [detailOccurrence, setDetailOccurrence] = useState<TimetableOccurrence | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState<boolean>(false);
  const [moveForm, setMoveForm] = useState({
    specific_date: todayStr,
    start_time: '18:00',
    end_time: '19:00',
  });
  const [deleteModalOccurrence, setDeleteModalOccurrence] = useState<TimetableOccurrence | null>(null);

  // College Class Modal & Metadata Form
  const [collegeModalOpen, setCollegeModalOpen] = useState<boolean>(false);
  const [editingCollegeEntry, setEditingCollegeEntry] = useState<CollegeTimetableEntry | null>(null);
  const [collegeConflicts, setCollegeConflicts] = useState<TimetableConflict[]>([]);
  const [collegeForm, setCollegeForm] = useState({
    subject_id: '' as number | '',
    subject_name: '',
    class_type: 'College lecture',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    faculty_name: '',
    room_number: '',
    semester: user?.profile?.semester || 5,
    color: '#4f46e5',
    notes: '',
  });
  const [collegeMetaForm, setCollegeMetaForm] = useState({
    college_name: user?.profile?.college_name || '',
    semester: user?.profile?.semester || 5,
    academic_week: user?.profile?.academic_week || 'Week 1',
    college_working_days: user?.profile?.college_working_days || [0, 1, 2, 3, 4],
    college_start_time: user?.profile?.college_start_time || '09:00',
    college_end_time: user?.profile?.college_end_time || '16:30',
    lunch_start_time: user?.profile?.lunch_start_time || '12:30',
    lunch_end_time: user?.profile?.lunch_end_time || '13:30',
  });

  // Rule-Based Study Schedule Generator Modal
  const [generatorOpen, setGeneratorOpen] = useState<boolean>(false);
  const [genForm, setGenForm] = useState({
    subject_ids: [] as number[],
    start_date: todayStr,
    days_count: 7,
    daily_start_time: user?.profile?.preferred_study_start_time || '18:00',
    daily_end_time: user?.profile?.preferred_study_end_time || '22:00',
    session_duration_minutes: user?.profile?.preferred_session_duration || 50,
    break_duration_minutes: user?.profile?.preferred_break_duration || 10,
    available_weekdays: user?.profile?.available_weekdays || [0, 1, 2, 3, 4, 5, 6],
    max_daily_study_hours: user?.profile?.daily_study_hour_target || 4.0,
    prioritize_upcoming_exams: true,
    prioritize_pending_topics: true,
    replace_existing_generated: false,
  });
  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  const fetchTimetableData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('start_date', weekStart);
      params.set('source_filter', sourceFilter);
      if (subjectFilter) params.set('subject_id', subjectFilter);
      if (activityFilter) params.set('activity_type', activityFilter);
      if (searchQuery) params.set('search', searchQuery);

      const [wkRes, subjRes, colRes] = await Promise.all([
        api.get(`/api/timetable/week?${params.toString()}`),
        api.get<Subject[]>('/api/subjects'),
        api.get<CollegeTimetableEntry[]>('/api/timetable/college'),
      ]);
      setWeekData(wkRes.data);
      setSubjects(subjRes.data);
      setCollegeEntries(colRes.data);
    } catch (err) {
      error('Failed to load timetable', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [weekStart, sourceFilter, subjectFilter, activityFilter, searchQuery, error]);

  useEffect(() => {
    fetchTimetableData();
  }, [fetchTimetableData]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const monday = getMondayOfDate(dateStr);
    if (monday !== weekStart) {
      setWeekStart(monday);
    }
  };

  const handlePrevWeek = () => {
    const prev = addDays(weekStart, -7);
    setWeekStart(prev);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = addDays(weekStart, 7);
    setWeekStart(next);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
    setWeekStart(getMondayOfDate(todayStr));
  };

  // Open Create Personal Entry Modal
  const openCreateEntryModal = (dateStr?: string, startTime?: string) => {
    const targetD = dateStr || selectedDate;
    const dow = (new Date(`${targetD}T00:00:00`).getDay() + 6) % 7;
    setEditingEntry(null);
    setDetectedConflicts([]);
    setEntryForm({
      title: '',
      subject_id: subjects[0]?.id || '',
      subject_name: subjects[0]?.name || '',
      topic_id: '',
      topic_title: '',
      activity_type: 'Self-study',
      specific_date: targetD,
      day_of_week: dow,
      start_time: startTime || '18:00',
      end_time: startTime ? `${String(Number(startTime.split(':')[0]) + 1).padStart(2, '0')}:00` : '19:00',
      break_duration_minutes: 10,
      location_or_link: '',
      priority: 'High',
      notes: '',
      repeat_pattern: 'none',
      selected_days: [dow],
      recurrence_end_date: '',
      reminder_minutes: 15,
      color: subjects[0]?.color || '#2563eb',
    });
    setEntryModalOpen(true);
  };

  const openEditOccurrenceModal = (occ: TimetableOccurrence) => {
    if (occ.source === 'college') {
      const col = collegeEntries.find((c) => c.id === occ.id);
      if (col) {
        setEditingCollegeEntry(col);
        setCollegeConflicts([]);
        setCollegeForm({
          subject_id: col.subject_id || '',
          subject_name: col.subject_name,
          class_type: col.class_type,
          day_of_week: col.day_of_week,
          start_time: col.start_time,
          end_time: col.end_time,
          faculty_name: col.faculty_name,
          room_number: col.room_number,
          semester: col.semester,
          color: col.color,
          notes: col.notes,
        });
        setCollegeModalOpen(true);
      }
      return;
    }

    setEditingEntry(occ);
    setEditScope('series');
    setDetectedConflicts([]);
    setEntryForm({
      title: occ.title,
      subject_id: occ.subject_id || '',
      subject_name: occ.subject_name || '',
      topic_id: occ.topic_id || '',
      topic_title: occ.topic_title || '',
      activity_type: occ.activity_type,
      specific_date: occ.date,
      day_of_week: occ.day_of_week,
      start_time: occ.start_time,
      end_time: occ.end_time,
      break_duration_minutes: occ.break_duration_minutes || 0,
      location_or_link: occ.location_or_link || '',
      priority: occ.priority || 'Medium',
      notes: occ.notes || '',
      repeat_pattern: occ.repeat_pattern || 'none',
      selected_days: [occ.day_of_week],
      recurrence_end_date: '',
      reminder_minutes: occ.reminder_minutes ?? 15,
      color: occ.color || '#2563eb',
    });
    setEntryModalOpen(true);
  };

  const submitPersonalEntry = async (allowOverlap: boolean = false) => {
    if (!entryForm.title.trim()) {
      error('Validation Error', 'Please provide a title for the timetable entry.');
      return;
    }
    try {
      const payload = {
        ...entryForm,
        subject_id: entryForm.subject_id ? Number(entryForm.subject_id) : null,
        topic_id: entryForm.topic_id ? Number(entryForm.topic_id) : null,
        recurrence_end_date: entryForm.recurrence_end_date || null,
        allow_overlap: allowOverlap,
        edit_scope: editScope,
        occurrence_date: editingEntry?.date || entryForm.specific_date,
      };

      if (editingEntry) {
        await api.put(`/api/timetable/personal/${editingEntry.id}`, payload);
        success('Timetable Updated', `"${entryForm.title}" updated.`);
      } else {
        await api.post('/api/timetable/personal', payload);
        success('Session Scheduled', `"${entryForm.title}" added to your timetable.`);
      }
      setEntryModalOpen(false);
      setDetectedConflicts([]);
      fetchTimetableData();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const conflictList = err.response.data?.detail?.conflicts || [];
        setDetectedConflicts(conflictList);
        warning(
          'Schedule Conflict Detected!',
          'This time slot overlaps with an existing session. Review the conflict details below.'
        );
      } else {
        error('Could not save entry', extractErrorMessage(err));
      }
    }
  };

  const handleStatusChange = async (
    occ: TimetableOccurrence,
    newStatus: 'scheduled' | 'completed' | 'skipped'
  ) => {
    if (occ.source === 'college') return;
    try {
      await api.patch(`/api/timetable/personal/${occ.id}/status`, {
        status: newStatus,
        occurrence_date: occ.date,
        scope: 'single',
      });
      success(
        newStatus === 'completed'
          ? 'Session Marked Completed!'
          : newStatus === 'skipped'
          ? 'Session Marked Skipped'
          : 'Session Restored',
        occ.title
      );
      if (detailOccurrence?.occurrence_id === occ.occurrence_id) {
        setDetailOccurrence({ ...occ, status: newStatus });
      }
      fetchTimetableData();
    } catch (err) {
      error('Failed to update status', extractErrorMessage(err));
    }
  };

  const handleDuplicateOccurrence = async (occ: TimetableOccurrence) => {
    if (occ.source === 'college') return;
    try {
      await api.post(`/api/timetable/personal/${occ.id}/duplicate?target_date=${occ.date}`);
      success('Entry Duplicated', `Created a copy of "${occ.title}".`);
      fetchTimetableData();
    } catch (err) {
      error('Duplicate failed', extractErrorMessage(err));
    }
  };

  const handleMoveOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailOccurrence) return;
    try {
      await api.patch(`/api/timetable/personal/${detailOccurrence.id}/move`, {
        specific_date: moveForm.specific_date,
        start_time: moveForm.start_time,
        end_time: moveForm.end_time,
        allow_overlap: true,
      });
      success('Session Moved', `Moved "${detailOccurrence.title}" to ${moveForm.specific_date}.`);
      setMoveModalOpen(false);
      setDetailOccurrence(null);
      fetchTimetableData();
    } catch (err) {
      error('Move failed', extractErrorMessage(err));
    }
  };

  const handleDeleteConfirmed = async (scope: 'series' | 'single') => {
    if (!deleteModalOccurrence) return;
    try {
      if (deleteModalOccurrence.source === 'college') {
        await api.delete(`/api/timetable/college/${deleteModalOccurrence.id}`);
        success('College Class Removed', deleteModalOccurrence.title);
      } else {
        await api.delete(
          `/api/timetable/personal/${deleteModalOccurrence.id}?scope=${scope}&occurrence_date=${deleteModalOccurrence.date}`
        );
        success(
          scope === 'single' ? 'Single Occurrence Deleted' : 'Timetable Entry Deleted',
          deleteModalOccurrence.title
        );
      }
      setDeleteModalOccurrence(null);
      setDetailOccurrence(null);
      fetchTimetableData();
    } catch (err) {
      error('Delete failed', extractErrorMessage(err));
    }
  };

  // College Class Save & College Metadata Save
  const submitCollegeClass = async (allowOverlap: boolean = false) => {
    if (!collegeForm.subject_name.trim()) {
      error('Validation Error', 'Subject name is required for a college class.');
      return;
    }
    try {
      const payload = {
        ...collegeForm,
        subject_id: collegeForm.subject_id ? Number(collegeForm.subject_id) : null,
        allow_overlap: allowOverlap,
      };
      if (editingCollegeEntry) {
        await api.put(`/api/timetable/college/${editingCollegeEntry.id}`, payload);
        success('College Class Updated', collegeForm.subject_name);
      } else {
        await api.post('/api/timetable/college', payload);
        success('College Class Added', `${collegeForm.subject_name} on ${WEEKDAY_NAMES[collegeForm.day_of_week]}`);
      }
      setCollegeModalOpen(false);
      setCollegeConflicts([]);
      fetchTimetableData();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setCollegeConflicts(err.response.data?.detail?.conflicts || []);
        warning('Class Overlap Detected', 'Review the conflicting class below.');
      } else {
        error('Could not save college class', extractErrorMessage(err));
      }
    }
  };

  const handleSaveCollegeMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/auth/profile', collegeMetaForm);
      await refreshUser();
      success('College Schedule Settings Saved', 'Your regular college hours and working days are updated.');
    } catch (err) {
      error('Failed to save college settings', extractErrorMessage(err));
    }
  };

  // Rule-Based Study Schedule Generator handlers
  const handleRunScheduleGenerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/api/timetable/generate-preview', genForm);
      setGeneratedPreview(res.data);
      if ((res.data.proposed_sessions || []).length === 0) {
        warning('No Slots Generated', 'Check that you have subjects added and available study hours.');
      } else {
        success('Schedule Preview Generated!', `Proposed ${res.data.proposed_sessions.length} conflict-free sessions.`);
      }
    } catch (err) {
      error('Schedule generation failed', extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptGeneratedSchedule = async () => {
    if (!generatedPreview?.proposed_sessions?.length) return;
    try {
      const res = await api.post('/api/timetable/accept-generated', {
        sessions: generatedPreview.proposed_sessions,
        replace_existing_generated: genForm.replace_existing_generated,
      });
      success('Study Timetable Saved!', `Added ${res.data.length} sessions to your personal study timetable.`);
      setGeneratorOpen(false);
      setGeneratedPreview(null);
      fetchTimetableData();
    } catch (err) {
      error('Failed to save generated schedule', extractErrorMessage(err));
    }
  };

  const stats = weekData?.statistics || {
    scheduled_hours_current_week: 0,
    completed_study_hours: 0,
    remaining_scheduled_sessions: 0,
    upcoming_sessions: 0,
    missed_study_sessions: 0,
    schedule_completion_percentage: 0,
    subject_wise_scheduled_time: [],
  };

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(weekStart, i));
  }

  const selectedDayOccurrences: TimetableOccurrence[] = weekData?.days?.[selectedDate] || [];
  const allWeekOccurrences: TimetableOccurrence[] = weekData?.occurrences || [];

  const selectedSubjectObj = subjects.find((s) => s.id === Number(entryForm.subject_id));

  return (
    <div className="space-y-6">
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Weekly Timetable &amp; Schedule Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Unified college class schedule, personal study blocks, conflict detection, and rule-based schedule generator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setGenForm((prev) => ({
                ...prev,
                subject_ids: subjects.map((s) => s.id),
                start_date: todayStr,
              }));
              setGeneratedPreview(null);
              setGeneratorOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Generate Study Schedule</span>
          </button>

          <button
            onClick={() => {
              setEditingCollegeEntry(null);
              setCollegeConflicts([]);
              setCollegeForm({
                subject_id: subjects[0]?.id || '',
                subject_name: subjects[0]?.name || '',
                class_type: 'College lecture',
                day_of_week: 0,
                start_time: '09:00',
                end_time: '10:00',
                faculty_name: '',
                room_number: '',
                semester: user?.profile?.semester || 5,
                color: '#4f46e5',
                notes: '',
              });
              setCollegeModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>+ Add College Class</span>
          </button>

          <button
            onClick={() => openCreateEntryModal()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Study Session</span>
          </button>
        </div>
      </div>

      {/* Section 6.I: Timetable Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Scheduled This Week</p>
          <p className="text-xl font-extrabold text-blue-600 mt-0.5">{stats.scheduled_hours_current_week}h</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Completed Hours</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{stats.completed_study_hours}h</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Schedule Completion</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{stats.schedule_completion_percentage}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Remaining Sessions</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.remaining_scheduled_sessions}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Upcoming Sessions</p>
          <p className="text-xl font-extrabold text-purple-600 mt-0.5">{stats.upcoming_sessions}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500">Missed / Skipped</p>
          <p className="text-xl font-extrabold text-amber-600 mt-0.5">{stats.missed_study_sessions}</p>
        </div>
      </div>

      {/* Navigation, View Mode Switcher & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 ml-1">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && handleSelectDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* View Switcher: Week | Day | Agenda | College Schedule Config */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Week View</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Day View</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda / List</span>
            </button>
            <button
              onClick={() => setViewMode('college_config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'college_config'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>College Setup</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search session title or topic..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="all">Combined View (College + Personal Study)</option>
            <option value="college">College Classes Only</option>
            <option value="personal">Personal Study Timetable Only</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="">All Activity Types</option>
            {ACTIVITY_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: WEEKLY TIMETABLE GRID (Mon - Sun) */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* 7-Day Column Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[980px] grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
              {weekDates.map((dStr, idx) => {
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedDate;
                const dayEvents: TimetableOccurrence[] = weekData?.days?.[dStr] || [];

                return (
                  <div
                    key={dStr}
                    className={`flex flex-col min-h-[520px] ${
                      isToday
                        ? 'bg-blue-50/30 dark:bg-blue-950/15'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      onClick={() => setSelectedDate(dStr)}
                      className={`p-3 border-b cursor-pointer transition-colors flex items-center justify-between ${
                        isToday
                          ? 'bg-blue-600 text-white border-blue-600'
                          : isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-extrabold uppercase ${isToday ? 'text-white' : 'text-slate-500'}`}>
                          {SHORT_DAYS[idx]}
                        </p>
                        <p className={`text-sm font-black ${isToday ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                          {dStr.slice(5)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateEntryModal(dStr);
                        }}
                        className={`p-1 rounded-lg ${
                          isToday
                            ? 'hover:bg-blue-700 text-white'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'
                        }`}
                        title={`Add session on ${dStr}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day Sessions Stack (Sorted Vertically by Time Slot) */}
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                      {dayEvents.length === 0 ? (
                        <div
                          onClick={() => openCreateEntryModal(dStr)}
                          className="h-32 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors text-center px-2"
                        >
                          + Click to add session
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const isCollege = ev.source === 'college';
                          const isCompleted = ev.status === 'completed';
                          const isSkipped = ev.status === 'skipped';

                          return (
                            <div
                              key={ev.occurrence_id}
                              onClick={() => setDetailOccurrence(ev)}
                              className={`group relative rounded-xl p-2.5 border text-left cursor-pointer transition-all hover:shadow-md ${
                                isCollege
                                  ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50'
                                  : isCompleted
                                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40'
                                  : isSkipped
                                  ? 'border-amber-200 dark:border-amber-900 bg-slate-100/70 dark:bg-slate-800/40 opacity-65'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90'
                              }`}
                              style={{
                                borderLeftWidth: '4px',
                                borderLeftColor: ev.color || '#2563eb',
                              }}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {ev.start_time}–{ev.end_time}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                    isCollege
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {isCollege ? 'COLLEGE' : ev.activity_type}
                                </span>
                              </div>

                              <p
                                className={`text-xs font-bold leading-snug ${
                                  isCompleted ? 'line-through text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {ev.title}
                              </p>

                              {ev.subject_name && (
                                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                                  {ev.subject_name}
                                </p>
                              )}

                              {ev.topic_title && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {ev.topic_title}
                                </p>
                              )}

                              {/* Quick Actions on Hover for Personal Study Entries */}
                              {!isCollege && (
                                <div
                                  className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(ev, isCompleted ? 'scheduled' : 'completed')
                                      }
                                      className={`p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950 ${
                                        isCompleted ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                                      }`}
                                      title="Mark Completed"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(ev, isSkipped ? 'scheduled' : 'skipped')}
                                      className={`p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950 ${
                                        isSkipped ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'
                                      }`}
                                      title="Mark Skipped"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditOccurrenceModal(ev)}
                                      className="p-1 rounded text-slate-400 hover:text-blue-600"
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteModalOccurrence(ev)}
                                      className="p-1 rounded text-slate-400 hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DAY VIEW (Vertical Hourly Timeline for Selected Date) */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Day Schedule for {selectedDate} (
                {WEEKDAY_NAMES[(new Date(`${selectedDate}T00:00:00`).getDay() + 6) % 7]})
              </h2>
              <p className="text-xs text-slate-500">{selectedDayOccurrences.length} total sessions scheduled</p>
            </div>
            <button
              onClick={() => openCreateEntryModal(selectedDate)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              + Add to {selectedDate}
            </button>
          </div>

          {selectedDayOccurrences.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
              No classes or study sessions scheduled on {selectedDate}.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayOccurrences.map((ev) => (
                <div
                  key={ev.occurrence_id}
                  onClick={() => setDetailOccurrence(ev)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderLeftWidth: '5px', borderLeftColor: ev.color }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-600">
                        {ev.start_time} – {ev.end_time} ({ev.duration_minutes}m)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {ev.source === 'college' ? 'College Class' : ev.activity_type}
                      </span>
                      {ev.is_recurring && (
                        <span className="text-[10px] text-purple-600 flex items-center gap-0.5 font-semibold">
                          <Repeat className="w-3 h-3" /> {ev.repeat_pattern}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ev.title}</h3>
                    <p className="text-xs text-slate-500">
                      {ev.subject_name} {ev.topic_title ? `• ${ev.topic_title}` : ''}
                    </p>
                  </div>

                  {ev.source === 'personal' && (
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStatusChange(ev, 'completed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDuplicateOccurrence(ev)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditOccurrenceModal(ev)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalOccurrence(ev)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: AGENDA / LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold">Weekly Agenda List ({weekStart} to {addDays(weekStart, 6)})</h2>
            <p className="text-xs text-slate-500">Chronological view of all college classes and personal sessions</p>
          </div>

          {allWeekOccurrences.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No sessions scheduled for this week.
            </div>
          ) : (
            <div className="space-y-4">
              {weekDates.map((dStr, idx) => {
                const evs = weekData?.days?.[dStr] || [];
                if (evs.length === 0) return null;
                return (
                  <div key={dStr} className="space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
                      {WEEKDAY_NAMES[idx]} • {dStr} ({evs.length} sessions)
                    </h3>
                    <div className="space-y-2 pl-2">
                      {evs.map((ev: TimetableOccurrence) => (
                        <div
                          key={ev.occurrence_id}
                          onClick={() => setDetailOccurrence(ev)}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-8 rounded-full" style={{ backgroundColor: ev.color }} />
                            <div>
                              <p className="text-xs font-bold">{ev.title}</p>
                              <p className="text-[11px] text-slate-500">
                                {ev.start_time} – {ev.end_time} • {ev.subject_name || ev.activity_type}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold uppercase text-slate-500">{ev.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: REGULAR COLLEGE CLASS TIMETABLE CONFIGURATION */}
      {viewMode === 'college_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* College Metadata Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold mb-1">Regular College Schedule Config</h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure your college working days, semester, academic week, and lunch break.
            </p>
            <form onSubmit={handleSaveCollegeMetadata} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  value={collegeMetaForm.college_name}
                  onChange={(e) => setCollegeMetaForm({ ...collegeMetaForm, college_name: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={collegeMetaForm.semester}
                    onChange={(e) => setCollegeMetaForm({ ...collegeMetaForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Academic Week
                  </label>
                  <input
                    type="text"
                    value={collegeMetaForm.academic_week}
                    onChange={(e) => setCollegeMetaForm({ ...collegeMetaForm, academic_week: e.target.value })}
                    placeholder="e.g. Week 6"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Lunch Start
                  </label>
                  <input
                    type="time"
                    value={collegeMetaForm.lunch_start_time}
                    onChange={(e) => setCollegeMetaForm({ ...collegeMetaForm, lunch_start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Lunch End</label>
                  <input
                    type="time"
                    value={collegeMetaForm.lunch_end_time}
                    onChange={(e) => setCollegeMetaForm({ ...collegeMetaForm, lunch_end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Save College Settings
              </button>
            </form>
          </div>

          {/* Weekly College Classes List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Weekly College Classes &amp; Labs ({collegeEntries.length})</h2>
                <p className="text-xs text-slate-500">
                  The schedule generator never schedules personal study sessions over your college classes.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCollegeEntry(null);
                  setCollegeModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Add Class Slot
              </button>
            </div>

            {collegeEntries.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                No regular college classes added yet. Click &ldquo;+ Add Class Slot&rdquo; to enter your lectures and
                labs.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {collegeEntries.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {WEEKDAY_NAMES[c.day_of_week]} • {c.start_time}–{c.end_time}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-bold">
                          {c.class_type}
                        </span>
                      </div>
                      <p className="text-sm font-bold mt-0.5">{c.subject_name}</p>
                      <p className="text-xs text-slate-500">
                        {c.faculty_name ? `Prof. ${c.faculty_name} • ` : ''}
                        {c.room_number ? `Room/Lab: ${c.room_number}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCollegeEntry(c);
                          setCollegeForm({
                            subject_id: c.subject_id || '',
                            subject_name: c.subject_name,
                            class_type: c.class_type,
                            day_of_week: c.day_of_week,
                            start_time: c.start_time,
                            end_time: c.end_time,
                            faculty_name: c.faculty_name,
                            room_number: c.room_number,
                            semester: c.semester,
                            color: c.color,
                            notes: c.notes,
                          });
                          setCollegeModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          await api.delete(`/api/timetable/college/${c.id}`);
                          success('College Class Deleted');
                          fetchTimetableData();
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Personal Timetable Entry (with Conflict Detection) */}
      <Modal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        title={editingEntry ? 'Edit Study / Timetable Session' : 'Create Study / Timetable Entry'}
        subtitle="Schedule self-study, DSA practice, assignment work, exam preparation, or revision"
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitPersonalEntry(false);
          }}
          className="space-y-4"
        >
          {/* Conflict Detection Warning Banner */}
          {detectedConflicts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Schedule Conflict Detected ({detectedConflicts.length} overlapping session(s)):</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-200 pl-5 list-disc">
                {detectedConflicts.map((c, idx) => (
                  <li key={idx}>
                    <strong>{c.title}</strong> ({c.source === 'college' ? 'College Class' : c.activity_type}) on{' '}
                    {c.date} from {c.start_time} to {c.end_time}
                  </li>
                ))}
              </ul>
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => submitPersonalEntry(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Confirm Allowed Exception (Save Anyway)
                </button>
              </div>
            </div>
          )}

          {editingEntry && editingEntry.is_recurring && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-200">
                Recurring Entry Edit Scope:
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={editScope === 'single'}
                    onChange={() => setEditScope('single')}
                  />
                  <span>This Occurrence ({editingEntry.date})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={editScope === 'series'}
                    onChange={() => setEditScope('series')}
                  />
                  <span>Entire Series</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Session Title *
              </label>
              <input
                type="text"
                required
                value={entryForm.title}
                onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                placeholder="e.g. Dynamic Programming Practice"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Activity Type *
              </label>
              <select
                value={entryForm.activity_type}
                onChange={(e) => setEntryForm({ ...entryForm, activity_type: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Subject</label>
              <select
                value={entryForm.subject_id}
                onChange={(e) => {
                  const idVal = e.target.value ? Number(e.target.value) : '';
                  const found = subjects.find((s) => s.id === idVal);
                  setEntryForm({
                    ...entryForm,
                    subject_id: idVal,
                    subject_name: found ? found.name : entryForm.subject_name,
                    color: found ? found.color : entryForm.color,
                  });
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- General / Custom Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Topic or Chapter
              </label>
              {selectedSubjectObj && selectedSubjectObj.topics?.length > 0 ? (
                <select
                  value={entryForm.topic_title}
                  onChange={(e) => setEntryForm({ ...entryForm, topic_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- Select or type topic below --</option>
                  {selectedSubjectObj.topics.map((t) => (
                    <option key={t.id} value={t.topic_title}>
                      Ch {t.chapter_number}: {t.topic_title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={entryForm.topic_title}
                  onChange={(e) => setEntryForm({ ...entryForm, topic_title: e.target.value })}
                  placeholder="e.g. Trees & Graph Traversals"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={entryForm.specific_date}
                onChange={(e) => {
                  const d = e.target.value;
                  const dow = d ? (new Date(`${d}T00:00:00`).getDay() + 6) % 7 : 0;
                  setEntryForm({ ...entryForm, specific_date: d, day_of_week: dow });
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={entryForm.start_time}
                onChange={(e) => setEntryForm({ ...entryForm, start_time: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={entryForm.end_time}
                onChange={(e) => setEntryForm({ ...entryForm, end_time: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Recurrence & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Repeat Pattern
              </label>
              <select
                value={entryForm.repeat_pattern}
                onChange={(e) => setEntryForm({ ...entryForm, repeat_pattern: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="none">One-time event</option>
                <option value="daily">Daily recurring</option>
                <option value="weekdays">Weekdays (Mon–Fri)</option>
                <option value="selected_days">Selected weekdays</option>
                <option value="weekly">Weekly recurring</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={entryForm.priority}
                onChange={(e) => setEntryForm({ ...entryForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Break After (mins)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={entryForm.break_duration_minutes}
                onChange={(e) => setEntryForm({ ...entryForm, break_duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {entryForm.repeat_pattern === 'selected_days' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Select Recurring Days
              </label>
              <div className="flex flex-wrap gap-2">
                {SHORT_DAYS.map((d, idx) => {
                  const active = entryForm.selected_days.includes(idx);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? entryForm.selected_days.filter((x) => x !== idx)
                          : [...entryForm.selected_days, idx];
                        setEntryForm({ ...entryForm, selected_days: next });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {entryForm.repeat_pattern !== 'none' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Recurrence End Date (Optional)
              </label>
              <input
                type="date"
                value={entryForm.recurrence_end_date}
                onChange={(e) => setEntryForm({ ...entryForm, recurrence_end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Location / Online Meeting Link
              </label>
              <input
                type="text"
                value={entryForm.location_or_link}
                onChange={(e) => setEntryForm({ ...entryForm, location_or_link: e.target.value })}
                placeholder="Room 302 / Library / Google Meet URL"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Color Label</label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEntryForm({ ...entryForm, color: c })}
                    className={`w-6 h-6 rounded-full ${
                      entryForm.color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={entryForm.notes}
              onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
              placeholder="Pages to read, problem links, key formulas..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEntryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              {editingEntry ? 'Update Entry' : 'Save Timetable Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Add / Edit College Class */}
      <Modal
        isOpen={collegeModalOpen}
        onClose={() => setCollegeModalOpen(false)}
        title={editingCollegeEntry ? 'Edit College Class' : 'Add Regular College Class'}
        subtitle="Weekly recurring college lecture, lab session, or break"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCollegeClass(false);
          }}
          className="space-y-4"
        >
          {collegeConflicts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-xs space-y-2">
              <p className="font-bold text-amber-800 dark:text-amber-200">
                Overlap detected with {collegeConflicts[0].title} ({collegeConflicts[0].start_time}–
                {collegeConflicts[0].end_time})
              </p>
              <button
                type="button"
                onClick={() => submitCollegeClass(true)}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold"
              >
                Save Anyway
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={collegeForm.subject_name}
                onChange={(e) => setCollegeForm({ ...collegeForm, subject_name: e.target.value })}
                placeholder="e.g. Operating Systems"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Class Type</label>
              <select
                value={collegeForm.class_type}
                onChange={(e) => setCollegeForm({ ...collegeForm, class_type: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="College lecture">College lecture</option>
                <option value="Lab session">Lab session</option>
                <option value="Break">Break</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Day of Week</label>
              <select
                value={collegeForm.day_of_week}
                onChange={(e) => setCollegeForm({ ...collegeForm, day_of_week: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {WEEKDAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={collegeForm.start_time}
                onChange={(e) => setCollegeForm({ ...collegeForm, start_time: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                required
                value={collegeForm.end_time}
                onChange={(e) => setCollegeForm({ ...collegeForm, end_time: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Faculty Name (Optional)
              </label>
              <input
                type="text"
                value={collegeForm.faculty_name}
                onChange={(e) => setCollegeForm({ ...collegeForm, faculty_name: e.target.value })}
                placeholder="e.g. Dr. Ramesh Kumar"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Room / Lab Number
              </label>
              <input
                type="text"
                value={collegeForm.room_number}
                onChange={(e) => setCollegeForm({ ...collegeForm, room_number: e.target.value })}
                placeholder="e.g. CS-Lab 2 / LH-104"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCollegeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Save College Class
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Rule-Based Automatic Study Schedule Generator */}
      <Modal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        title="Automatic Rule-Based Study Schedule Generator"
        subtitle="Deterministic priority-weighted scheduling engine (not an AI prediction system)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
            <strong>How this Rule-Based Algorithm works:</strong> It inspects your existing college classes and personal
            timetable, avoids all conflicts, respects your daily study window and maximum daily hours, prioritizes
            subjects with closer upcoming exams and higher priority, schedules pending syllabus topics before completed
            ones, and inserts breaks between study blocks.
          </div>

          <form onSubmit={handleRunScheduleGenerator} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={genForm.start_date}
                  onChange={(e) => setGenForm({ ...genForm, start_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Days to Plan</label>
                <input
                  type="number"
                  min={1}
                  max={21}
                  value={genForm.days_count}
                  onChange={(e) => setGenForm({ ...genForm, days_count: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Daily Window Start</label>
                <input
                  type="time"
                  value={genForm.daily_start_time}
                  onChange={(e) => setGenForm({ ...genForm, daily_start_time: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Daily Window End</label>
                <input
                  type="time"
                  value={genForm.daily_end_time}
                  onChange={(e) => setGenForm({ ...genForm, daily_end_time: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Session Duration (mins)
                </label>
                <input
                  type="number"
                  min={25}
                  max={180}
                  step={5}
                  value={genForm.session_duration_minutes}
                  onChange={(e) => setGenForm({ ...genForm, session_duration_minutes: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Break Between Sessions (mins)
                </label>
                <input
                  type="number"
                  min={0}
                  max={45}
                  step={5}
                  value={genForm.break_duration_minutes}
                  onChange={(e) => setGenForm({ ...genForm, break_duration_minutes: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Max Daily Study Hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  step={0.5}
                  value={genForm.max_daily_study_hours}
                  onChange={(e) => setGenForm({ ...genForm, max_daily_study_hours: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Available Weekdays */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Available Weekdays</label>
              <div className="flex flex-wrap gap-2">
                {SHORT_DAYS.map((d, i) => {
                  const active = genForm.available_weekdays.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? genForm.available_weekdays.filter((w) => w !== i)
                          : [...genForm.available_weekdays, i];
                        setGenForm({ ...genForm, available_weekdays: next });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        active
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={generating}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
              >
                {generating ? 'Computing Schedule...' : generatedPreview ? 'Regenerate Preview' : 'Generate Preview'}
              </button>
            </div>
          </form>

          {/* Preview Results */}
          {generatedPreview && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold">
                    Proposed Schedule Preview ({generatedPreview.proposed_sessions?.length || 0} sessions •{' '}
                    {generatedPreview.summary?.total_study_hours || 0}h total)
                  </h4>
                  <p className="text-xs text-slate-500">{generatedPreview.algorithm_explanation}</p>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={genForm.replace_existing_generated}
                    onChange={(e) => setGenForm({ ...genForm, replace_existing_generated: e.target.checked })}
                  />
                  <span>Replace previous auto-generated sessions</span>
                </label>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {(generatedPreview.proposed_sessions || []).map((sess: any, idx: number) => (
                  <div
                    key={sess.temp_id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: sess.color }} />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{sess.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {sess.specific_date} ({SHORT_DAYS[sess.day_of_week]}) • {sess.start_time}–{sess.end_time} •{' '}
                          {sess.reason}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = generatedPreview.proposed_sessions.filter((_: any, i: number) => i !== idx);
                        setGeneratedPreview({ ...generatedPreview, proposed_sessions: filtered });
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove from preview"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedPreview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Discard Preview
                </button>
                <button
                  type="button"
                  onClick={handleAcceptGeneratedSchedule}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Accept &amp; Save to Timetable ({generatedPreview.proposed_sessions?.length || 0})
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 4: Session Details & Quick Actions Drawer/Modal */}
      <Modal
        isOpen={!!detailOccurrence}
        onClose={() => setDetailOccurrence(null)}
        title={detailOccurrence?.title || 'Session Details'}
        subtitle={
          detailOccurrence
            ? `${detailOccurrence.date} • ${detailOccurrence.start_time} – ${detailOccurrence.end_time}`
            : ''
        }
      >
        {detailOccurrence && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-slate-400 font-semibold">Subject</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {detailOccurrence.subject_name || 'General'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Activity Type</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{detailOccurrence.activity_type}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Topic / Details</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {detailOccurrence.topic_title || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Status</p>
                <p className="font-bold uppercase text-blue-600 mt-0.5">{detailOccurrence.status}</p>
              </div>
            </div>

            {detailOccurrence.location_or_link && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Location / Link: {detailOccurrence.location_or_link}</span>
              </div>
            )}

            {detailOccurrence.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-500 mb-1">Notes:</p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{detailOccurrence.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {detailOccurrence.source === 'personal' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(detailOccurrence, 'completed')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange(detailOccurrence, 'skipped')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold"
                  >
                    Mark Skipped
                  </button>
                  <button
                    onClick={() => handleDuplicateOccurrence(detailOccurrence)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      setMoveForm({
                        specific_date: detailOccurrence.date,
                        start_time: detailOccurrence.start_time,
                        end_time: detailOccurrence.end_time,
                      });
                      setMoveModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1"
                  >
                    <MoveRight className="w-3.5 h-3.5" /> Move
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = detailOccurrence;
                    setDetailOccurrence(null);
                    openEditOccurrenceModal(target);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModalOccurrence(detailOccurrence)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: Move Session Modal */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="Move Timetable Entry"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleMoveOccurrence} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">New Date</label>
            <input
              type="date"
              required
              value={moveForm.specific_date}
              onChange={(e) => setMoveForm({ ...moveForm, specific_date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Start Time</label>
              <input
                type="time"
                required
                value={moveForm.start_time}
                onChange={(e) => setMoveForm({ ...moveForm, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">End Time</label>
              <input
                type="time"
                required
                value={moveForm.end_time}
                onChange={(e) => setMoveForm({ ...moveForm, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMoveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Move Session
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: Delete Confirmation (Supports Single Occurrence vs Entire Recurring Series) */}
      <Modal
        isOpen={!!deleteModalOccurrence}
        onClose={() => setDeleteModalOccurrence(null)}
        title="Confirm Delete Timetable Entry"
        maxWidth="max-w-md"
      >
        {deleteModalOccurrence && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>&ldquo;{deleteModalOccurrence.title}&rdquo;</strong>?
            </p>
            {deleteModalOccurrence.source === 'personal' && deleteModalOccurrence.is_recurring ? (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteConfirmed('single')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Delete Only This Occurrence ({deleteModalOccurrence.date})
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConfirmed('series')}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Delete Entire Recurring Series
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOccurrence(null)}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOccurrence(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConfirmed('series')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
