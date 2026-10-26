import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  CheckCircle2,
  Clock,
  BookOpen,
  ListTodo,
  Bell,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { Subject, TaskItem, FocusSession } from '@/types';
import { usePomodoro, TimerMode } from '@/context/PomodoroContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

export const PomodoroPage: React.FC = () => {
  const {
    mode,
    durations,
    secondsLeft,
    totalSeconds,
    isRunning,
    isPaused,
    selectedSubjectId,
    selectedTaskId,
    sessionNotes,
    sessionCountVersion,
    setMode,
    updateDurations,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setSelectedSubject,
    setSelectedTask,
    setSessionNotes,
  } = usePomodoro();

  const { success, error, warning } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState<any>({
    total_completed_sessions: 0,
    total_focus_minutes: 0,
    total_focus_hours: 0,
    today_sessions: 0,
    today_focus_minutes: 0,
    week_sessions: 0,
    week_focus_minutes: 0,
  });

  // Customize Durations Modal
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState(durations);

  const fetchPomodoroData = useCallback(async () => {
    try {
      const [sRes, tRes, sessRes, stRes] = await Promise.all([
        api.get<Subject[]>('/api/subjects'),
        api.get<TaskItem[]>('/api/tasks?status=Pending'),
        api.get<FocusSession[]>('/api/pomodoro/sessions?limit=30'),
        api.get('/api/pomodoro/stats'),
      ]);
      setSubjects(sRes.data);
      setTasks(tRes.data);
      setSessions(sessRes.data);
      setStats(stRes.data);
    } catch (err) {
      error('Failed to load Pomodoro data', extractErrorMessage(err));
    }
  }, [error]);

  useEffect(() => {
    fetchPomodoroData();
  }, [fetchPomodoroData, sessionCountVersion]);

  const formatMMSS = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct =
    totalSeconds > 0 ? Math.min(100, Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)) : 0;

  const handleSaveCustomDurations = (e: React.FormEvent) => {
    e.preventDefault();
    updateDurations({
      focus: Math.max(1, Number(customForm.focus)),
      short_break: Math.max(1, Number(customForm.short_break)),
      long_break: Math.max(1, Number(customForm.long_break)),
    });
    setCustomModalOpen(false);
    success('Timer Durations Updated');
  };

  const requestDesktopNotifications = async () => {
    if (!('Notification' in window)) {
      warning('Unsupported', 'Your browser does not support desktop notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      success('Notifications Enabled', 'You will be alerted when focus and break timers finish.');
    }
  };

  const modeColors: Record<TimerMode, string> = {
    focus: 'from-blue-600 to-indigo-700',
    short_break: 'from-emerald-600 to-teal-700',
    long_break: 'from-purple-600 to-indigo-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Pomodoro Focus Timer</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Associate focus sessions with a subject or task. Completed sessions automatically update your study hours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={requestDesktopNotifications}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Browser Alert Permission</span>
          </button>
          <button
            onClick={() => {
              setCustomForm(durations);
              setCustomModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings2 className="w-4 h-4" />
            <span>Customize Durations</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Today&apos;s Focus Sessions</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.today_sessions}</p>
          <p className="text-[11px] text-slate-400">{stats.today_focus_minutes} mins today</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">This Week&apos;s Focus</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.week_focus_minutes}m</p>
          <p className="text-[11px] text-slate-400">{stats.week_sessions} sessions this week</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Completed Sessions</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.total_completed_sessions}</p>
          <p className="text-[11px] text-slate-400">Interrupted sessions excluded</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Focus Minutes</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">
            {stats.total_focus_minutes}m{' '}
            <span className="text-xs font-normal text-slate-400">({stats.total_focus_hours}h)</span>
          </p>
        </div>
      </div>

      {/* Main Timer Card + Association Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
            {(
              [
                { id: 'focus', label: `Focus (${durations.focus}m)` },
                { id: 'short_break', label: `Short Break (${durations.short_break}m)` },
                { id: 'long_break', label: `Long Break (${durations.long_break}m)` },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === m.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timer Clock Display */}
          <div
            className={`w-64 h-64 rounded-full bg-gradient-to-br ${modeColors[mode]} p-2 shadow-2xl flex items-center justify-center`}
          >
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                {mode === 'focus' ? 'Deep Focus' : mode === 'short_break' ? 'Short Break' : 'Long Break'}
              </span>
              <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 my-2 font-mono">
                {formatMMSS(secondsLeft)}
              </span>
              <span className="text-xs font-bold text-blue-600">{progressPct}% complete</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Start / Pause / Resume / Reset Controls */}
          <div className="flex items-center gap-3">
            {!isRunning && !isPaused && (
              <button
                onClick={startTimer}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/25 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Session</span>
              </button>
            )}

            {isRunning && (
              <button
                onClick={pauseTimer}
                className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-extrabold shadow-md flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            {!isRunning && isPaused && (
              <button
                onClick={resumeTimer}
                className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-md flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={resetTimer}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Note: Resetting or interrupting a session early will not count it toward completed Pomodoro statistics.
          </p>
        </div>

        {/* Link Session to Subject / Task */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-base font-bold">Session Association</h2>
          <p className="text-xs text-slate-500">
            Link this focus session to a subject or task so completed minutes automatically increment your study
            records.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Associated Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                const idVal = e.target.value ? Number(e.target.value) : '';
                const found = subjects.find((s) => s.id === idVal);
                setSelectedSubject(idVal, found ? found.name : '');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="">-- General Study --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-indigo-600" /> Associated Task (Optional)
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                const idVal = e.target.value ? Number(e.target.value) : '';
                const found = tasks.find((t) => t.id === idVal);
                setSelectedTask(idVal, found ? found.title : '');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="">-- No Specific Task --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Session Goal / Notes
            </label>
            <textarea
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What specific concept or problem are you focusing on?"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Completed Pomodoro Session History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-base font-bold mb-1">Completed Pomodoro Sessions ({sessions.length})</h2>
        <p className="text-xs text-slate-500 mb-4">Stored in your database across refreshes</p>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No completed Pomodoro sessions recorded yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">
                      {s.mode === 'focus' ? 'Focus Session' : 'Break Session'} — {s.duration_minutes} mins
                      {s.subject_name ? ` • ${s.subject_name}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {s.task_title ? `Task: ${s.task_title} • ` : ''}
                      {s.notes || 'Completed session'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">{s.session_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customize Timer Durations Modal */}
      <Modal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Customize Pomodoro Durations"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCustomDurations} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Focus Duration (minutes)</label>
            <input
              type="number"
              min={1}
              max={180}
              value={customForm.focus}
              onChange={(e) => setCustomForm({ ...customForm, focus: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Short Break (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={customForm.short_break}
              onChange={(e) => setCustomForm({ ...customForm, short_break: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Long Break (minutes)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={customForm.long_break}
              onChange={(e) => setCustomForm({ ...customForm, long_break: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCustomModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Apply Durations
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
