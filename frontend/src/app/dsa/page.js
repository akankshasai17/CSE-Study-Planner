'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Code2, 
  Award, 
  Calendar,
  AlertCircle,
  Hash,
  Database,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Trash,
  CheckCircle,
  CircleCheck,
  Circle
} from 'lucide-react';

const RECOMMENDED_QUESTIONS = {
  Easy: [
    { title: "Two Sum", platform: "LeetCode" },
    { title: "Valid Parentheses", platform: "LeetCode" },
    { title: "Merge Two Sorted Lists", platform: "LeetCode" },
    { title: "Best Time to Buy and Sell Stock", platform: "LeetCode" },
    { title: "Reverse Linked List", platform: "LeetCode" },
  ],
  Medium: [
    { title: "3Sum", platform: "LeetCode" },
    { title: "Container With Most Water", platform: "LeetCode" },
    { title: "Longest Substring Without Repeating Characters", platform: "LeetCode" },
    { title: "Group Anagrams", platform: "LeetCode" },
    { title: "Binary Tree Level Order Traversal", platform: "LeetCode" },
    { title: "Number of Islands", platform: "LeetCode" },
  ],
  Hard: [
    { title: "Median of Two Sorted Arrays", platform: "LeetCode" },
    { title: "Merge k Sorted Lists", platform: "LeetCode" },
    { title: "Trapping Rain Water", platform: "LeetCode" },
    { title: "Edit Distance", platform: "LeetCode" },
    { title: "N-Queens", platform: "LeetCode" },
  ]
};

