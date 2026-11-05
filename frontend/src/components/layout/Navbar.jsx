import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Calendar,
  LogOut,
  User,
  Settings,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/api';

const Navbar = ({ onSearch, searchQuery = '', onToggleSidebar }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [upcomingAlerts, setUpcomingAlerts] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch upcoming alerts for notification bell
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await taskService.getAll({ view: 'upcoming' });
        if (res.data.success) {
          setUpcomingAlerts(res.data.data.slice(0, 5));
        }
      } catch (err) {
        // Silently catch
      }
    };
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  // Current formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const displayName = profile?.studentName || user?.name || 'CSE Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 md:px-8 backdrop-blur-md">
      {/* Mobile Hamburger Toggle & Search Bar */}
      <div className="flex items-center flex-1 max-w-md mr-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-1 mr-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Search subjects, DSA problems, tasks..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs md:text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Right Controls: Date, Notifications, Profile */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Date Display */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/50">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {upcomingAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Deadlines & Reminders</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                  {upcomingAlerts.length} Upcoming
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {upcomingAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                    No upcoming deadlines due. You're on track!
                  </div>
                ) : (
                  upcomingAlerts.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/planner');
                      }}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                    >
                      <div className="flex items-start space-x-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700 line-clamp-1">{task.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {task.subject} • {new Date(task.studyDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/planner');
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View All Study Tasks →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-sm shadow-indigo-200">
              {initial}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-none">
                {profile?.branch ? 'CSE Student' : 'Student'}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <p className="text-[10px] text-indigo-600 font-medium mt-1">
                  {profile?.collegeName || 'Engineering College'}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors space-x-2.5"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account & Study Goals</span>
                </Link>
                <Link
                  to="/subjects"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors space-x-2.5"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Manage Subjects</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors space-x-2.5 font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
