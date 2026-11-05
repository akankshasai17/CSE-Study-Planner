import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
      };
      const res = await taskService.getTasks(params);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setPriority(task.priority);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please provide task title.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
      };

      if (editingTask) {
        await taskService.updateTask(editingTask._id, payload);
      } else {
        await taskService.createTask(payload);
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await taskService.toggleTask(id);
      fetchTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this study task?')) {
      try {
        await taskService.deleteTask(id);
        fetchTasks();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  return (
    <div>
      {/* Header and Add Task */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Personal Study Tasks</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Keep track of assignments, lab practicals, review topics, and exam preparations.
            </p>
          </div>

          <button onClick={handleOpenAddModal} className="btn btn-primary">
            + Add New Task
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-desc">All created tasks</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>
              {stats.pending}
            </span>
            <span className="stat-desc">To be completed</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              {stats.completed}
            </span>
            <span className="stat-desc">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
            </span>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tasks Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tasks ({tasks.length})</h3>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Loading tasks...
          </p>
        ) : tasks.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Done</th>
                  <th>Title & Description</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const isDone = t.status === 'Completed';
                  const priorityClass =
                    t.priority === 'High'
                      ? 'badge-high'
                      : t.priority === 'Medium'
                      ? 'badge-medium'
                      : 'badge-low';

                  return (
                    <tr key={t._id} style={{ opacity: isDone ? 0.75 : 1 }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggle(t._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${priorityClass}`}>{t.priority}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {t.dueDate ? t.dueDate : <span style={{ color: 'var(--text-light)' }}>No due date</span>}
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-completed' : 'badge-pending'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t._id)}
                            className="btn btn-danger btn-sm"
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
            <div className="empty-icon">✅</div>
            <div className="empty-title">No tasks found</div>
            <p className="empty-text">Create personal tasks with due dates and priority tags.</p>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Add First Task
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task' : 'Add Study Task'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Complete DBMS Assignment on 3NF Decomposition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Instructions</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Any specific instructions, links, or notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