export default function DSATracker() {
  const [dsaData, setDsaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'Medium',
    solved_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDsaData = async () => {
    try {
      const res = await fetch('/api/dsa');
      if (!res.ok) throw new Error('Failed to load DSA problems.');
      const data = await res.json();
      setDsaData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDsaData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/dsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record problem.');
      }

      // Reset form
      setFormData({
        title: '',
        platform: 'LeetCode',
        difficulty: 'Medium',
        solved_date: new Date().toISOString().split('T')[0],
      });
      
      fetchDsaData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const logRecommendedSolve = async (title, difficulty, platform) => {
    setError('');
    const payload = {
      title,
      platform,
      difficulty,
      solved_date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/dsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to log problem.');
      }
      
      fetchDsaData();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteProblem = async (problemId) => {
    if (!confirm('Remove this problem from your solved log?')) return;
    try {
      const res = await fetch(`/api/dsa/${problemId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDsaData();
      }
    } catch (err) {
      console.error('Error deleting DSA problem:', err);
    }
  };

  // Helper to check if a recommended question is solved
  const isQuestionSolved = (title) => {
    if (!dsaData || !dsaData.problems) return false;
    return dsaData.problems.some(
      (p) => p.title.trim().toLowerCase() === title.trim().toLowerCase()
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-secondary rounded-2xl"></div>
          <div className="h-96 bg-secondary rounded-2xl lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  const platforms = Object.entries(dsaData.by_platform).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">DSA Tracker</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Track your coding problems solved across different platforms</p>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Solved */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-success/10 text-success rounded-2xl">
            <Code2 className="h-8 w-8" />
          </div>
          <div>
            <span className="text-3xl font-black">{dsaData.total_solved}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Total solved questions</p>
          </div>
        </div>

        {/* Difficulty breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-emerald-500/10 dark:bg-emerald-500/20 py-2 rounded-xl border border-emerald-500/15">
              <p className="text-xs font-bold text-success">Easy</p>
              <p className="text-sm font-black text-success mt-1">{dsaData.by_difficulty.Easy}</p>
            </div>
            <div className="text-center bg-amber-500/10 dark:bg-amber-500/20 py-2 rounded-xl border border-amber-500/15">
              <p className="text-xs font-bold text-warning">Medium</p>
              <p className="text-sm font-black text-warning mt-1">{dsaData.by_difficulty.Medium}</p>
            </div>
            <div className="text-center bg-rose-500/10 dark:bg-rose-500/20 py-2 rounded-xl border border-rose-500/15">
              <p className="text-xs font-bold text-danger">Hard</p>
              <p className="text-sm font-black text-danger mt-1">{dsaData.by_difficulty.Hard}</p>
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-y-auto max-h-[110px]">
          <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">Platforms</h3>
          {platforms.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">No solves recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {platforms.map(([platform, count]) => (
                <span key={platform} className="text-[10px] font-bold px-2 py-0.5 bg-secondary border border-border/80 rounded-md">
                  {platform}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommended Questions Roadmap (Easy, Medium, Hard Categorized List) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[750px]">
          <div className="mb-4">
            <h2 className="font-bold text-base">Coding Roadmap Questions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-populated target questions to solve and check off</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* Easy Category */}
            <div>
              <h3 className="text-xs font-extrabold text-success uppercase tracking-wider mb-3 px-1">Easy Questions</h3>
              <div className="space-y-2">
                {RECOMMENDED_QUESTIONS.Easy.map((q) => {
                  const solved = isQuestionSolved(q.title);
                  return (
                    <div 
                      key={q.title}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        solved 
                          ? 'bg-emerald-500/5 border-emerald-500/25 opacity-75' 
                          : 'bg-secondary/20 border-border hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {solved ? (
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${solved ? 'line-through text-muted-foreground font-normal' : ''}`}>
                            {q.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground/80 font-bold">{q.platform}</span>
                        </div>
                      </div>
                      {!solved && (
                        <button
                          onClick={() => logRecommendedSolve(q.title, 'Easy', q.platform)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Mark Solved
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medium Category */}
            <div>
              <h3 className="text-xs font-extrabold text-warning uppercase tracking-wider mb-3 px-1">Medium Questions</h3>
              <div className="space-y-2">
                {RECOMMENDED_QUESTIONS.Medium.map((q) => {
                  const solved = isQuestionSolved(q.title);
                  return (
                    <div 
                      key={q.title}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        solved 
                          ? 'bg-amber-500/5 border-amber-500/25 opacity-75' 
                          : 'bg-secondary/20 border-border hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {solved ? (
                          <CheckCircle2 className="h-5 w-5 text-warning shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${solved ? 'line-through text-muted-foreground font-normal' : ''}`}>
                            {q.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground/80 font-bold">{q.platform}</span>
                        </div>
                      </div>
                      {!solved && (
                        <button
                          onClick={() => logRecommendedSolve(q.title, 'Medium', q.platform)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Mark Solved
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hard Category */}
            <div>
              <h3 className="text-xs font-extrabold text-danger uppercase tracking-wider mb-3 px-1">Hard Questions</h3>
              <div className="space-y-2">
                {RECOMMENDED_QUESTIONS.Hard.map((q) => {
                  const solved = isQuestionSolved(q.title);
                  return (
                    <div 
                      key={q.title}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        solved 
                          ? 'bg-rose-500/5 border-rose-500/25 opacity-75' 
                          : 'bg-secondary/20 border-border hover:border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {solved ? (
                          <CheckCircle2 className="h-5 w-5 text-danger shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${solved ? 'line-through text-muted-foreground font-normal' : ''}`}>
                            {q.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground/80 font-bold">{q.platform}</span>
                        </div>
                      </div>
                      {!solved && (
                        <button
                          onClick={() => logRecommendedSolve(q.title, 'Hard', q.platform)}
                          className="px-2.5 py-1 bg-danger hover:bg-danger/90 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Mark Solved
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Pane: Custom Solve Log Form & Solves History */}
        <div className="space-y-6 flex flex-col h-[750px]">
          
          {/* Custom Log Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm shrink-0">
            <h2 className="font-bold text-sm mb-4">Log Custom Question</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Question Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="E.g., Two Sum, Reverse Linked List"
                  className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Platform
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="CodeChef">CodeChef</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Solved Date
                </label>
                <input
                  type="date"
                  name="solved_date"
                  value={formData.solved_date}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {submitting ? 'Saving...' : 'Record Problem'}
              </button>
            </form>
          </div>

          {/* Solves History */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h2 className="font-bold text-sm">Solved Problems Log</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">History of questions completed</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              {dsaData.problems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-muted/60 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold">No problems logged yet</p>
                </div>
              ) : (
                dsaData.problems.map((problem) => {
                  const diffColor = 
                    problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-success border-emerald-500/20' : 
                    problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-warning border-amber-500/20' : 
                    'bg-rose-500/10 text-danger border-rose-500/20';

                  return (
                    <div 
                      key={problem.id}
                      className="flex justify-between items-center p-3 bg-secondary/35 border border-border/80 rounded-xl hover:border-primary/30 transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                            {problem.title}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${diffColor}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                          <span className="font-bold text-primary/80">{problem.platform}</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {problem.solved_date}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteProblem(problem.id)}
                        className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
                        title="Delete Solve"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
