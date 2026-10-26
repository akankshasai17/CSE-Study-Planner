import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  ExternalLink,
  Trash2,
  GraduationCap,
  CalendarPlus,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { StudyPlan, StudyGoal, Subject, ExamItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const StudyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  // Create Plan Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    plan_type: 'weekly',
    start_date: todayStr,
    end_date: todayStr,
    subject_id: '' as number | '',
    target_hours: 12,
  });

  // Generate from Exam Syllabus Modal
  const [examPlanModalOpen, setExamPlanModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');

  // Add Goal/Topic Modal
  const [goalModalPlan, setGoalModalPlan] = useState<StudyPlan | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    chapter_name: 'Chapter 1',
    topic_name: '',
    subject_id: '' as number | '',
    estimated_hours: 2.0,
    actual_hours: 0.0,
    target_date: todayStr,
    status: 'pending',
    notes: '',
    resources_url: '',
  });

  // Connect Goal to Timetable Session Modal
  const [scheduleGoalItem, setScheduleGoalItem] = useState<{ planId: number; goal: StudyGoal } | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    specific_date: todayStr,
    start_time: '18:00',
    end_time: '19:30',
  });

  // Delete Confirmation
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = filterType ? `?plan_type=${filterType}` : '';
      const [pRes, sRes, eRes] = await Promise.all([
        api.get<StudyPlan[]>(`/api/study-plans${q}`),
        api.get<Subject[]>('/api/subjects'),
        api.get<ExamItem[]>('/api/exams'),
      ]);
      setPlans(pRes.data);
      setSubjects(sRes.data);
      setExams(eRes.data);
    } catch (err) {
      error('Failed to load study plans', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterType, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.title.trim()) return;
    try {
      await api.post('/api/study-plans', {
        ...planForm,
        subject_id: planForm.subject_id ? Number(planForm.subject_id) : null,
      });
      success('Study Plan Created!', planForm.title);
      setPlanModalOpen(false);
      fetchData();
    } catch (err) {
      error('Failed to create study plan', extractErrorMessage(err));
    }
  };

  const handleCreateFromExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      const res = await api.post(`/api/study-plans/from-exam/${selectedExamId}`);
      success('Exam Study Plan Generated!', res.data.title);
      setExamPlanModalOpen(false);
      fetchData();
    } catch (err) {
      error('Failed to generate plan from exam', extractErrorMessage(err));
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalModalPlan || !goalForm.title.trim()) return;
    try {
      await api.post(`/api/study-plans/${goalModalPlan.id}/goals`, {
        ...goalForm,
        subject_id: goalForm.subject_id ? Number(goalForm.subject_id) : goalModalPlan.subject_id,
      });
      success('Learning Goal Added', goalForm.title);
      setGoalModalPlan(null);
      fetchData();
    } catch (err) {
      error('Failed to add goal', extractErrorMessage(err));
    }
  };

  const handleCycleGoalStatus = async (planId: number, goal: StudyGoal) => {
    const nextStatus =
      goal.status === 'pending' ? 'in_progress' : goal.status === 'in_progress' ? 'completed' : 'pending';
    try {
      await api.put(`/api/study-plans/${planId}/goals/${goal.id}`, {
        status: nextStatus,
        actual_hours: nextStatus === 'completed' && goal.actual_hours === 0 ? goal.estimated_hours : goal.actual_hours,
      });
      fetchData();
    } catch (err) {
      error('Failed to update goal status', extractErrorMessage(err));
    }
  };

  const handleScheduleGoalToTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleGoalItem) return;
    try {
      await api.post(
        `/api/study-plans/${scheduleGoalItem.planId}/goals/${scheduleGoalItem.goal.id}/schedule-timetable`,
        scheduleForm
      );
      success('Connected to Timetable!', `"${scheduleGoalItem.goal.title}" scheduled on ${scheduleForm.specific_date}.`);
      setScheduleGoalItem(null);
      fetchData();
    } catch (err) {
      error('Failed to connect to timetable', extractErrorMessage(err));
    }
  };

  const handleDeleteGoal = async (planId: number, goalId: number) => {
    try {
      await api.delete(`/api/study-plans/${planId}/goals/${goalId}`);
      fetchData();
    } catch (err) {
      error('Failed to delete goal', extractErrorMessage(err));
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await api.delete(`/api/study-plans/${planToDelete.id}`);
      success('Study Plan Deleted', planToDelete.title);
      setPlanToDelete(null);
      fetchData();
    } catch (err) {
      error('Failed to delete study plan', extractErrorMessage(err));
    }
  };

  const totalPlannedHours = plans.reduce((acc, p) => acc + (p.planned_hours || 0), 0);
  const totalActualHours = plans.reduce((acc, p) => acc + (p.actual_hours || 0), 0);
  const dailyTarget = user?.profile?.daily_study_hour_target || 4.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Study Planner &amp; Goals</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Break learning goals into chapters &amp; topics, track planned vs actual hours, and connect topics to your
            timetable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedExamId(exams[0]?.id || '');
              setExamPlanModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Create Plan from Exam Syllabus</span>
          </button>

          <button
            onClick={() => {
              setPlanForm({
                title: '',
                description: '',
                plan_type: 'weekly',
                start_date: todayStr,
                end_date: todayStr,
                subject_id: subjects[0]?.id || '',
                target_hours: 12,
              });
              setPlanModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Study Plan</span>
          </button>
        </div>
      </div>

      {/* Summary Banner: Daily & Weekly Study Goals + Planned vs Actual */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Daily Study Goal</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{dailyTarget}h / day</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Weekly Study Goal</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{Math.round(dailyTarget * 7)}h / wk</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Planned Hours</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {Math.round(totalPlannedHours * 10) / 10}h
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Actual Logged Hours</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {Math.round(totalActualHours * 10) / 10}h
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All Plans', value: '' },
          { label: "Today's Plans", value: 'daily' },
          { label: 'Weekly Plans', value: 'weekly' },
          { label: 'Custom Range', value: 'custom' },
          { label: 'Exam Syllabus Plans', value: 'exam_syllabus' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Study Plans List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold">No study plans created yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a daily, weekly, or custom date-range study plan, break it down into chapters and smaller topics,
            and connect topics directly to your weekly timetable.
          </p>
          <button
            onClick={() => setPlanModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            + Create First Study Plan
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {plan.plan_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {plan.start_date} → {plan.end_date}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">{plan.title}</h3>
                  {plan.description && <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setGoalModalPlan(plan);
                      setGoalForm({
                        title: '',
                        chapter_name: 'Chapter 1',
                        topic_name: '',
                        subject_id: plan.subject_id || '',
                        estimated_hours: 2.0,
                        actual_hours: 0.0,
                        target_date: plan.end_date,
                        status: 'pending',
                        notes: '',
                        resources_url: '',
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    + Add Chapter / Topic Goal
                  </button>
                  <button
                    onClick={() => setPlanToDelete(plan)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Planned vs Actual Hours */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Completion: {plan.completion_percentage}% ({plan.goals.filter((g) => g.status === 'completed').length}
                    /{plan.goals.length} topics)
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Planned: <strong>{plan.planned_hours}h</strong> • Actual: <strong>{plan.actual_hours}h</strong> •
                    Target: <strong>{plan.target_hours}h</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                    style={{ width: `${plan.completion_percentage}%` }}
                  />
                </div>
              </div>

              {/* Goals / Topics List */}
              {plan.goals.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No chapters or topics added to this plan yet. Click &ldquo;+ Add Chapter / Topic Goal&rdquo; above.
                </p>
              ) : (
                <div className="space-y-2">
                  {plan.goals.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCycleGoalStatus(plan.id, g)}
                          className="mt-0.5 shrink-0"
                          title="Click to cycle Pending → In Progress → Completed"
                        >
                          {g.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : g.status === 'in_progress' ? (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-xs font-bold ${
                                g.status === 'completed'
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {g.title}
                            </p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                g.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : g.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {g.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {g.chapter_name ? `${g.chapter_name} • ` : ''}
                            Est: {g.estimated_hours}h | Actual: {g.actual_hours}h
                            {g.target_date ? ` • Target: ${g.target_date}` : ''}
                          </p>
                          {g.notes && <p className="text-[11px] text-slate-400 mt-0.5">{g.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {g.resources_url && (
                          <a
                            href={g.resources_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title="Open Study Resource"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleGoalItem({ planId: plan.id, goal: g });
                            setScheduleForm({
                              specific_date: g.target_date || todayStr,
                              start_time: '18:00',
                              end_time: '19:30',
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{g.timetable_entry_id ? 'Scheduled' : 'Connect to Timetable'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(plan.id, g.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Study Plan Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Create Study Plan"
        subtitle="Set up a daily, weekly, or custom date-range learning plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Plan Title *</label>
            <input
              type="text"
              required
              value={planForm.title}
              onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
              placeholder="e.g. Week 6 OS & DBMS Mastery Plan"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Plan Type</label>
              <select
                value={planForm.plan_type}
                onChange={(e) => setPlanForm({ ...planForm, plan_type: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="daily">Today (Daily Plan)</option>
                <option value="weekly">This Week (Weekly Plan)</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Target Study Hours</label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={planForm.target_hours}
                onChange={(e) => setPlanForm({ ...planForm, target_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={planForm.start_date}
                onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">End Date</label>
              <input
                type="date"
                required
                value={planForm.end_date}
                onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Associated Subject (Optional)</label>
            <select
              value={planForm.subject_id}
              onChange={(e) => setPlanForm({ ...planForm, subject_id: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="">-- Multi-Subject Plan --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Description / Learning Goal</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Core objectives and outcomes..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPlanModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Create Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Study Plan from Exam Syllabus Modal */}
      <Modal
        isOpen={examPlanModalOpen}
        onClose={() => setExamPlanModalOpen(false)}
        title="Generate Study Plan from Examination Syllabus"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateFromExam} className="space-y-4">
          {exams.length === 0 ? (
            <p className="text-xs text-slate-500">
              No exams found. Add an exam on the Exams page first to generate a syllabus study plan.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold mb-1">Select Upcoming Exam *</label>
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.exam_name} — {ex.subject_name} ({ex.exam_date})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExamPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
                  Generate Plan
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Add Goal/Topic Modal */}
      <Modal
        isOpen={!!goalModalPlan}
        onClose={() => setGoalModalPlan(null)}
        title={`Add Chapter / Topic Goal to "${goalModalPlan?.title || ''}"`}
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Goal / Topic Title *</label>
              <input
                type="text"
                required
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value, topic_name: e.target.value })}
                placeholder="e.g. B+ Tree Insertion & Deletion"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Chapter / Module</label>
              <input
                type="text"
                value={goalForm.chapter_name}
                onChange={(e) => setGoalForm({ ...goalForm, chapter_name: e.target.value })}
                placeholder="e.g. Module 4: Indexing"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Estimated Hours</label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={goalForm.estimated_hours}
                onChange={(e) => setGoalForm({ ...goalForm, estimated_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Actual Hours</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={goalForm.actual_hours}
                onChange={(e) => setGoalForm({ ...goalForm, actual_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Target Date</label>
              <input
                type="date"
                value={goalForm.target_date}
                onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Study Resource URL (Optional)</label>
            <input
              type="url"
              value={goalForm.resources_url}
              onChange={(e) => setGoalForm({ ...goalForm, resources_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Notes</label>
            <input
              type="text"
              value={goalForm.notes}
              onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
              placeholder="Key theorems, textbook pages..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setGoalModalPlan(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Add Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Connect Goal to Timetable Session Modal */}
      <Modal
        isOpen={!!scheduleGoalItem}
        onClose={() => setScheduleGoalItem(null)}
        title="Connect Planned Topic to Timetable Session"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleScheduleGoalToTimetable} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Session Date</label>
            <input
              type="date"
              required
              value={scheduleForm.specific_date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, specific_date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Start Time</label>
              <input
                type="time"
                required
                value={scheduleForm.start_time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">End Time</label>
              <input
                type="time"
                required
                value={scheduleForm.end_time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setScheduleGoalItem(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Schedule on Timetable
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDeletePlan}
        title="Delete Study Plan?"
        message={`Are you sure you want to delete "${planToDelete?.title}" and its goals?`}
      />
    </div>
  );
};
