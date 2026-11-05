import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Study Timetable', path: '/timetable', icon: '📅' },
    { name: 'LeetCode Practice', path: '/leetcode', icon: '💻' },
    { name: 'Core Subjects', path: '/subjects', icon: '📚' },
    { name: 'My Tasks', path: '/tasks', icon: '✅' },
    { name: 'My Progress', path: '/progress', icon: '📈' },
    { name: 'Profile / Logout', path: '/profile', icon: '👤' },
  ];

  // Get current page title from path
  const currentNav = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNav ? currentNav.name : 'CSE Study Planner';

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="app-container">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <span>CSE Planner</span>
            <span className="brand-badge">STUDENT</span>
          </div>
          <div className="brand-sub">Computer Science & Engineering</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-details">
              <div className="user-name" title={user?.name}>{user?.name || 'Student'}</div>
              <div className="user-email" title={user?.email}>{user?.email || 'student@cse.edu'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '6px' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div>
              <h1 className="page-title">{pageTitle}</h1>
              <div className="header-date">{todayFormatted}</div>
            </div>
          </div>

          <div className="header-right">
            <NavLink to="/profile" className="btn btn-secondary btn-sm">
              <span style={{ marginRight: '4px' }}>👤</span> {user?.name?.split(' ')[0] || 'Profile'}
            </NavLink>
          </div>
        </header>

        <main className="content-body">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
