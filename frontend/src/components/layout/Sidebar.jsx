import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BookMarked,
  Code2,
  Terminal,
  Briefcase,
  BarChart3,
  Settings,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Study Planner', path: '/planner', icon: CalendarCheck },
  { name: 'Subjects', path: '/subjects', icon: BookMarked },
  { name: 'DSA Tracker', path: '/dsa', icon: Code2 },
  { name: 'Programming Practice', path: '/practice', icon: Terminal },
  { name: 'Placement Preparation', path: '/placement', icon: Briefcase },
  { name: 'Progress Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 min-h-screen flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-none">
                CSE Study Planner
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 mt-1">
                Engineering Portal
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 text-indigo-600 font-bold border-l-4 border-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Pro / Placement Badge Card */}
      <div className="p-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-blue-500/10 border border-indigo-100/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Placement Season</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Track daily DSA & core subjects to crack your dream tech offer.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
