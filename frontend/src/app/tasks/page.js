'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Filter, 
  SlidersHorizontal,
  FolderMinus,
  Check,
  X
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals and Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    priority: 'Medium',
    due_date: '',
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('All'); // All, Completed, Pending
  const [priorityFilter, setPriorityFilter] = useState('All'); // All, Low, Medium, High
  const [subjectFilter, setSubjectFilter] = useState('All'); // All, <subject_id>

  const fetchData = async () => {
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/subjects')
      ]);
      
      if (!tasksRes.ok || !subjectsRes.ok) {
        throw new Error('Failed to load data.');
      }
      
      const tasksData = await tasksRes.json();
      const subjectsData = await subjectsRes.json();
      
      setTasks(tasksData);
      setSubjects(subjectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value === '' ? '' : e.target.value,
    });
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      subject_id: '',
      priority: 'Medium',
      due_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      subject_id: task.subject_id || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = {
      title: formData.title,
      subject_id: formData.subject_id === '' ? null : parseInt(formData.subject_id),
      priority: formData.priority,
      due_date: formData.due_date || null
    };

    try {
      let res;
      if (editingTask) {
        // Update task
        res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, completed: editingTask.completed })
        });
      } else {
        // Create task
        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save task.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

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
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    // Status
    if (statusFilter === 'Completed' && !task.completed) return false;
    if (statusFilter === 'Pending' && task.completed) return false;

    // Priority
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;

    // Subject
    if (subjectFilter !== 'All') {
      if (subjectFilter === 'Uncategorized' && task.subject_id !== null) return false;
      if (subjectFilter !== 'Uncategorized' && task.subject_id !== parseInt(subjectFilter)) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="h-14 bg-secondary rounded-xl"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl"></div>
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
          <h1 className="text-2xl font-black tracking-tight">Task Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Organize, prioritize, and track your syllabus tasks</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-opacity-95 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary border border-border/80 px-2 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Priority</span>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-secondary border border-border/80 px-2 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Subject</span>
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-secondary border border-border/80 px-2 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary max-w-[150px]"
          >
            <option value="All">All Subjects</option>
            <option value="Uncategorized">Uncategorized</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-16 px-4 text-center text-muted-foreground">
            <FolderMinus className="h-10 w-10 mx-auto text-muted/50 mb-3" />
            <p className="text-sm font-semibold">No tasks found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try clearing filters or add a new task to get started.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                task.completed 
                  ? 'bg-secondary/40 border-border/50 opacity-70' 
                  : 'bg-card border-border hover:border-primary/45 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Complete checkbox */}
                <button 
                  onClick={() => toggleTaskCompletion(task)}
                  className="focus:outline-none shrink-0"
                >
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                    task.completed 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/45 hover:border-primary bg-background'
                  }`}>
                    {task.completed && <Check className="h-4 w-4" />}
                  </div>
                </button>

                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-muted-foreground font-normal' : ''}`}>
                    {task.title}
                  </p>
                  
                  {/* Info badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.subject_id ? (
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${task.subject_color}15`, color: task.subject_color }}
                      >
                        {task.subject_name} ({task.subject_code})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        Uncategorized
                      </span>
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'High' ? 'bg-danger/10 text-danger' : 
                      task.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {task.priority} Priority
                    </span>

                    {task.due_date && (
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {task.due_date}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 pl-4">
                <button
                  onClick={() => openEditModal(task)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  title="Edit Task"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
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
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="E.g., Revise DBMS Normalization"
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="">Uncategorized / No Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          formData.priority === p 
                            ? p === 'High' ? 'bg-danger border-danger text-white' :
                              p === 'Medium' ? 'bg-warning border-warning text-warning-foreground' : 'bg-primary border-primary text-white'
                            : 'bg-secondary border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
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
                    {editingTask ? 'Save Changes' : 'Create Task'}
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
