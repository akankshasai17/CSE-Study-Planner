import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Target,
  CheckSquare,
  GraduationCap,
  Code2,
  BarChart3,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Calendar as CalendarIcon,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Modal } from '@/components/ui/Modal';

interface NotificationItem {
  id: string;
  type: string;
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  link: string;
  date: string;
}

interface CombinedCalendarEvent {
  id: string;
  entity_id: number;
  category: 'college_class' | 'study_session' | 'revision' | 'assignment' | 'exam';
  title: string;
  subject_name: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  status: string;
  details: string;
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Timetable', path: '/timetable', icon: CalendarDays },
  { name: 'Study Planner', path: '/study-planner', icon: Target },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Exams', path: '/exams', icon: GraduationCap },
  { name: 'DSA Tracker', path: '/dsa', icon: Code2 },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, warning } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Unified Calendar Modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarEvents, setCalendarEvents] = useState<CombinedCalendarEvent[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/analytics/notifications-feed');
        setNotifications(res.data.notifications || []);
      } catch {
        // silent fail for background poll
      }
    };
    fetchNotifications();
  }, [location.pathname]);

  useEffect(() => {
    if (!calendarModalOpen) return;
    const [yr, mo] = calendarMonth.split('-').map(Number);
    const startStr = `${yr}-${String(mo).padStart(2, '0')}-01`;
    const lastDay = new Date(yr, mo, 0).getDate();
    const endStr = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    api
      .get(`/api/analytics/calendar?start_date=${startStr}&end_date=${endStr}`)
      .then((res) => setCalendarEvents(res.data.events || []))
      .catch(() => {});
  }, [calendarModalOpen, calendarMonth]);

  const handleRequestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      warning('Browser Notifications Unavailable', 'Your browser does not support desktop notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await api.put('/api/auth/notifications', { browser_notifications_enabled: true });
      success('Browser Notifications Enabled', 'You will receive alerts for upcoming study sessions and deadlines.');
    } else {
      warning('Permission Declined', 'You can enable notifications later in your browser settings.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calendar grid helper
  const renderCalendarDays = () => {
    const [yr, mo] = calendarMonth.split('-').map(Number);
    const firstDayIndex = (new Date(yr, mo - 1, 1).getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvs = calendarEvents.filter((e) => e.date === dStr);
      const isSelected = selectedCalendarDate === dStr;

      cells.push(
        <button
          key={dStr}
          type="button"
          onClick={() => setSelectedCalendarDate(dStr)}
          className={`h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all overflow-hidden ${
            isSelected
              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-white dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{d}</span>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvs.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                className="text-[10px] px-1 py-0.2 rounded truncate text-white font-medium"
                style={{ backgroundColor: ev.color }}
              >
                {ev.title}
              </div>
            ))}
            {dayEvs.length > 2 && (
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                +{dayEvs.length - 2} more
              </div>
            )}
          </div>
        </button>
      );
    }
    return cells;
  };

  const selectedDateEvents = calendarEvents.filter((e) => e.date === selectedCalendarDate);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CSE Study Planner
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Engineering Productivity
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Student Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Sem {user?.profile?.semester || 5} • CSE
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>
                {user?.profile?.college_name
                  ? `${user.profile.college_name} • ${user.profile.academic_week || 'Academic Session'}`
                  : 'Computer Science & Engineering Study Workspace'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Unified Master Calendar Button */}
            <button
              onClick={() => setCalendarModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open Master Calendar"
            >
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Calendar</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold">Academic Alerts & Reminders</h4>
                      <p className="text-[11px] text-slate-500">Tasks, exams & today&apos;s study schedule</p>
                    </div>
                    <button
                      onClick={handleRequestBrowserNotifications}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Enable Browser Alerts
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No urgent deadlines or alerts right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(n.link);
                          }}
                          className="w-full text-left py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors flex items-start gap-2.5"
                        >
                          <AlertCircle
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              n.severity === 'urgent'
                                ? 'text-red-500'
                                : n.severity === 'warning'
                                ? 'text-amber-500'
                                : 'text-blue-500'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {n.message}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle color theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-semibold hidden sm:inline max-w-[120px] truncate">
                  {user?.full_name}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profile & Study Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Unified Master Calendar Modal */}
      <Modal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        title="Unified Academic & Study Calendar"
        subtitle="Combined view of College Classes, Personal Study Sessions, Assignments, Exams & Revisions"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Month:</label>
              <input
                type="month"
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> College Class
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Study Session
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Assignment Due
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Exam
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500 py-1">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">{renderCalendarDays()}</div>

          {/* Selected Date Details & Quick Create Actions */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold">
                Events on {selectedCalendarDate} ({selectedDateEvents.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCalendarModalOpen(false);
                    navigate(`/timetable?date=${selectedCalendarDate}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  + Schedule Session on {selectedCalendarDate}
                </button>
              </div>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No classes, study sessions, tasks, or exams scheduled for {selectedCalendarDate}.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{ev.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {ev.subject_name ? `${ev.subject_name} • ` : ''}
                          {ev.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3" /> {ev.start_time}
                        {ev.end_time && ev.end_time !== ev.start_time ? ` – ${ev.end_time}` : ''}
                      </span>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{ev.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
