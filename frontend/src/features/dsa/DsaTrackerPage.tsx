import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api, extractErrorMessage } from '@/services/api';
import { DSAProblem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const DSA_TOPICS = [
  'Arrays',
  'Strings',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Binary Search',
  'Recursion',
  'Backtracking',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Greedy Algorithms',
  'Dynamic Programming',
  'Tries',
  'Bit Manipulation',
];

const PLATFORMS = ['LeetCode', 'HackerRank', 'CodeChef', 'GeeksforGeeks', 'Custom'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['Not Started', 'Attempted', 'Solved', 'Needs Revision'];

export const DsaTrackerPage: React.FC = () => {
  const { success, error } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [problems, setProblems] = useState<DSAProblem[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create / Edit Problem Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DSAProblem | null>(null);
  const [form, setForm] = useState({
    title: '',
    platform: 'LeetCode',
    problem_url: '',
    topic: 'Arrays',
    difficulty: 'Medium',
    status: 'Solved',
    time_taken_minutes: 25,
    approach: '',
    solution_notes: '',
    time_complexity: 'O(n)',
    space_complexity: 'O(1)',
    review_date: '',
  });

  // Schedule Revision Modal
  const [revisionProblem, setRevisionProblem] = useState<DSAProblem | null>(null);
  const [revForm, setRevForm] = useState({
    specific_date: todayStr,
    start_time: '20:00',
    end_time: '21:00',
  });

  // Delete Confirmation
  const [problemToDelete, setProblemToDelete] = useState<DSAProblem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (platformFilter) params.set('platform', platformFilter);
      if (topicFilter) params.set('topic', topicFilter);
      if (difficultyFilter) params.set('difficulty', difficultyFilter);
      if (statusFilter) params.set('status', statusFilter);

      const [pRes, stRes] = await Promise.all([
        api.get<DSAProblem[]>(`/api/dsa?${params.toString()}`),
        api.get('/api/dsa/stats'),
      ]);
      setProblems(pRes.data);
      setStats(stRes.data);
    } catch (err) {
      error('Failed to load DSA tracker', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, platformFilter, topicFilter, difficultyFilter, statusFilter, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingProblem(null);
    setForm({
      title: '',
      platform: 'LeetCode',
      problem_url: '',
      topic: 'Arrays',
      difficulty: 'Medium',
      status: 'Solved',
      time_taken_minutes: 25,
      approach: '',
      solution_notes: '',
      time_complexity: 'O(n)',
      space_complexity: 'O(1)',
      review_date: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (p: DSAProblem) => {
    setEditingProblem(p);
    setForm({
      title: p.title,
      platform: p.platform,
      problem_url: p.problem_url,
      topic: p.topic,
      difficulty: p.difficulty,
      status: p.status,
      time_taken_minutes: p.time_taken_minutes,
      approach: p.approach,
      solution_notes: p.solution_notes,
      time_complexity: p.time_complexity,
      space_complexity: p.space_complexity,
      review_date: p.review_date || '',
    });
    setModalOpen(true);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const payload = {
        ...form,
        review_date: form.review_date || null,
      };
      if (editingProblem) {
        await api.put(`/api/dsa/${editingProblem.id}`, payload);
        success('DSA Problem Updated', form.title);
      } else {
        await api.post('/api/dsa', payload);
        success('DSA Problem Logged', form.title);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      error('Save failed', extractErrorMessage(err));
    }
  };

  const handleScheduleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionProblem) return;
    try {
      await api.post(`/api/dsa/${revisionProblem.id}/schedule-revision`, revForm);
      success('DSA Revision Session Scheduled!', `Added "${revisionProblem.title}" to your timetable.`);
      setRevisionProblem(null);
      fetchData();
    } catch (err) {
      error('Failed to schedule revision', extractErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!problemToDelete) return;
    try {
      await api.delete(`/api/dsa/${problemToDelete.id}`);
      success('Problem Removed', problemToDelete.title);
      setProblemToDelete(null);
      fetchData();
    } catch (err) {
      error('Delete failed', extractErrorMessage(err));
    }
  };

  const diffBadge = (d: string) => {
    if (d === 'Easy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    if (d === 'Medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
  };

  const statusBadge = (s: string) => {
    if (s === 'Solved') return 'bg-emerald-600 text-white';
    if (s === 'Needs Revision') return 'bg-amber-500 text-white';
    if (s === 'Attempted') return 'bg-blue-600 text-white';
    return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">DSA Practice Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track problems across 19 CSE DSA topics, record time/space complexity &amp; approaches, detect weak topics,
            and schedule revisions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log DSA Problem</span>
        </button>
      </div>

      {/* Top Stats: Difficulty Completion + Daily/Weekly Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Solved</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {stats?.solved_count || 0}{' '}
            <span className="text-xs font-medium text-slate-400">/ {stats?.total_problems || 0}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-emerald-600">Easy Solved</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats?.difficulty_stats?.easy?.solved || 0}{' '}
            <span className="text-xs font-medium text-slate-400">/ {stats?.difficulty_stats?.easy?.total || 0}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-amber-600">Medium Solved</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {stats?.difficulty_stats?.medium?.solved || 0}{' '}
            <span className="text-xs font-medium text-slate-400">/ {stats?.difficulty_stats?.medium?.total || 0}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-rose-600">Hard Solved</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {stats?.difficulty_stats?.hard?.solved || 0}{' '}
            <span className="text-xs font-medium text-slate-400">/ {stats?.difficulty_stats?.hard?.total || 0}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Practice Goals</p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
            Today: {stats?.goals?.solved_today || 0}/{stats?.goals?.daily_goal || 2}
          </p>
          <p className="text-xs font-bold text-indigo-600 mt-0.5">
            Week: {stats?.goals?.solved_this_week || 0}/{stats?.goals?.weekly_goal || 14}
          </p>
        </div>
      </div>

      {/* Activity Chart & Weak Topics Detector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-base font-bold mb-1">14-Day Problem-Solving Activity</h2>
          <p className="text-xs text-slate-500 mb-4">Problems attempted and solved per day</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.activity_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="solved" name="Solved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attempted" name="Attempted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Topics Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold">Weak Topics &amp; Revision Radar</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Topics with problems marked &ldquo;Needs Revision&rdquo; or low completion rate
          </p>
          {(!stats?.weak_topics || stats.weak_topics.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No weak topics flagged right now. Mark tricky problems as &ldquo;Needs Revision&rdquo; to track them here!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {stats.weak_topics.map((wt: any) => (
                <div
                  key={wt.topic}
                  onClick={() => setTopicFilter(wt.topic)}
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{wt.topic}</p>
                    <p className="text-[11px] text-slate-500">
                      Solved: {wt.solved}/{wt.total} • Needs Revision: {wt.needs_revision}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-600">{wt.solve_rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem title or approach..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All 19 DSA Topics</option>
          {DSA_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Problems Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Code2 className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold">No DSA problems logged yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Log problems from LeetCode, HackerRank, CodeChef, GeeksforGeeks, or custom sheets with time/space complexity
            and solution notes.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            + Log First DSA Problem
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-xs transition-all"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                    {p.status}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${diffBadge(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {p.topic}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{p.platform}</span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{p.title}</h3>
                  {p.problem_url && (
                    <a
                      href={p.problem_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-xs font-semibold"
                      title="Open Problem URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-600" /> Time: <strong>{p.time_complexity}</strong> • Space:{' '}
                    <strong>{p.space_complexity}</strong>
                  </span>
                  {p.time_taken_minutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> {p.time_taken_minutes} mins
                    </span>
                  )}
                  {p.date_solved && <span>Solved: {p.date_solved}</span>}
                  {p.review_date && <span className="text-amber-600 font-semibold">Review: {p.review_date}</span>}
                </div>

                {(p.approach || p.solution_notes) && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg mt-1">
                    {p.approach ? `Approach: ${p.approach}` : ''}
                    {p.approach && p.solution_notes ? ' | ' : ''}
                    {p.solution_notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setRevisionProblem(p);
                    setRevForm({
                      specific_date: todayStr,
                      start_time: '20:00',
                      end_time: '21:00',
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule Revision</span>
                </button>
                <button
                  onClick={() => openEditModal(p)}
                  className="p-1.5 text-slate-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProblemToDelete(p)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit DSA Problem Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProblem ? 'Edit DSA Problem' : 'Log DSA Problem'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProblem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">Problem Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Longest Increasing Subsequence"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Problem URL</label>
            <input
              type="url"
              value={form.problem_url}
              onChange={(e) => setForm({ ...form, problem_url: e.target.value })}
              placeholder="https://leetcode.com/problems/..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">DSA Topic</label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Time Taken (mins)</label>
              <input
                type="number"
                min={0}
                value={form.time_taken_minutes}
                onChange={(e) => setForm({ ...form, time_taken_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Time Complexity</label>
              <input
                type="text"
                value={form.time_complexity}
                onChange={(e) => setForm({ ...form, time_complexity: e.target.value })}
                placeholder="O(n log n)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Space Complexity</label>
              <input
                type="text"
                value={form.space_complexity}
                onChange={(e) => setForm({ ...form, space_complexity: e.target.value })}
                placeholder="O(n)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Next Review Date</label>
              <input
                type="date"
                value={form.review_date}
                onChange={(e) => setForm({ ...form, review_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Algorithmic Approach</label>
            <input
              type="text"
              value={form.approach}
              onChange={(e) => setForm({ ...form, approach: e.target.value })}
              placeholder="e.g. Binary Search + Patience Sorting / Monotonic Stack"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Solution Notes / Edge Cases</label>
            <textarea
              rows={2}
              value={form.solution_notes}
              onChange={(e) => setForm({ ...form, solution_notes: e.target.value })}
              placeholder="Key invariants, base cases, and pitfalls..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
              {editingProblem ? 'Update Problem' : 'Save Problem'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule DSA Revision Modal */}
      <Modal
        isOpen={!!revisionProblem}
        onClose={() => setRevisionProblem(null)}
        title={`Schedule Revision — ${revisionProblem?.title || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleScheduleRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Revision Date</label>
            <input
              type="date"
              required
              value={revForm.specific_date}
              onChange={(e) => setRevForm({ ...revForm, specific_date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Start Time</label>
              <input
                type="time"
                required
                value={revForm.start_time}
                onChange={(e) => setRevForm({ ...revForm, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">End Time</label>
              <input
                type="time"
                required
                value={revForm.end_time}
                onChange={(e) => setRevForm({ ...revForm, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevisionProblem(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
              Add to Timetable
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!problemToDelete}
        onClose={() => setProblemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete DSA Problem?"
        message={`Are you sure you want to delete "${problemToDelete?.title}"?`}
      />
    </div>
  );
};
