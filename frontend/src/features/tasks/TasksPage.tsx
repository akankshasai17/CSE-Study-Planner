import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  List,
  Columns,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  CheckCircle2,
  CalendarPlus,
  AlertCircle,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { TaskItem, Subject } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const ASSIGNMENT_TYPES = [
  'Assignment',
  'Lab Record',
  'Project',
  'Quiz Prep',
  'Coding Task',
  'Homework',
  'Reading',
];

export const TasksPage: React.FC = () => {
  const { success, error } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<any>({
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    completion_percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // View & Filters
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority'>('due_date');

  // Create / Edit Task Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '' as number | '',
    subject_name: '',
    assignment_type: 'Assignment',
    due_date: todayStr,
    due_time: '23:59',
    priority: 'High',
    status: 'Pending',
    estimated_minutes: 60,
    notes: '',
  });

  // Schedule Task Session Modal
  const [scheduleTask, setScheduleTask] = useState<TaskItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    specific_date: todayStr,
    start_time: '19:00',
    end_time: '20:00',
  });

  // Delete Confirmation
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      params.set('sort_by', sortBy);

      const [tRes, stRes, sRes] = await Promise.all([
        api.get<TaskItem[]>(`/api/tasks?${params.toString()}`),
        api.get('/api/tasks/stats'),
        api.get<Subject[]>('/api/subjects'),
      ]);
      setTasks(tRes.data);
      setStats(stRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      error('Failed to load tasks', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy, error]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      subject_id: subjects[0]?.id || '',
      subject_name: subjects[0]?.name || '',
      assignment_type: 'Assignment',
      due_date: todayStr,
      due_time: '23:59',
      priority: 'High',
      status: 'Pending',
      estimated_minutes: 60,
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description,
      subject_id: t.subject_id || '',
      subject_name: t.subject_name,
      assignment_type: t.assignment_type,
      due_date: t.due_date,
      due_time: t.due_time,
      priority: t.priority,
      status: t.status,
      estimated_minutes: t.estimated_minutes,
      notes: t.notes,
    });
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const payload = {
        ...form,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
      };
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, payload);
        success('Task Updated', form.title);
      } else {
        await api.post('/api/tasks', payload);
        success('Task Created', form.title);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      error('Save failed', extractErrorMessage(err));
    }
  };

  const handleQuickStatusChange = async (t: TaskItem, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      await api.put(`/api/tasks/${t.id}`, { status: newStatus });
      success(`Task marked ${newStatus}`, t.title);
      fetchTasks();
    } catch (err) {
      error('Failed to update status', extractErrorMessage(err));
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTask) return;
    try {
      await api.post(`/api/tasks/${scheduleTask.id}/schedule-session`, scheduleForm);
      success('Study Session Scheduled!', `"${scheduleTask.title}" added to your timetable.`);
      setScheduleTask(null);
      fetchTasks();
    } catch (err) {
      error('Failed to schedule task session', extractErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/api/tasks/${taskToDelete.id}`);
      success('Task Deleted', taskToDelete.title);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      error('Delete failed', extractErrorMessage(err));
    }
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Tasks &amp; Assignment Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track lab records, coding assignments, projects, deadlines, and schedule dedicated work sessions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Task / Assignment</span>
        </button>
      </div>

      {/* Real Task Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Tasks</p>
          <p className="text-2xl font-extrabold mt-0.5">{stats.total_tasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{stats.pending_tasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-0.5">{stats.in_progress_tasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Completed ({stats.completion_percentage}%)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{stats.completed_tasks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Overdue</p>
          <p className="text-2xl font-extrabold text-red-600 mt-0.5">{stats.overdue_tasks}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, subject, or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="due_date">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              viewMode === 'board' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Board
          </button>
        </div>
      </div>

      {/* Tasks Display */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <CheckSquare className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold">No tasks or assignments found</h3>
          <p className="text-xs text-slate-500">Add your upcoming assignments, lab records, or coding tasks above.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                t.is_overdue
                  ? 'border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() =>
                    handleQuickStatusChange(t, t.status === 'Completed' ? 'Pending' : 'Completed')
                  }
                  className={`mt-0.5 p-1 rounded-lg ${
                    t.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                  }`}
                  title="Toggle Complete"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm font-bold ${
                        t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {t.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {t.assignment_type}
                    </span>
                    {t.is_overdue && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> OVERDUE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.subject_name ? `${t.subject_name} • ` : ''}
                    Due: <strong>{t.due_date}</strong> at {t.due_time} • Est. {t.estimated_minutes} mins
                  </p>
                  {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={t.status}
                  onChange={(e) => handleQuickStatusChange(t, e.target.value as any)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <button
                  onClick={() => {
                    setScheduleTask(t);
                    setScheduleForm({
                      specific_date: t.due_date >= todayStr ? todayStr : t.due_date,
                      start_time: '19:00',
                      end_time: '20:00',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1"
                  title="Create a timetable study session for this task"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Schedule Session</span>
                </button>

                <button
                  onClick={() => openEditModal(t)}
                  className="p-1.5 text-slate-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTaskToDelete(t)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['Pending', 'In Progress', 'Completed'] as const).map((colStatus) => {
            const colTasks = tasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-100/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {colStatus}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-xs font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                        {t.is_overdue && (
                          <span className="text-[10px] font-bold text-red-600">Overdue</span>
                        )}
                      </div>
                      <p className="text-xs font-bold">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.subject_name ? `${t.subject_name} • ` : ''}Due {t.due_date}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <select
                          value={t.status}
                          onChange={(e) => handleQuickStatusChange(t, e.target.value as any)}
                          className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(t)} className="p-1 text-slate-400 hover:text-blue-600">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(t)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task / Assignment' : 'Create New Task / Assignment'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. DBMS Lab Record 4 — Normalization Queries"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Subject</label>
              <select
                value={form.subject_id}
                onChange={(e) => {
                  const idVal = e.target.value ? Number(e.target.value) : '';
                  const found = subjects.find((s) => s.id === idVal);
                  setForm({
                    ...form,
                    subject_id: idVal,
                    subject_name: found ? found.name : '',
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- General --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Assignment Type</label>
              <select
                value={form.assignment_type}
                onChange={(e) => setForm({ ...form, assignment_type: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {ASSIGNMENT_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Due Time</label>
              <input
                type="time"
                value={form.due_time}
                onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Est. Duration (mins)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={form.estimated_minutes}
                onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Submission instructions, portal link, requirements..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
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
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Task Session Modal */}
      <Modal
        isOpen={!!scheduleTask}
        onClose={() => setScheduleTask(null)}
        title={`Schedule Study Session for "${scheduleTask?.title || ''}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleScheduleSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Date</label>
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
              onClick={() => setScheduleTask(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Add to Timetable
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
      />
    </div>
  );
};
