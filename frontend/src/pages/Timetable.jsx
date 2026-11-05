import React, { useState, useEffect } from 'react';
import { timetableService } from '../services/api';

const formatDate = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Timetable = () => {
  const [sessions, setSessions] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('day'); // 'day' or 'week' or 'all'
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formSubject, setFormSubject] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState(formatDate(new Date()));
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Common CSE subjects dropdown + allows typing custom subject
  const predefinedSubjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Design and Analysis of Algorithms',
    'Computer Organization and Architecture',
    'Object-Oriented Programming',
    'Discrete Mathematics',
    'Theory of Computation',
    'Compiler Design',
    'Web Development',
    'Other / Custom Subject',
  ];

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let params = {};
      if (view === 'day') {
        params = { view: 'day', date: selectedDate };
      } else if (view === 'week') {
        params = { view: 'week', startDate: selectedDate };
      }
      const res = await timetableService.getSessions(params);
      if (res.data.success) {
        setSessions(res.data.sessions || []);
        setNextSession(res.data.nextSession || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [view, selectedDate]);

  const handleOpenAddModal = () => {
    setEditingSession(null);
    setFormSubject('Data Structures and Algorithms');
    setFormTopic('');
    setFormDate(selectedDate || formatDate(new Date()));
    setFormStartTime('09:00');
    setFormEndTime('10:30');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingSession(s);
    setFormSubject(s.subject);
    setFormTopic(s.topic);
    setFormDate(s.date);
    setFormStartTime(s.startTime);
    setFormEndTime(s.endTime);
    setFormNotes(s.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formSubject.trim() || !formTopic.trim() || !formDate || !formStartTime || !formEndTime) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Validate end time is strictly after start time
    const [startH, startM] = formStartTime.split(':').map(Number);
    const [endH, endM] = formEndTime.split(':').map(Number);
    if (endH * 60 + endM <= startH * 60 + startM) {
      setFormError('End time must be strictly after the start time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: formSubject.trim(),
        topic: formTopic.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        notes: formNotes.trim(),
      };

      if (editingSession) {
        await timetableService.updateSession(editingSession._id, payload);
      } else {
        await timetableService.createSession(payload);
      }
      setIsModalOpen(false);
      fetchSessions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save study session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await timetableService.toggleSession(id);
      fetchSessions();
    } catch (err) {
      console.error('Failed to toggle session:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this study session?')) {
      try {
        await timetableService.deleteSession(id);
        fetchSessions();
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
  };

  return (
    <div>
      {/* Header controls & View selector */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Study Timetable</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Plan, organize, and track your daily & weekly CSE study sessions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Selector */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 'var(--radius-md)', padding: '3px' }}>
              <button
                className={`btn btn-sm ${view === 'day' ? 'btn-primary' : ''}`}
                style={{ background: view === 'day' ? 'var(--primary)' : 'transparent', color: view === 'day' ? '#fff' : 'var(--text-main)', border: 'none' }}
                onClick={() => setView('day')}
              >
                Day View
              </button>
              <button
                className={`btn btn-sm ${view === 'week' ? 'btn-primary' : ''}`}
                style={{ background: view === 'week' ? 'var(--primary)' : 'transparent', color: view === 'week' ? '#fff' : 'var(--text-main)', border: 'none' }}
                onClick={() => setView('week')}
              >
                Week View
              </button>
              <button
                className={`btn btn-sm ${view === 'all' ? 'btn-primary' : ''}`}
                style={{ background: view === 'all' ? 'var(--primary)' : 'transparent', color: view === 'all' ? '#fff' : 'var(--text-main)', border: 'none' }}
                onClick={() => setView('all')}
              >
                All Sessions
              </button>
            </div>

            {/* Date Picker */}
            {view !== 'all' && (
              <input
                type="date"
                className="form-control"
                style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            )}

            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Add Session
            </button>
          </div>
        </div>
      </div>

      {/* Next Upcoming Session Banner */}
      {nextSession && (
        <div className="alert alert-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            🔔 <strong>Next Session:</strong> {nextSession.subject} — {nextSession.topic} on {nextSession.date} from {nextSession.startTime} to {nextSession.endTime}
          </div>
          <button onClick={() => handleToggle(nextSession._id)} className="btn btn-primary btn-sm">
            Mark Done
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Timetable Sessions List / Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Scheduled Sessions ({sessions.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sorted in chronological time order
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Loading timetable...
          </p>
        ) : sessions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time & Duration</th>
                  <th>Subject</th>
                  <th>Topic & Notes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const isNext = nextSession && nextSession._id === s._id;
                  return (
                    <tr key={s._id} style={{ background: isNext ? '#eff6ff' : 'transparent' }}>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.startTime} - {s.endTime}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.duration} hrs</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.subject}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.topic}</div>
                        {s.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {s.notes}
                          </div>
                        )}
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
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleToggle(s._id)}
                            className="btn btn-secondary btn-sm"
                            title="Toggle status"
                          >
                            {s.status === 'Completed' ? '↩ Reopen' : '✓ Done'}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="btn btn-secondary btn-sm"
                            title="Edit session"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="btn btn-danger btn-sm"
                            title="Delete session"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">No study sessions found</div>
            <p className="empty-text">
              {view === 'day'
                ? `No sessions planned for ${selectedDate}. Click below to schedule a session.`
                : 'No sessions scheduled in this timeframe. Schedule your subjects to stay organized.'}
            </p>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Add Study Session
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add / Edit Study Session */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSession ? 'Edit Study Session' : 'Schedule Study Session'}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                {/* Subject selection / custom entry */}
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter or select subject (e.g. Operating Systems)"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    list="subject-suggestions"
                    required
                  />
                  <datalist id="subject-suggestions">
                    {predefinedSubjects.map((sub, idx) => (
                      <option key={idx} value={sub} />
                    ))}
                  </datalist>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tip: You can select a core subject or type your own custom course name.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Page Replacement Algorithms & LRU"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Study Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Key questions to solve, references, or textbook chapters..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : editingSession ? 'Update Session' : 'Add Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
