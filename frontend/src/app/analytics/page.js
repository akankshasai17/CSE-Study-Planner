'use client';

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  BarChart2, 
  TrendingUp, 
  Code, 
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [dsaData, setDsaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsRes, dsaRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/dsa')
      ]);

      if (!analyticsRes.ok || !dsaRes.ok) {
        throw new Error('Failed to load analytics.');
      }

      const analyticsData = await analyticsRes.json();
      const dsaData = await dsaRes.json();

      setAnalytics(analyticsData);
      setDsaData(dsaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check dark mode state
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();

    // Listen to theme adjustments
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-secondary rounded-2xl"></div>
          <div className="h-80 bg-secondary rounded-2xl"></div>
          <div className="h-80 bg-secondary rounded-2xl"></div>
          <div className="h-80 bg-secondary rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Chart Global Style settings
  const textColor = isDark ? '#9CA3AF' : '#4B5563';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  // 1. Weekly Activity Line Graph: Tasks Completed vs DSA Solved
  const weeklyData = {
    labels: analytics.weekly_study_activity.labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: analytics.weekly_study_activity.completed_tasks,
        borderColor: '#6366F1', // Indigo
        backgroundColor: '#6366F120',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#6366F1',
      },
      {
        label: 'DSA Solved',
        data: analytics.weekly_study_activity.dsa_solved,
        borderColor: '#10B981', // Green
        backgroundColor: '#10B98120',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#10B981',
      }
    ]
  };

  const weeklyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, font: { weight: 'bold', size: 11 } }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, stepSize: 1, font: { size: 10 } }
      }
    }
  };

  // 2. Subject task completions: Stacked or Double Bar Chart
  const subjectsData = {
    labels: analytics.subject_task_stats.map(s => s.code),
    datasets: [
      {
        label: 'Completed Tasks',
        data: analytics.subject_task_stats.map(s => s.completed),
        backgroundColor: analytics.subject_task_stats.map(s => s.color || '#3B82F6'),
        borderRadius: 4,
      },
      {
        label: 'Total Tasks',
        data: analytics.subject_task_stats.map(s => s.total),
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        borderRadius: 4,
      }
    ]
  };

  const subjectsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, font: { weight: 'bold', size: 11 } }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } }
      }
    }
  };

  // 3. DSA Difficulty Doughnut
  const diffData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          dsaData.by_difficulty.Easy,
          dsaData.by_difficulty.Medium,
          dsaData.by_difficulty.Hard
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#171717' : '#ffffff',
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: textColor, font: { weight: 'bold', size: 11 } }
      }
    }
  };

  // 4. DSA Platforms Doughnut
  const platformsLabels = Object.keys(dsaData.by_platform);
  const platformsValues = Object.values(dsaData.by_platform);
  const platformColors = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#EF4444', '#6B7280'];

  const platformData = {
    labels: platformsLabels.length > 0 ? platformsLabels : ['No data'],
    datasets: [
      {
        data: platformsValues.length > 0 ? platformsValues : [0],
        backgroundColor: platformColors.slice(0, platformsLabels.length > 0 ? platformsLabels.length : 1),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#171717' : '#ffffff',
      }
    ]
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Analytics Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Visualize your productivity, DSA metrics, and syllabus progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Activity Line Graph */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-80 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span>Weekly Study Activity</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily task completions vs DSA solves over the last 7 days</p>
          </div>
          <div className="flex-1 min-h-0 relative mt-2">
            <Line data={weeklyData} options={weeklyOptions} />
          </div>
        </div>

        {/* Subject wise Task completions */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-80 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-primary" />
              <span>Subject Progress Statistics</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed tasks vs total tasks per CSE subject</p>
          </div>
          <div className="flex-1 min-h-0 relative mt-2">
            <Bar data={subjectsData} options={subjectsOptions} />
          </div>
        </div>

        {/* DSA Difficulty Doughnut */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-80 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Code className="h-4 w-4 text-success" />
              <span>DSA Solves by Difficulty</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Complexity breakdown of logged DSA questions</p>
          </div>
          <div className="flex-1 min-h-0 relative mt-2 flex items-center justify-center">
            {dsaData.total_solved === 0 ? (
              <p className="text-xs text-muted-foreground py-10">No DSA data recorded yet.</p>
            ) : (
              <Doughnut data={diffData} options={doughnutOptions} />
            )}
          </div>
        </div>

        {/* DSA Platforms breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-80 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-warning" />
              <span>DSA Solves by Platform</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Solves breakdown across coding sites</p>
          </div>
          <div className="flex-1 min-h-0 relative mt-2 flex items-center justify-center">
            {platformsLabels.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10">No platforms logged yet.</p>
            ) : (
              <Doughnut data={platformData} options={doughnutOptions} />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
