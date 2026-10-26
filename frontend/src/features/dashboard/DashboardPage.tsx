import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ListTodo,
  GraduationCap,
  Code2,
  Flame,
  Calendar,
  ArrowRight,
  Sparkles,
  Quote,
  Play,
  Plus,
  AlertCircle,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api, extractErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      error('Failed to load dashboard', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickSeedCoreSubjects = async () => {
    setSeeding(true);
    try {
      await api.post('/api/subjects/seed-defaults', [
        'Data Structures and Algorithms',
        'Database Management Systems',
        'Operating Systems',
        'Computer Networks',
      ]);
      success('Core CSE Subjects Added!', '4 subjects with syllabus modules have been added to your account.');
      fetchDashboard();
    } catch (err) {
      error('Could not add default subjects', extractErrorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const cards = data?.summary_cards || {
    total_subjects: 0,
    todays_scheduled_study_hours: 0,
    actual_completed_study_hours: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    upcoming_exams: 0,
    dsa_problems_solved: 0,
    current_study_streak: 0,
  };

  const summaryItems = [
    {
      label: 'Total Subjects',
      value: cards.total_subjects,
      sub: 'Enrolled courses',
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      link: '/subjects',
    },
    {
      label: "Today's Scheduled Hours",
      value: `${cards.todays_scheduled_study_hours}h`,
      sub: 'On today timetable',
      icon: Calendar,
      color: 'from-indigo-600 to-purple-600',
      link: '/timetable',
    },
    {
      label: 'Completed Hours Today',
      value: `${cards.actual_completed_study_hours}h`,
      sub: `Daily target: ${user?.profile?.daily_study_hour_target || 4}h`,
      icon: Clock,
      color: 'from-emerald-600 to-teal-600',
      link: '/analytics',
    },
    {
      label: 'Pending Tasks',
      value: cards.pending_tasks,
      sub: 'Active assignments',
      icon: ListTodo,
      color: 'from-amber-500 to-orange-600',
      link: '/tasks',
    },
    {
      label: 'Completed Tasks',
      value: cards.completed_tasks,
      sub: 'Finished items',
      icon: CheckCircle2,
      color: 'from-teal-600 to-emerald-600',
      link: '/tasks',
    },
    {
      label: 'Upcoming Exams',
      value: cards.upcoming_exams,
      sub: 'Scheduled tests',
      icon: GraduationCap,
      color: 'from-rose-600 to-red-600',
      link: '/exams',
    },
    {
      label: 'DSA Problems Solved',
      value: cards.dsa_problems_solved,
      sub: 'Coding tracker',
      icon: Code2,
      color: 'from-violet-600 to-purple-600',
      link: '/dsa',
    },
    {
      label: 'Current Study Streak',
      value: `${cards.current_study_streak} day${cards.current_study_streak === 1 ? '' : 's'}`,
      sub: `Best: ${cards.longest_study_streak || 0} days`,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      link: '/analytics',
    },
  ];

  const totalTasksCount = (data?.task_completion_chart || []).reduce(
    (acc: number, item: any) => acc + (item.value || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner + Daily Motivational Quote */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Semester {user?.profile?.semester || 5} • Computer Science &amp; Engineering</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          {data?.daily_quote && (
            <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2 pt-1 italic">
              <Quote className="w-4 h-4 text-blue-300 shrink-0" />
              <span>
                &ldquo;{data.daily_quote.quote}&rdquo; — <strong>{data.daily_quote.author}</strong>
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/timetable')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm flex items-center gap-2 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Open Weekly Timetable</span>
          </button>
          <button
            onClick={() => navigate('/study-planner')}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Open Study Planner</span>
          </button>
        </div>
      </div>

      {/* Empty Account Onboarding Guidance */}
      {data?.is_empty_account && (
        <div className="rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Your workspace is ready! Let&apos;s set up your first subjects and schedule.
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              All dashboard statistics are computed from your real database records. Import standard CSE subjects with
              syllabus topics in one click, or create your own custom subjects and timetable.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleQuickSeedCoreSubjects}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {seeding ? 'Adding Subjects...' : '+ Add 4 Core CSE Subjects'}
            </button>
            <Link
              to="/subjects"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Custom Subject Setup
            </Link>
          </div>
        </div>
      )}

      {/* 8 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.link}
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400/60 transition-all flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{item.value}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{item.sub}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Next Upcoming Session Highlight + Today's Timetable & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable & Next Session */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Today&apos;s Schedule</h2>
                <p className="text-xs text-slate-500">College classes &amp; personal study sessions for {data?.date}</p>
              </div>
              <Link
                to="/timetable"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Next Upcoming Session Banner */}
            {data?.next_upcoming_session && (
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: data.next_upcoming_session.color || '#2563eb' }}
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Next Upcoming Session ({data.next_upcoming_session.date})
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {data.next_upcoming_session.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {data.next_upcoming_session.start_time} – {data.next_upcoming_session.end_time} •{' '}
                      {data.next_upcoming_session.activity_type}
                    </p>
                  </div>
                </div>
                <Link
                  to="/timetable"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shrink-0"
                >
                  View
                </Link>
              </div>
            )}

            {/* Today's Sessions List */}
            {(!data?.todays_timetable || data.todays_timetable.length === 0) ? (
              <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No classes or study sessions scheduled for today yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Add your college timetable or run the Rule-Based Study Schedule Generator.
                </p>
                <Link
                  to="/timetable"
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Today&apos;s Study
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {data.todays_timetable.map((ev: any) => (
                  <div
                    key={ev.occurrence_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-9 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{ev.title}</p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              ev.source === 'college'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {ev.source === 'college' ? 'College' : ev.activity_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {ev.subject_name} {ev.topic_title ? `• ${ev.topic_title}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {ev.start_time} – {ev.end_time}
                      </p>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          ev.status === 'completed'
                            ? 'text-emerald-600'
                            : ev.status === 'skipped'
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Tasks & Upcoming Exams */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {/* Today's Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Priority Tasks</h2>
              <Link to="/tasks" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {(!data?.todays_tasks || data.todays_tasks.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No pending tasks or assignments.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {data.todays_tasks.slice(0, 4).map((t: any) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      t.is_overdue
                        ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Due {t.due_date} • {t.priority}
                      </p>
                    </div>
                    {t.is_overdue && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shrink-0">
                        Overdue
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exam Deadlines */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Upcoming Exams</h2>
              <Link to="/exams" className="text-xs font-bold text-blue-600 hover:underline">
                Manage
              </Link>
            </div>
            {(!data?.upcoming_exams || data.upcoming_exams.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No upcoming exams registered.
              </p>
            ) : (
              <div className="space-y-2">
                {data.upcoming_exams.slice(0, 3).map((ex: any) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {ex.exam_name} ({ex.subject_name})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ex.exam_date} • Syllabus: {ex.syllabus_completion_percentage}%
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-extrabold shrink-0">
                      {ex.days_remaining === 0 ? 'Today!' : `${ex.days_remaining}d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row: Weekly Study Hours + Subject-Wise Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study Hours Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Weekly Study Hours (Planned vs Actual)
            </h2>
            <p className="text-xs text-slate-500">Current week Monday to Sunday (in hours)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_study_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="h" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned_hours" name="Planned Hours" fill="#93c5fd" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual_hours" name="Completed Hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-Wise Progress Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Subject-Wise Progress</h2>
            <p className="text-xs text-slate-500">Syllabus completion % and Study Hours completion %</p>
          </div>
          {(!data?.subject_progress_chart || data.subject_progress_chart.length === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-500">Add subjects to view subject-wise progress charts.</p>
              <Link
                to="/subjects"
                className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Add Subjects
              </Link>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subject_progress_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="syllabus_percentage" name="Syllabus Completed %" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="hours_percentage" name="Target Hours %" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Task Completion Chart + Recent Study Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Task Completion Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">Status across all assignments &amp; tasks</p>
          {totalTasksCount === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-xs text-slate-500">
              No tasks recorded yet.
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.task_completion_chart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.task_completion_chart.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Study Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Study Activity</h2>
          <p className="text-xs text-slate-500 mb-4">
            Latest completed study sessions, logged study hours, solved DSA problems &amp; tasks
          </p>
          {(!data?.recent_study_activity || data.recent_study_activity.length === 0) ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Complete a study session, task, or DSA problem to see your live activity log here.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {data.recent_study_activity.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{act.title}</p>
                    <p className="text-[11px] text-slate-500">{act.subtitle}</p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">{act.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
