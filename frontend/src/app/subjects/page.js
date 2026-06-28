'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  AlertCircle,
  BookOpen,
  CalendarCheck,
  UserCheck,
  UserX,
  CheckCircle2,
  Circle
} from 'lucide-react';

const colors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6B7280', // Gray
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3B82F6',
  });

  const fetchSubjectsAndTasks = async () => {
    try {
      const [resSub, resTasks] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/tasks')
      ]);

      if (!resSub.ok || !resTasks.ok) {
        throw new Error('Failed to load syllabus data.');
      }

      const subData = await resSub.json();
      const tasksData = await resTasks.json();

      setSubjects(subData);
      setTasks(tasksData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectsAndTasks();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      color: colors[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      color: subject.color,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects';
    const method = editingSubject ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save subject.');
      }

      setIsModalOpen(false);
      fetchSubjectsAndTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSubject = async (subjectId) => {
    if (!confirm('Warning: Deleting this subject will delete/uncategorize all its tasks and notes. Continue?')) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSubjectsAndTasks();
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const quickLogAttendance = async (subject, type) => {
    let attended = subject.attended_classes;
    let total = subject.total_classes;

    if (type === 'present') {
      attended += 1;
      total += 1;
    } else if (type === 'absent') {
      total += 1;
    }

    try {
      const res = await fetch(`/api/subjects/${subject.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attended_classes: attended,
          total_classes: total
        })
      });
      if (res.ok) {
        fetchSubjectsAndTasks();
      }
    } catch (err) {
      console.error('Error logging attendance:', err);
    }
  };

  const manualSetAttendance = async (subject) => {
    const rawAtt = prompt('Enter attended classes:', subject.attended_classes);
    if (rawAtt === null) return;
    const rawTot = prompt('Enter total classes:', subject.total_classes);
    if (rawTot === null) return;

    const attended = parseInt(rawAtt);
    const total = parseInt(rawTot);

    if (isNaN(attended) || isNaN(total) || attended < 0 || total < 0 || attended > total) {
      alert('Invalid input. Attended classes cannot exceed total classes, and values must be positive integers.');
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${subject.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attended_classes: attended,
          total_classes: total
        })
      });
      if (res.ok) {
        fetchSubjectsAndTasks();
      }
    } catch (err) {
      console.error('Error logging attendance:', err);
    }
  };

  // Toggle syllabus checklist tasks directly from the subject card
  const toggleTaskCompletion = async (task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          subject_id: task.subject_id,
          priority: task.priority,
          due_date: task.due_date,
          completed: !task.completed
        })
      });
      if (res.ok) {
        fetchSubjectsAndTasks();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-60 bg-secondary rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">CSE Subjects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your semester modules and track lecture attendance levels</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-opacity-95 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      {subjects.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 px-4 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto text-muted/50 mb-3" />
          <p className="text-sm font-semibold">No subjects added yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add subjects like DSA, DBMS, or OS to manage notes and attendance warnings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const lowAttendance = subject.attendance_pct < 75.0;
            const subjectTasks = tasks.filter(t => t.subject_id === subject.id);
            const completedCount = subjectTasks.filter(t => t.completed).length;

            return (
              <div 
                key={subject.id}
                className="bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden relative"
              >
                {/* Visual Color bar */}
                <div className="h-2 w-full" style={{ backgroundColor: subject.color }}></div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header: Code & Name */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                        >
                          {subject.code}
                        </span>
                        <h3 className="font-bold text-base mt-2 leading-tight">{subject.name}</h3>
                      </div>
                      
                      {/* Dropdown controls */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="p-1 rounded text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSubject(subject.id)}
                          className="p-1 rounded text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Attendance Gauges */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-muted-foreground">Class Attendance</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-black ${lowAttendance ? 'text-danger' : 'text-foreground'}`}>
                            {subject.attendance_pct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${lowAttendance ? 'bg-danger' : 'bg-success'}`}
                          style={{ width: `${subject.attendance_pct}%` }}
                        ></div>
                      </div>

                      {/* Fractional numbers & warnings */}
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                        <span>Classes: {subject.attended_classes} / {subject.total_classes}</span>
                        {lowAttendance && (
                          <span className="flex items-center gap-1 text-danger font-bold bg-danger/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Below 75%</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Syllabus Checklist Section */}
                    {subjectTasks.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/60">
                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                          <span>Syllabus Topics</span>
                          <span className="text-[10px] font-black bg-secondary px-1.5 py-0.5 rounded">
                            {completedCount}/{subjectTasks.length}
                          </span>
                        </div>
                        
                        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                          {subjectTasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => toggleTaskCompletion(task)}
                              className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-secondary/40 rounded-lg transition-all text-[11px] leading-tight select-none cursor-pointer"
                            >
                              <span className="shrink-0 mt-0.5">
                                {task.completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success fill-success/10" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground/45" />
                                )}
                              </span>
                              <span className={`truncate flex-1 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                                {task.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Attendance Log Quick Buttons */}
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <button 
                      onClick={() => quickLogAttendance(subject, 'present')}
                      className="flex-1 py-1.5 bg-success/10 hover:bg-success text-success hover:text-success-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Present</span>
                    </button>
                    <button 
                      onClick={() => quickLogAttendance(subject, 'absent')}
                      className="flex-1 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-danger-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Absent</span>
                    </button>
                    <button
                      onClick={() => manualSetAttendance(subject)}
                      className="py-1.5 px-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      title="Set Class Count Manually"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="E.g., CS-301 (or DSA)"
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="E.g., Data Structures and Algorithms"
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Subject Accent Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-all cursor-pointer relative hover:scale-105"
                        style={{ backgroundColor: c }}
                      >
                        {formData.color === c && (
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border text-muted-foreground hover:bg-secondary text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white hover:bg-opacity-95 text-xs font-bold rounded-lg"
                  >
                    {editingSubject ? 'Save Changes' : 'Create Subject'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
