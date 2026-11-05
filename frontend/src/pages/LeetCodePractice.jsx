import React, { useState, useEffect } from 'react';
import { leetcodeService } from '../services/api';

const LeetCodePractice = () => {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Custom Question Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('Arrays');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = {
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        status: selectedStatus,
        search: searchQuery,
      };
      const res = await leetcodeService.getProblems(params);
      if (res.data.success) {
        setProblems(res.data.problems || []);
        setStats(res.data.stats || null);
        setTopics(res.data.topics || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load LeetCode questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [selectedTopic, selectedDifficulty, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProblems();
  };

  const handleStatusChange = async (problemId, newStatus) => {
    try {
      await leetcodeService.updateStatus(problemId, { status: newStatus });
      fetchProblems();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim() || !newTopic || !newDifficulty || !newUrl.trim()) {
      setFormError('Please fill in question title, topic, difficulty, and LeetCode URL.');
      return;
    }

    setSubmitting(true);
    try {
      await leetcodeService.addProblem({
        title: newTitle.trim(),
        topic: newTopic,
        difficulty: newDifficulty,
        problemUrl: newUrl.trim(),
        description: newDescription.trim(),
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewUrl('');
      setNewDescription('');
      fetchProblems();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header and Add Button */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>LeetCode Practice Tracker</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Curated important DSA questions organized by topic and difficulty with direct LeetCode links.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            + Add Custom Question
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Solved</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              {stats.solved} / {stats.total}
            </span>
            <span className="stat-desc">
              {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}% completion
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Easy Solved</span>
            <span className="stat-value" style={{ color: 'var(--info)' }}>
              {stats.easy.solved} / {stats.easy.total}
            </span>
            <span className="stat-desc">Foundational problems</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Medium Solved</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>
              {stats.medium.solved} / {stats.medium.total}
            </span>
            <span className="stat-desc">Standard interview level</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Hard Solved</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>
              {stats.hard.solved} / {stats.hard.total}
            </span>
            <span className="stat-desc">Advanced algorithms</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search problems by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="All">All Topics ({topics.length})</option>
            {topics.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="Attempted">Attempted</option>
            <option value="Solved">Solved</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Problems Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Questions List ({problems.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing curated & user added questions
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Loading LeetCode questions...
          </p>
        ) : problems.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>LeetCode Link</th>
                  <th style={{ textAlign: 'right' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => {
                  const diffClass =
                    p.difficulty === 'Easy'
                      ? 'badge-easy'
                      : p.difficulty === 'Medium'
                      ? 'badge-medium'
                      : 'badge-hard';

                  const statusClass =
                    p.status === 'Solved'
                      ? 'badge-solved'
                      : p.status === 'Attempted'
                      ? 'badge-progress'
                      : 'badge-notstarted';

                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.topic}</span>
                      </td>
                      <td>
                        <span className={`badge ${diffClass}`}>{p.difficulty}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>{p.status}</span>
                      </td>
                      <td>
                        <a
                          href={p.problemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          Open on LeetCode ↗
                        </a>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <select
                          className="form-select"
                          style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
                          value={p.status}
                          onChange={(e) => handleStatusChange(p._id, e.target.value)}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Attempted">Attempted</option>
                          <option value="Solved">Solved</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💻</div>
            <div className="empty-title">No questions found</div>
            <p className="empty-text">Try adjusting your topic, difficulty, or search filters.</p>
            <button
              onClick={() => {
                setSelectedTopic('All');
                setSelectedDifficulty('All');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="btn btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Add Custom Question Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Custom LeetCode Question</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Question Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Trapping Rain Water"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Topic</label>
                    <select
                      className="form-select"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                    >
                      {topics.map((t, idx) => (
                        <option key={idx} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-select"
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">LeetCode Problem URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://leetcode.com/problems/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description / Key Concept (Optional)</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Brief note on algorithm technique or optimal time complexity..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
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
                  {submitting ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeetCodePractice;
