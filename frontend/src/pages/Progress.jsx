import React, { useState, useEffect } from 'react';
import { progressService } from '../services/api';

const Progress = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await progressService.getOverview();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load progress overview.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading your learning progress analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const sessions = data?.sessions || {};
  const leetcode = data?.leetcode || {};
  const syllabus = data?.syllabus || {};
  const tasks = data?.tasks || {};
  const focus = data?.focus || {};

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Learning Progress Overview</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Comprehensive statistics on your completed study sessions, solved LeetCode questions, syllabus completion, and tasks.
        </p>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Study Time</span>
          <span className="stat-value" style={{ color: 'var(--primary)' }}>
            {sessions.totalHours || 0} hrs
          </span>
          <span className="stat-desc">{sessions.completedCount || 0} study sessions completed</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">LeetCode Solve Rate</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {leetcode.solveRate || 0}%
          </span>
          <span className="stat-desc">{leetcode.solved || 0} of {leetcode.total || 0} questions solved</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Syllabus Covered</span>
          <span className="stat-value" style={{ color: 'var(--info)' }}>
            {syllabus.overallPercentage || 0}%
          </span>
          <span className="stat-desc">{syllabus.completedTopics || 0} of {syllabus.totalTopics || 0} topics completed</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Task Completion</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>
            {tasks.completionRate || 0}%
          </span>
          <span className="stat-desc">{tasks.completed || 0} of {tasks.total || 0} tasks finished</span>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* LeetCode Difficulty Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">💻 LeetCode Problem Solved Breakdown</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Easy */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Easy Questions</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {leetcode.difficultyBreakdown?.easy?.solved || 0} / {leetcode.difficultyBreakdown?.easy?.total || 0}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    backgroundColor: 'var(--info)',
                    width: `${
                      leetcode.difficultyBreakdown?.easy?.total > 0
                        ? Math.round(
                            (leetcode.difficultyBreakdown.easy.solved /
                              leetcode.difficultyBreakdown.easy.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Medium Questions</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {leetcode.difficultyBreakdown?.medium?.solved || 0} / {leetcode.difficultyBreakdown?.medium?.total || 0}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    backgroundColor: 'var(--warning)',
                    width: `${
                      leetcode.difficultyBreakdown?.medium?.total > 0
                        ? Math.round(
                            (leetcode.difficultyBreakdown.medium.solved /
                              leetcode.difficultyBreakdown.medium.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Hard Questions</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {leetcode.difficultyBreakdown?.hard?.solved || 0} / {leetcode.difficultyBreakdown?.hard?.total || 0}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    backgroundColor: 'var(--danger)',
                    width: `${
                      leetcode.difficultyBreakdown?.hard?.total > 0
                        ? Math.round(
                            (leetcode.difficultyBreakdown.hard.solved /
                              leetcode.difficultyBreakdown.hard.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Focus Timer Session Summary */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">⏱️ Dedicated Focus Summary</h3>
          </div>

          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
              {focus.totalHours || 0} Hours
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Logged across {focus.totalSessions || 0} individual 25-minute Pomodoro focus blocks ({focus.totalMinutes || 0} total minutes).
            </p>

            <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                💡 Pro Study Tip
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Consistent 25-minute study intervals followed by 5-minute mental breaks prevent cognitive burnout and reinforce deep memory retention for complex CSE concepts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Syllabus Completion Matrix */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📚 Core Subject Syllabus Coverage</h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Total Topics</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Pending</th>
                <th style={{ width: '220px' }}>Completion Progress</th>
              </tr>
            </thead>
            <tbody>
              {syllabus.subjects && syllabus.subjects.length > 0 ? (
                syllabus.subjects.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{sub.name}</span>
                      {sub.code && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          [{sub.code}]
                        </span>
                      )}
                    </td>
                    <td>{sub.stats?.totalTopics || 0}</td>
                    <td>
                      <span className="badge badge-completed">{sub.stats?.completedTopics || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-progress">{sub.stats?.inProgressTopics || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-pending">{sub.stats?.pendingTopics || 0}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-track" style={{ flex: 1, margin: 0 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${sub.stats?.completionPercentage || 0}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '35px' }}>
                          {sub.stats?.completionPercentage || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No subject data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Progress;
