import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Star,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { ExamItem, Subject, ExamSyllabusItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const EXAM_TYPES = ['Midterm', 'End Semester', 'Quiz', 'Lab Practical', 'Viva', 'Competitive / GATE'];
const PREP_STATUSES = ['Not Started', 'In Progress', 'Revision Phase', 'Ready', 'Completed'];

export const ExamsPage: React.FC = () => {
  const { success, error } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Create / Edit Exam Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [newTopicText, setNewTopicText] = useState('');
  const [form, setForm] = useState({
    exam_name: '',
    subject_id: '' as number | '',
    subject_name: '',
    exam_date: todayStr,
    start_time: '09:30',
    end_time: '12:30',
    venue: '',
    exam_type: 'Midterm',
    syllabus_topics: [] as ExamSyllabusItem[],
    preparation_status: 'In Progress',
    confidence_level: 3,
    notes: '',
  });

  // Revision Schedule Generator Modal
  const [revisionExam, setRevisionExam] = useState<ExamItem | null>(null);
  const [revForm, setRevForm] = useState({
    daily_start_time: '18:00',
    daily_end_time: '22:00',
    session_duration_minutes: 60,
    break_duration_minutes: 10,
    max_sessions_per_day: 2,
    save_to_timetable: true,
  });

  // Delete Confirmation
  const [examToDelete, setExamToDelete] = useState<ExamItem | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([
        api.get<ExamItem[]>('/api/exams'),
        api.get<Subject[]>('/api/subjects'),
      ]);
      setExams(eRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      error('Failed to load exams', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openCreateModal = () => {
    setEditingExam(null);
    setNewTopicText('');
    setForm({
      exam_name: '',
      subject_id: subjects[0]?.id || '',
      subject_name: subjects[0]?.name || '',
      exam_date: todayStr,
      start_time: '09:30',
      end_time: '12:30',
      venue: '',
      exam_type: 'Midterm',
      syllabus_topics: [],
      preparation_status: 'In Progress',
      confidence_level: 3,
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (ex: ExamItem) => {
    setEditingExam(ex);
    setNewTopicText('');
    setForm({
      exam_name: ex.exam_name,
      subject_id: ex.subject_id || '',
      subject_name: ex.subject_name,
      exam_date: ex.exam_date,
      start_time: ex.start_time,
      end_time: ex.end_time,
      venue: ex.venue,
      exam_type: ex.exam_type,
      syllabus_topics: ex.syllabus_topics || [],
      preparation_status: ex.preparation_status,
      confidence_level: ex.confidence_level,
      notes: ex.notes,
    });
    setModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.exam_name.trim() || !form.subject_name.trim()) return;
    try {
      const payload = {
        ...form,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
      };
      if (editingExam) {
        await api.put(`/api/exams/${editingExam.id}`, payload);
        success('Exam Updated', form.exam_name);
      } else {
        await api.post('/api/exams', payload);
        success('Exam Added', form.exam_name);
      }
      setModalOpen(false);
      fetchExams();
    } catch (err) {
      error('Failed to save exam', extractErrorMessage(err));
    }
  };

  const handleToggleExamTopic = async (exam: ExamItem, topicId: string) => {
    const updatedTopics = (exam.syllabus_topics || []).map((t) =>
      t.id === topicId ? { ...t, completed: !t.completed } : t
    );
    try {
      await api.put(`/api/exams/${exam.id}`, { syllabus_topics: updatedTopics });
      fetchExams();
    } catch (err) {
      error('Failed to update syllabus topic', extractErrorMessage(err));
    }
  };

  const handleGenerateRevisionSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionExam) return;
    try {
      const res = await api.post(`/api/exams/${revisionExam.id}/generate-revision-schedule`, revForm);
      success(
        'Revision Schedule Created!',
        `Generated ${res.data.sessions_count} revision session(s) on your timetable for ${revisionExam.exam_name}.`
      );
      setRevisionExam(null);
    } catch (err) {
      error('Failed to generate revision schedule', extractErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    try {
      await api.delete(`/api/exams/${examToDelete.id}`);
      success('Exam Deleted', examToDelete.exam_name);
      setExamToDelete(null);
      fetchExams();
    } catch (err) {
      error('Delete failed', extractErrorMessage(err));
    }
  };

  const upcomingExams = exams.filter((e) => !e.is_completed_exam);
  const completedExams = exams.filter((e) => e.is_completed_exam);
  const displayedExams = activeTab === 'upcoming' ? upcomingExams : completedExams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Examination Timetable &amp; Preparation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Countdown timers, exam conflict detection, syllabus readiness checklists, and automated revision scheduling.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Examination</span>
        </button>
      </div>

      {/* Tabs: Upcoming Exams vs Completed Exam History */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Upcoming Examinations ({upcomingExams.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Completed Exam History ({completedExams.length})
        </button>
      </div>

      {/* Exam Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : displayedExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold">
            {activeTab === 'upcoming' ? 'No upcoming exams registered' : 'No completed exam history yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add your midterms, end-semester exams, lab practicals, or quizzes to track countdowns and generate revision
            schedules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayedExams.map((ex) => {
            const hasConflict = ex.conflicting_exam_ids && ex.conflicting_exam_ids.length > 0;
            return (
              <div
                key={ex.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 space-y-4 shadow-xs ${
                  hasConflict
                    ? 'border-red-400 dark:border-red-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Conflict Warning Banner */}
                {hasConflict && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Exam Time Conflict Warning! Another exam overlaps with {ex.exam_date} ({ex.start_time}–
                      {ex.end_time}).
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {ex.exam_type}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {ex.preparation_status}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">{ex.exam_name}</h3>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{ex.subject_name}</p>
                  </div>

                  {/* Countdown Badge */}
                  <div className="text-right shrink-0">
                    <div
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black ${
                        ex.days_remaining < 0
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : ex.days_remaining <= 3
                          ? 'bg-red-600 text-white'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {ex.days_remaining < 0
                        ? 'Past Exam'
                        : ex.days_remaining === 0
                        ? 'Exam Today!'
                        : `${ex.days_remaining} Days Left`}
                    </div>
                  </div>
                </div>

                {/* Date, Time, Venue & Confidence */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">{ex.exam_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {ex.start_time} – {ex.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{ex.venue || 'Venue TBA'}</span>
                  </div>
                </div>

                {/* Confidence Level & Syllabus Completion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">
                      Syllabus Completion ({ex.syllabus_completion_percentage}%)
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      Confidence:
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= ex.confidence_level ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                      style={{ width: `${ex.syllabus_completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Syllabus Topics Interactive Checklist */}
                {ex.syllabus_topics && ex.syllabus_topics.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {ex.syllabus_topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleToggleExamTopic(ex, t.id)}
                        className="w-full flex items-center gap-2 text-left text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={t.completed ? 'line-through text-slate-400' : 'font-medium'}>{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setRevisionExam(ex)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Revision Schedule</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(ex)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExamToDelete(ex)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExam ? 'Edit Examination' : 'Add Examination'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Exam Name *</label>
              <input
                type="text"
                required
                value={form.exam_name}
                onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                placeholder="e.g. Midterm Examination 1"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Subject *</label>
              <select
                value={form.subject_id}
                onChange={(e) => {
                  const idVal = e.target.value ? Number(e.target.value) : '';
                  const found = subjects.find((s) => s.id === idVal);
                  setForm({
                    ...form,
                    subject_id: idVal,
                    subject_name: found ? found.name : form.subject_name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- Custom Subject Name Below --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!form.subject_id && (
            <div>
              <label className="block text-xs font-bold mb-1">Custom Subject Name *</label>
              <input
                type="text"
                required
                value={form.subject_name}
                onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                placeholder="e.g. Operating Systems"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Exam Date *</label>
              <input
                type="date"
                required
                value={form.exam_date}
                onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Exam Type</label>
              <select
                value={form.exam_type}
                onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Hall B / Room 204"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Prep Status</label>
              <select
                value={form.preparation_status}
                onChange={(e) => setForm({ ...form, preparation_status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {PREP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Confidence (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.confidence_level}
                onChange={(e) => setForm({ ...form, confidence_level: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Syllabus Topics Builder */}
          <div>
            <label className="block text-xs font-bold mb-1">Exam Syllabus Topics</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTopicText}
                onChange={(e) => setNewTopicText(e.target.value)}
                placeholder="Add a syllabus topic (or leave blank to auto-import from subject)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTopicText.trim()) return;
                  setForm({
                    ...form,
                    syllabus_topics: [
                      ...form.syllabus_topics,
                      { id: `t-${Date.now()}`, title: newTopicText.trim(), completed: false, estimated_hours: 2.0 },
                    ],
                  });
                  setNewTopicText('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
              >
                + Add Topic
              </button>
            </div>
            {form.syllabus_topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.syllabus_topics.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-xs"
                  >
                    <span>{t.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          syllabus_topics: form.syllabus_topics.filter((x) => x.id !== t.id),
                        })
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              {editingExam ? 'Update Exam' : 'Save Exam'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Exam Revision Schedule Modal */}
      <Modal
        isOpen={!!revisionExam}
        onClose={() => setRevisionExam(null)}
        title={`Generate Revision Schedule — ${revisionExam?.exam_name || ''}`}
        subtitle="Automatically schedules conflict-free revision blocks on your timetable leading up to the exam date"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGenerateRevisionSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Daily Window Start</label>
              <input
                type="time"
                value={revForm.daily_start_time}
                onChange={(e) => setRevForm({ ...revForm, daily_start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Daily Window End</label>
              <input
                type="time"
                value={revForm.daily_end_time}
                onChange={(e) => setRevForm({ ...revForm, daily_end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Session Length (mins)</label>
              <input
                type="number"
                min={30}
                max={180}
                value={revForm.session_duration_minutes}
                onChange={(e) => setRevForm({ ...revForm, session_duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Max Sessions / Day</label>
              <input
                type="number"
                min={1}
                max={5}
                value={revForm.max_sessions_per_day}
                onChange={(e) => setRevForm({ ...revForm, max_sessions_per_day: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRevisionExam(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
              Generate &amp; Save to Timetable
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Exam?"
        message={`Are you sure you want to delete "${examToDelete?.exam_name}"?`}
      />
    </div>
  );
};
