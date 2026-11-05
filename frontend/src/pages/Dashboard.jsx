import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, timetableService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FocusTimer from '../components/common/FocusTimer';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardService.getDashboardData();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleSession = async (sessionId) => {
    try {
      await timetableService.toggleSession(sessionId);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle session:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const timetable = data?.timetable || {};
  const tasks = data?.tasks || {};
  const leetcode = data?.leetcode || {};
  const subjects = data?.subjects || {};
  const weekly = data?.weeklyProgress || {};

  return (
    <div>
      {/* Welcome Message & Quick Links Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Welcome back, {user?.name || 'Student'}! 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Here is your daily study planner and progress summary.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/timetable" className="btn btn-primary btn-sm">
              + Add Study Session
            </Link>
            <Link to="/leetcode" className="btn btn-secondary btn-sm">
              💻 View LeetCode Questions
            </Link>
            <Link to="/subjects" className="btn btn-secondary btn-sm">
              📚 View Core Syllabus
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Tasks Pending</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>
            {tasks.pending || 0}
          </span>
          <span className="stat-desc">{tasks.completed || 0} completed</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">LeetCode Solved</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {leetcode.solved || 0}
          </span>
          <span className="stat-desc">{leetcode.remaining || 0} questions remaining</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Core Syllabus</span>
          <span className="stat-value" style={{ color: 'var(--primary)' }}>
            {subjects.overallPercentage || 0}%
          </span>
          <span className="stat-desc">{subjects.completedTopics || 0} of {subjects.totalTopics || 0} topics done</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Weekly Study Goal</span>
          <span className="stat-value" style={{ color: 'var(--info)' }}>
            {weekly.hoursLogged || 0}h
          </span>
          <span className="stat-desc">Goal: {weekly.goalHours || 15} hours ({weekly.goalProgressPercentage || 0}%)</span>
        </div>
      </div>

      {/* Main Grid: Today's Timetable + Focus Timer */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Today's Timetable */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              📅 Today's Study Timetable
            </h3>
            <Link to="/timetable" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Full Timetable →
            </Link>
          </div>

          {/* Next upcoming session alert */}
          {timetable.nextUpcomingSession && (
            <div
              className="alert alert-info"
              style={{ padding: '10px 14px', marginBottom: '14px', fontSize: '0.85rem' }}
            >
              <div>
                <strong>Next Upcoming:</strong> {timetable.nextUpcomingSession.subject} —{' '}
                {timetable.nextUpcomingSession.topic} ({timetable.nextUpcomingSession.startTime} -{' '}
                {timetable.nextUpcomingSession.endTime})
              </div>
            </div>
          )}

          {timetable.todaySessions && timetable.todaySessions.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Subject & Topic</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.todaySessions.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        {s.startTime} - {s.endTime}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.subject}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.topic}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === 'Completed' ? 'badge-completed' : 'badge-pending'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleSession(s._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {s.status === 'Completed' ? 'Mark Pending' : 'Mark Done'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div className="empty-title">No sessions scheduled for today</div>
              <p className="empty-text">Plan your study topics for today to keep on track.</p>
              <Link to="/timetable" className="btn btn-primary btn-sm">
                + Add Session
              </Link>
            </div>
          )}
        </div>

        {/* 25-Min Focus Timer */}
        <div>
          <FocusTimer onSessionCompleted={fetchDashboardData} />
        </div>
      </div>

      {/* Bottom Grid: Core Subjects Syllabus Progress & Weekly Summary */}
      <div className="grid-2">
        {/* Core Subjects Completion */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              📚 Core Subjects Syllabus Progress
            </h3>
            <Link to="/subjects" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              View All 7 Subjects →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {subjects.list && subjects.list.length > 0 ? (
              subjects.list.slice(0, 5).map((sub) => (
                <div key={sub._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sub.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {sub.stats?.completedTopics}/{sub.stats?.totalTopics} topics ({sub.stats?.completionPercentage || 0}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${sub.stats?.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subject data found.</p>
            )}
          </div>
        </div>

        {/* Weekly Study Summary & Tasks Quick Peek */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              📈 Weekly Progress & Tasks
            </h3>
            <Link to="/tasks" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Manage Tasks →
            </Link>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Weekly Goal Progress ({weekly.hoursLogged || 0} / {weekly.goalHours || 15} hrs)</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{weekly.goalProgressPercentage || 0}%</span>
            </div>
            <div className="progress-track" style={{ height: '10px' }}>
              <div
                className="progress-fill progress-fill-success"
                style={{ width: `${weekly.goalProgressPercentage || 0}%` }}
              />
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Pending High Priority Tasks
          </h4>
          {tasks.recentPending && tasks.recentPending.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.recentPending.slice(0, 3).map((t) => (
                <div
                  key={t._id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.title}</span>
                  <span className={`badge ${t.priority === 'High' ? 'badge-high' : 'badge-low'}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No pending tasks right now. Great job!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
