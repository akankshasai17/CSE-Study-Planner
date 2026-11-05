import React, { useState, useEffect } from 'react';
import { subjectService } from '../services/api';

const CoreSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals for customizing syllabus
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await subjectService.getSubjects();
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
        if (!selectedSubjectId && res.data.subjects?.length > 0) {
          setSelectedSubjectId(res.data.subjects[0]._id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load core subjects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectDetails = async (id) => {
    setSubjectLoading(true);
    try {
      const res = await subjectService.getSubjectById(id);
      if (res.data.success) {
        setSelectedSubject(res.data.subject);
      }
    } catch (err) {
      console.error('Failed to load subject details:', err);
    } finally {
      setSubjectLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSubjectDetails(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const handleTopicStatusChange = async (moduleId, topicId, newStatus) => {
    try {
      await subjectService.updateTopicStatus(selectedSubjectId, moduleId, topicId, {
        status: newStatus,
      });
      // Refresh current subject details and overall list
      fetchSubjectDetails(selectedSubjectId);
      fetchSubjects();
    } catch (err) {
      console.error('Failed to update topic status:', err);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    try {
      await subjectService.addModule(selectedSubjectId, { name: newModuleName.trim() });
      setIsModuleModalOpen(false);
      setNewModuleName('');
      fetchSubjectDetails(selectedSubjectId);
      fetchSubjects();
    } catch (err) {
      console.error('Failed to add module:', err);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !targetModuleId) return;
    try {
      await subjectService.addTopic(selectedSubjectId, targetModuleId, {
        name: newTopicName.trim(),
      });
      setIsTopicModalOpen(false);
      setNewTopicName('');
      fetchSubjectDetails(selectedSubjectId);
      fetchSubjects();
    } catch (err) {
      console.error('Failed to add topic:', err);
    }
  };

  const handleDeleteTopic = async (moduleId, topicId) => {
    if (window.confirm('Delete this topic from the syllabus?')) {
      try {
        await subjectService.deleteTopic(selectedSubjectId, moduleId, topicId);
        fetchSubjectDetails(selectedSubjectId);
        fetchSubjects();
      } catch (err) {
        console.error('Failed to delete topic:', err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
        <p>Loading core subjects syllabus...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Core Subjects Syllabus Tracker</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Track and customize syllabus completion for the 7 essential Computer Science & Engineering subjects.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Subject Tab Selector */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {subjects.map((s) => {
          const isSelected = s._id === selectedSubjectId;
          return (
            <button
              key={s._id}
              onClick={() => setSelectedSubjectId(s._id)}
              className="btn btn-sm"
              style={{
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {s.code ? `[${s.code}] ` : ''}
              {s.name} ({s.stats?.completionPercentage || 0}%)
            </button>
          );
        })}
      </div>

      {/* Selected Subject View */}
      {subjectLoading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading syllabus details...
        </p>
      ) : selectedSubject ? (
        <div>
          {/* Subject Overview Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-easy" style={{ marginBottom: '6px' }}>
                  {selectedSubject.code || 'CORE SUBJECT'}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedSubject.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '680px' }}>
                  {selectedSubject.description}
                </p>
              </div>

              {/* Progress Metric Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 20px',
                  textAlign: 'right',
                  minWidth: '200px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  SYLLABUS PROGRESS
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedSubject.stats?.completionPercentage || 0}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedSubject.stats?.completedTopics} of {selectedSubject.stats?.totalTopics} topics completed
                </div>
              </div>
            </div>

            <div className="progress-track" style={{ height: '8px', marginTop: '16px' }}>
              <div
                className="progress-fill"
                style={{ width: `${selectedSubject.stats?.completionPercentage || 0}%` }}
              />
            </div>

            {/* Customization Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Customize this subject to match your university/semester syllabus.
              </span>
              <button onClick={() => setIsModuleModalOpen(true)} className="btn btn-secondary btn-sm">
                + Add Custom Module
              </button>
            </div>
          </div>

          {/* Modules and Topics List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {selectedSubject.modules && selectedSubject.modules.length > 0 ? (
              selectedSubject.modules.map((mod) => (
                <div key={mod._id} className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>
                      📂 {mod.name}
                    </h4>
                    <button
                      onClick={() => {
                        setTargetModuleId(mod._id);
                        setIsTopicModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Topic
                    </button>
                  </div>

                  {mod.topics && mod.topics.length > 0 ? (
                    <div className="table-container" style={{ border: 'none' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Topic Name</th>
                            <th style={{ width: '160px' }}>Status</th>
                            <th style={{ width: '180px', textAlign: 'right' }}>Update</th>
                            <th style={{ width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {mod.topics.map((top) => {
                            const statusClass =
                              top.status === 'Completed'
                                ? 'badge-completed'
                                : top.status === 'In Progress'
                                ? 'badge-progress'
                                : 'badge-pending';

                            return (
                              <tr key={top._id}>
                                <td style={{ fontWeight: 500 }}>{top.name}</td>
                                <td>
                                  <span className={`badge ${statusClass}`}>{top.status}</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <select
                                    className="form-select"
                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                    value={top.status}
                                    onChange={(e) =>
                                      handleTopicStatusChange(mod._id, top._id, e.target.value)
                                    }
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleDeleteTopic(mod._id, top._id)}
                                    className="btn-icon"
                                    title="Delete topic"
                                    style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No topics added yet in this module. Click "+ Add Topic" above.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-title">No modules in this subject</div>
                <button onClick={() => setIsModuleModalOpen(true)} className="btn btn-primary btn-sm">
                  + Add First Module
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Add Module Modal */}
      {isModuleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Module to {selectedSubject?.name}</h3>
              <button className="modal-close-btn" onClick={() => setIsModuleModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddModule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Module Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Module 5: Advanced Concurrency Control"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isTopicModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Topic</h3>
              <button className="modal-close-btn" onClick={() => setIsTopicModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTopic}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Topic Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Multiversion Concurrency Control (MVCC)"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoreSubjects;
