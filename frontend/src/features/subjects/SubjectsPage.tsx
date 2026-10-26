import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { Subject, SyllabusTopic } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const SUBJECT_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#4f46e5',
  '#0284c7',
  '#16a34a',
];

export const SubjectsPage: React.FC = () => {
  const { success, error } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [defaultsCatalog, setDefaultsCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Add / Edit Subject Modal
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    description: '',
    semester: 5,
    credits: 4,
    priority: 'High',
    color: '#2563eb',
    target_completion_date: '',
    target_study_hours: 40,
    completed_study_hours: 0,
  });

  // Default CSE Subjects Modal
  const [defaultsModalOpen, setDefaultsModalOpen] = useState(false);
  const [selectedDefaults, setSelectedDefaults] = useState<string[]>([]);

  // Syllabus & Topic Drawer/Modal
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [topicForm, setTopicForm] = useState({
    chapter_number: 1,
    chapter_title: 'Module 1',
    module_name: 'Unit 1',
    topic_title: '',
    estimated_hours: 2.0,
    notes: '',
  });

  // Log Study Hours Modal
  const [logHoursSubject, setLogHoursSubject] = useState<Subject | null>(null);
  const [hoursToAdd, setHoursToAdd] = useState<number>(1.5);
  const [hoursNotes, setHoursNotes] = useState<string>('');

  // Delete Confirmation
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (semesterFilter) params.set('semester', semesterFilter);
      const res = await api.get<Subject[]>(`/api/subjects?${params.toString()}`);
      setSubjects(res.data);
      if (activeSubject) {
        const updated = res.data.find((s) => s.id === activeSubject.id);
        if (updated) setActiveSubject(updated);
      }
    } catch (err) {
      error('Failed to load subjects', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, priorityFilter, semesterFilter, activeSubject, error]);

  useEffect(() => {
    fetchSubjects();
  }, [search, priorityFilter, semesterFilter]);

  const openDefaultsModal = async () => {
    try {
      const res = await api.get('/api/subjects/defaults');
      const catalog = res.data.defaults || [];
      setDefaultsCatalog(catalog);
      const existingNames = new Set(subjects.map((s) => s.name.toLowerCase()));
      setSelectedDefaults(
        catalog.filter((c: any) => !existingNames.has(c.name.toLowerCase())).map((c: any) => c.name)
      );
      setDefaultsModalOpen(true);
    } catch (err) {
      error('Failed to load default CSE subjects', extractErrorMessage(err));
    }
  };

  const handleImportDefaults = async () => {
    if (selectedDefaults.length === 0) {
      setDefaultsModalOpen(false);
      return;
    }
    try {
      const res = await api.post('/api/subjects/seed-defaults', selectedDefaults);
      success('CSE Subjects Added!', `Imported ${res.data.length} subject(s) with syllabus modules.`);
      setDefaultsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      error('Import failed', extractErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormState({
      name: '',
      code: '',
      description: '',
      semester: 5,
      credits: 4,
      priority: 'High',
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
      target_completion_date: '',
      target_study_hours: 45,
      completed_study_hours: 0,
    });
    setSubjectModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setFormState({
      name: subj.name,
      code: subj.code,
      description: subj.description,
      semester: subj.semester,
      credits: subj.credits,
      priority: subj.priority,
      color: subj.color,
      target_completion_date: subj.target_completion_date || '',
      target_study_hours: subj.target_study_hours,
      completed_study_hours: subj.completed_study_hours,
    });
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      error('Validation Error', 'Subject name is required.');
      return;
    }
    try {
      if (editingSubject) {
        await api.put(`/api/subjects/${editingSubject.id}`, {
          ...formState,
          target_completion_date: formState.target_completion_date || null,
        });
        success('Subject Updated', `${formState.name} has been updated.`);
      } else {
        await api.post('/api/subjects', {
          ...formState,
          target_completion_date: formState.target_completion_date || null,
        });
        success('Subject Created', `${formState.name} has been added.`);
      }
      setSubjectModalOpen(false);
      fetchSubjects();
    } catch (err) {
      error('Save failed', extractErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await api.delete(`/api/subjects/${subjectToDelete.id}`);
      success('Subject Deleted', `${subjectToDelete.name} has been removed.`);
      if (activeSubject?.id === subjectToDelete.id) setActiveSubject(null);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (err) {
      error('Delete failed', extractErrorMessage(err));
    }
  };

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHoursSubject || hoursToAdd <= 0) return;
    try {
      await api.post(`/api/subjects/${logHoursSubject.id}/log-hours`, {
        hours_to_add: Number(hoursToAdd),
        notes: hoursNotes,
      });
      success('Study Hours Logged!', `Added ${hoursToAdd}h to ${logHoursSubject.name}.`);
      setLogHoursSubject(null);
      setHoursNotes('');
      fetchSubjects();
    } catch (err) {
      error('Failed to log hours', extractErrorMessage(err));
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !topicForm.topic_title.trim()) return;
    try {
      const res = await api.post<SyllabusTopic>(`/api/subjects/${activeSubject.id}/topics`, topicForm);
      const updatedTopics = [...(activeSubject.topics || []), res.data];
      const comp = updatedTopics.filter((t) => t.is_completed).length;
      setActiveSubject({
        ...activeSubject,
        topics: updatedTopics,
        total_topics: updatedTopics.length,
        completed_topics: comp,
        syllabus_completion_percentage: Math.round((comp / updatedTopics.length) * 1000) / 10,
      });
      setTopicForm({ ...topicForm, topic_title: '', notes: '' });
      success('Syllabus Topic Added', res.data.topic_title);
      fetchSubjects();
    } catch (err) {
      error('Failed to add topic', extractErrorMessage(err));
    }
  };

  const handleToggleTopic = async (topic: SyllabusTopic) => {
    if (!activeSubject) return;
    try {
      await api.put(`/api/subjects/${activeSubject.id}/topics/${topic.id}`, {
        is_completed: !topic.is_completed,
      });
      const updatedRes = await api.get<Subject>(`/api/subjects/${activeSubject.id}`);
      setActiveSubject(updatedRes.data);
      fetchSubjects();
    } catch (err) {
      error('Failed to update topic', extractErrorMessage(err));
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!activeSubject) return;
    try {
      await api.delete(`/api/subjects/${activeSubject.id}/topics/${topicId}`);
      const updatedRes = await api.get<Subject>(`/api/subjects/${activeSubject.id}`);
      setActiveSubject(updatedRes.data);
      fetchSubjects();
    } catch (err) {
      error('Failed to delete topic', extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">My CSE Subjects</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage courses, credits, target study hours, chapters, and syllabus completion progress.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openDefaultsModal}
            className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Import Default CSE Subjects</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Subject</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name, course code, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold">No subjects found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add your semester CSE subjects or choose from our pre-configured catalog of 12 Computer Science subjects
            (DSA, DBMS, OS, Computer Networks, DAA, Machine Learning, etc.).
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={openDefaultsModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Browse 12 Default CSE Subjects
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              + Create Custom Subject
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="h-2 w-full" style={{ backgroundColor: subj.color }} />
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {subj.code && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {subj.code}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            subj.priority === 'Critical'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : subj.priority === 'High'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {subj.priority}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5">{subj.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {subj.description || `Semester ${subj.semester} • ${subj.credits} Credits`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(subj)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit subject"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSubjectToDelete(subj)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Syllabus ({subj.completed_topics}/{subj.total_topics} topics)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {subj.syllabus_completion_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${subj.syllabus_completion_percentage}%`,
                            backgroundColor: subj.color,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Study Hours ({subj.completed_study_hours}h / {subj.target_study_hours}h)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {subj.hours_completion_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${subj.hours_completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Sem {subj.semester} • {subj.credits} Credits
                    </span>
                    {subj.target_completion_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Target: {subj.target_completion_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveSubject(subj)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage Syllabus ({subj.total_topics})</span>
                </button>
                <button
                  onClick={() => {
                    setLogHoursSubject(subj);
                    setHoursToAdd(1.5);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ Log Hours</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        subtitle="Configure subject details, priority, credits, and study hour goals"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="e.g. Compiler Design"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={formState.code}
                onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                placeholder="e.g. CS601"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Core syllabus focus, lab requirements, textbook notes..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={formState.semester}
                onChange={(e) => setFormState({ ...formState, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Credits
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formState.credits}
                onChange={(e) => setFormState({ ...formState, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formState.priority}
                onChange={(e) => setFormState({ ...formState, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Target Study Hours
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={formState.target_study_hours}
                onChange={(e) => setFormState({ ...formState, target_study_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Completed Hours
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={formState.completed_study_hours}
                onChange={(e) => setFormState({ ...formState, completed_study_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Target Completion Date
              </label>
              <input
                type="date"
                value={formState.target_completion_date}
                onChange={(e) => setFormState({ ...formState, target_completion_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormState({ ...formState, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formState.color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Default CSE Subjects Import Modal */}
      <Modal
        isOpen={defaultsModalOpen}
        onClose={() => setDefaultsModalOpen(false)}
        title="Import Default CSE Subjects"
        subtitle="Select standard Computer Science Engineering subjects (with pre-built chapters & topics) to add"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setSelectedDefaults(defaultsCatalog.map((d) => d.name))}
              className="font-bold text-blue-600 hover:underline"
            >
              Select All ({defaultsCatalog.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDefaults([])}
              className="font-semibold text-slate-500 hover:underline"
            >
              Clear Selection
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {defaultsCatalog.map((item) => {
              const checked = selectedDefaults.includes(item.name);
              return (
                <label
                  key={item.name}
                  className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                    checked
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDefaults([...selectedDefaults, item.name]);
                      } else {
                        setSelectedDefaults(selectedDefaults.filter((n) => n !== item.name));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.name} ({item.code})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.topics?.length || 0} syllabus modules • {item.target_study_hours}h target
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDefaultsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportDefaults}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Import Selected ({selectedDefaults.length})
            </button>
          </div>
        </div>
      </Modal>

      {/* Syllabus & Topics Management Modal */}
      <Modal
        isOpen={!!activeSubject}
        onClose={() => setActiveSubject(null)}
        title={activeSubject ? `${activeSubject.name} — Syllabus & Topics` : 'Syllabus'}
        subtitle={
          activeSubject
            ? `${activeSubject.completed_topics} of ${activeSubject.total_topics} topics completed (${activeSubject.syllabus_completion_percentage}%)`
            : ''
        }
        maxWidth="max-w-3xl"
      >
        {activeSubject && (
          <div className="space-y-6">
            {/* Add New Topic Form */}
            <form
              onSubmit={handleAddTopic}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Add Chapter / Module / Topic
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chapter #</label>
                  <input
                    type="number"
                    min={1}
                    value={topicForm.chapter_number}
                    onChange={(e) => setTopicForm({ ...topicForm, chapter_number: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chapter / Module Title</label>
                  <input
                    type="text"
                    value={topicForm.chapter_title}
                    onChange={(e) => setTopicForm({ ...topicForm, chapter_title: e.target.value })}
                    placeholder="e.g. Process Management"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Unit Name</label>
                  <input
                    type="text"
                    value={topicForm.module_name}
                    onChange={(e) => setTopicForm({ ...topicForm, module_name: e.target.value })}
                    placeholder="e.g. Unit 1"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={topicForm.estimated_hours}
                    onChange={(e) => setTopicForm({ ...topicForm, estimated_hours: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={topicForm.topic_title}
                  onChange={(e) => setTopicForm({ ...topicForm, topic_title: e.target.value })}
                  placeholder="Enter specific topic name (e.g. Semaphores, Deadlock Avoidance, B+ Trees)..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
                >
                  + Add Topic
                </button>
              </div>
            </form>

            {/* Topics List */}
            {(!activeSubject.topics || activeSubject.topics.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No syllabus topics added yet. Add chapters and topics above to track syllabus completion.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activeSubject.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      topic.is_completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTopic(topic)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      {topic.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold ${
                            topic.is_completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {topic.topic_title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Ch {topic.chapter_number}: {topic.chapter_title} ({topic.module_name}) • Est.{' '}
                          {topic.estimated_hours}h
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      title="Delete topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Log Study Hours Modal */}
      <Modal
        isOpen={!!logHoursSubject}
        onClose={() => setLogHoursSubject(null)}
        title={`Log Completed Study Hours — ${logHoursSubject?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLogHours} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Hours Completed *
            </label>
            <input
              type="number"
              min={0.25}
              max={16}
              step={0.25}
              required
              value={hoursToAdd}
              onChange={(e) => setHoursToAdd(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Session Notes (Optional)
            </label>
            <input
              type="text"
              value={hoursNotes}
              onChange={(e) => setHoursNotes(e.target.value)}
              placeholder="What topics or problems did you cover?"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setLogHoursSubject(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Save Study Hours
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Subject?"
        message={`Are you sure you want to delete "${subjectToDelete?.name}" and all of its syllabus topics? This action cannot be undone.`}
      />
    </div>
  );
};
