import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Trophy,
  BookOpen,
  CheckCircle2,
  Target,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api, extractErrorMessage } from '@/services/api';
import { useToast } from '@/context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const { error } = useToast();

  const [daysRange, setDaysRange] = useState<number>(14);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('days', String(daysRange));
      if (customStart && customEnd) {
        params.set('start_date', customStart);
        params.set('end_date', customEnd);
      }
      const res = await api.get(`/api/analytics/report?${params.toString()}`);
      setReport(res.data);
    } catch (err) {
      error('Failed to load analytics report', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [daysRange, customStart, customEnd, error]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = report?.metrics || {
    current_study_streak: 0,
    longest_study_streak: 0,
    most_studied_subject: null,
    least_studied_subject: null,
    total_completed_study_sessions: 0,
    weekly_goal_completion_percentage: 0,
    weekly_actual_hours: 0,
    weekly_target_hours: 28,
    task_completion_rate: 0,
  };

  const charts = report?.charts || {
    daily_study_hours: [],
    weekly_study_hours: [],
    monthly_study_hours: [],
    subject_study_time: [],
    subject_completion: [],
    task_completion: [],
    dsa_solved_over_time: [],
    focus_sessions_completed: [],
    planned_vs_actual: [],
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Analytics &amp; Academic Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Computed from your real database records across study sessions, tasks, subjects &amp; DSA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => {
                setCustomStart('');
                setCustomEnd('');
                setDaysRange(d);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                daysRange === d && !customStart
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Last {d} Days
            </button>
          ))}

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent focus:outline-none"
            />
            <span>→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-extrabold mt-1">{metrics.current_study_streak} days</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Longest Streak</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold mt-1">{metrics.longest_study_streak} days</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Most-Studied</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-extrabold truncate mt-1">
            {metrics.most_studied_subject ? metrics.most_studied_subject.name : '—'}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.most_studied_subject ? `${metrics.most_studied_subject.hours}h logged` : 'No subjects'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Least-Studied</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-sm font-extrabold truncate mt-1">
            {metrics.least_studied_subject ? metrics.least_studied_subject.name : '—'}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.least_studied_subject ? `${metrics.least_studied_subject.hours}h logged` : 'No subjects'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold mt-1">{metrics.total_completed_study_sessions}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Weekly Goal</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
            {metrics.weekly_goal_completion_percentage}%
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.weekly_actual_hours}h / {metrics.weekly_target_hours}h
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Row 1: Daily Study Hours & Planned vs Actual Study Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Daily Study Hours */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">1. Daily Study Hours</h2>
              <p className="text-xs text-slate-500 mb-4">Actual completed study hours per day</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.daily_study_hours}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis unit="h" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      name="Completed Study Hours"
                      stroke="#2563eb"
                      fill="#93c5fd"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 9. Planned vs Actual Study Time */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">2. Planned vs. Actual Study Time</h2>
              <p className="text-xs text-slate-500 mb-4">Scheduled timetable hours compared with completed hours</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.planned_vs_actual}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis unit="h" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="planned_hours" name="Planned (h)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual_hours" name="Actual (h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Weekly Study Hours & Monthly Study Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. Weekly Study Hours */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">3. Weekly Study Hours</h2>
              <p className="text-xs text-slate-500 mb-4">Aggregated study hours by academic week</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.weekly_study_hours}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis unit="h" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="planned_hours" name="Weekly Planned (h)" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual_hours" name="Weekly Actual (h)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Monthly Study Hours */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">4. Monthly Study Hours</h2>
              <p className="text-xs text-slate-500 mb-4">Monthly total planned vs actual study hours</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_study_hours}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis unit="h" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="planned_hours" name="Monthly Planned (h)" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual_hours" name="Monthly Actual (h)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Subject-Wise Study Time & Subject Completion Percentage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. Subject-Wise Study Time */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">5. Subject-Wise Study Time</h2>
              <p className="text-xs text-slate-500 mb-4">Completed vs Target study hours per subject</p>
              {charts.subject_study_time.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No subjects added yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.subject_study_time}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                      <YAxis unit="h" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="completed_hours" name="Completed Hours" fill="#0891b2" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target_hours" name="Target Hours" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5. Subject Completion Percentage */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">6. Subject Completion Percentage</h2>
              <p className="text-xs text-slate-500 mb-4">Syllabus topics completion % per subject</p>
              {charts.subject_completion.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No subjects added yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.subject_completion}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        dataKey="syllabus_completion_percentage"
                        name="Syllabus Completion %"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="hours_completion_percentage"
                        name="Hours Completion %"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: DSA Problems Solved Over Time & Task Completion Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7. DSA Problems Solved Over Time */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">7. DSA Problems Solved Over Time</h2>
              <p className="text-xs text-slate-500 mb-4">Daily and cumulative solved problems</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.dsa_solved_over_time}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="cumulative_solved"
                      name="Cumulative Solved"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="solved_count"
                      name="Daily Solved"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 8. Task Completion Rate */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold">
                8. Task Completion Rate ({metrics.task_completion_rate}%)
              </h2>
              <p className="text-xs text-slate-500 mb-4">Completed vs In Progress vs Pending</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.task_completion}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {charts.task_completion.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
