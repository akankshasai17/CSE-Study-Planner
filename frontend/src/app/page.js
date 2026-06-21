'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Calendar,
  Code,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data.');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleTaskCompletion = async (taskId, currentCompleted, taskTitle) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          completed: !currentCompleted
        })
      });
      if (res.ok) {
        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-secondary rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-secondary rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-60 bg-secondary rounded-2xl lg:col-span-2"></div>
          <div className="h-60 bg-secondary rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 text-danger rounded-2xl">
        <h2 className="font-bold text-lg">Error loading dashboard</h2>
        <p className="text-sm mt-1">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-1.5 bg-danger text-white rounded-lg text-xs font-semibold hover:bg-opacity-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-8 select-none">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-purple-900 p-6 md:p-8 text-primary-foreground shadow-lg shadow-primary/10">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/15 rounded-full text-xs font-semibold w-max mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Workspace Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {data.student_name}!
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1.5">
              Today is {todayStr}. Ready to hit your milestones?
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-xs text-primary-foreground/70 uppercase font-semibold">Study Streak</span>
              <span className="text-2xl font-black flex items-center gap-1.5 text-amber-300">
                <Flame className="h-6 w-6 fill-amber-300 animate-pulse" />
                {data.streak} {data.streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Progress */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover-scale shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion</span>
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{data.progress_percentage}%</span>
              <span className="text-xs text-muted-foreground">of tasks</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${data.progress_percentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Today's Tasks Count */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover-scale shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Tasks</span>
            <span className="p-1.5 bg-accent text-accent-foreground rounded-lg">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{data.todays_tasks.length}</span>
            <p className="text-xs text-muted-foreground mt-1">due for today</p>
          </div>
        </div>

        {/* Pending Tasks Count */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover-scale shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Tasks</span>
            <span className="p-1.5 bg-warning/10 text-warning rounded-lg">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{data.pending_tasks_count}</span>
            <p className="text-xs text-muted-foreground mt-1">remaining in log</p>
          </div>
        </div>

        {/* DSA Problems solved */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover-scale shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">DSA Solved</span>
            <span className="p-1.5 bg-success/10 text-success rounded-lg">
              <Code className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{data.total_dsa_solved}</span>
            <p className="text-xs text-muted-foreground mt-1">questions recorded</p>
          </div>
        </div>

      </div>

      {/* Attendance warnings banner */}
      {data.attendance_warnings.length > 0 && (
        <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2 bg-rose-500/20 text-rose-500 rounded-xl">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">Attendance Warning (&lt;75%)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You are running low on attendance for the following subjects. Plan to attend the next classes!
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {data.attendance_warnings.map((s) => (
                <Link
                  key={s.id}
                  href="/subjects"
                  className="flex items-center gap-2 px-3 py-1 bg-card border border-border/80 hover:border-danger rounded-xl transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span className="text-xs font-semibold">{s.code}</span>
                  <span className="text-xs font-black text-rose-500">{s.attendance_pct}%</span>
                  <span className="text-[10px] text-muted-foreground">({s.attended}/{s.total} classes)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Tasks */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-base">Today's Agenda</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks scheduled for today</p>
            </div>
            <Link href="/tasks" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <span>View All Tasks</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {data.todays_tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-muted/60 mb-2" />
                <p className="text-sm font-semibold">All clean for today!</p>
                <p className="text-xs text-muted-foreground mt-0.5">No tasks are due today. Take a break or add a task.</p>
              </div>
            ) : (
              data.todays_tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-secondary/40 border-border/50 opacity-70' 
                      : 'bg-card border-border hover:border-primary/45 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => toggleTaskCompletion(task.id, task.completed, task.title)}
                      className="focus:outline-none shrink-0"
                    >
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                        task.completed 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground/40 hover:border-primary bg-background'
                      }`}>
                        {task.completed && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.subject_code && (
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${task.subject_color}15`, color: task.subject_color }}
                          >
                            {task.subject_code}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'High' ? 'bg-danger/10 text-danger' : 
                          task.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base mb-1">Quick Actions</h2>
            <p className="text-xs text-muted-foreground mb-6">Instantly navigate to log updates</p>
            
            <div className="space-y-3">
              <Link 
                href="/tasks" 
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/45 hover:bg-secondary/40 transition-all text-sm font-semibold"
              >
                <span className="p-2 bg-primary/10 text-primary rounded-lg"><Plus className="h-4 w-4" /></span>
                <div className="flex-1">
                  <p className="leading-tight">Create New Task</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Set priorities and deadlines</p>
                </div>
              </Link>

              <Link 
                href="/dsa" 
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/45 hover:bg-secondary/40 transition-all text-sm font-semibold"
              >
                <span className="p-2 bg-success/10 text-success rounded-lg"><Code className="h-4 w-4" /></span>
                <div className="flex-1">
                  <p className="leading-tight">Log DSA Question</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Track your coding solves</p>
                </div>
              </Link>

              <Link 
                href="/subjects" 
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/45 hover:bg-secondary/40 transition-all text-sm font-semibold"
              >
                <span className="p-2 bg-warning/10 text-warning rounded-lg"><BookOpen className="h-4 w-4" /></span>
                <div className="flex-1">
                  <p className="leading-tight">Add CSE Subject</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Organize study tracking</p>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-border">
            <Link 
              href="/analytics" 
              className="w-full py-2.5 px-4 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Analytics Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
