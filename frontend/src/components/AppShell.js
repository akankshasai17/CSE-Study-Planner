'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Flame, 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Code, 
  Award, 
  FileText, 
  BarChart2, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Subjects & Attendance', href: '/subjects', icon: BookOpen },
  { name: 'DSA Tracker', href: '/dsa', icon: Code },
  { name: 'CGPA Calculator', href: '/cgpa', icon: Award },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 2. Auth management
  useEffect(() => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.status === 401) {
          router.push('/login');
        } else {
          const data = await res.json();
          setUser(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // If loading and not on login page, show a premium skeleton/spinner
  if (loading && pathname !== '/login') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="text-center">
          <div className="relative inline-flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full rounded-full border-4 border-muted border-t-primary animate-spin"></div>
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
            Configuring your workspace...
          </p>
        </div>
      </div>
    );
  }

  // If on login page, render children directly without dashboard chrome
  if (pathname === '/login') {
    return <div className="h-full bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 fixed h-full select-none">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-purple-400 bg-clip-text text-transparent">
            CSE Study Planner
          </span>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">@{user.username}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-lg shrink-0">
              <Flame className="h-4 w-4 fill-amber-500 animate-bounce" />
              <span className="text-xs font-bold">{user.streak}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-8 flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="border-t border-border pt-4 mt-auto space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="h-5 w-9 rounded-full bg-muted p-0.5 transition-colors relative flex items-center">
              <div className={`h-4 w-4 rounded-full bg-card shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border fixed top-0 w-full z-40 select-none">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-bold text-base bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            CSE Planner
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold mr-2">
              <Flame className="h-3.5 w-3.5 fill-amber-500" />
              <span>{user.streak}</span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-64 bg-card h-full p-6 flex flex-col border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-bold text-base bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                  CSE Planner
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {user && (
              <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-none">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">@{user.username}</p>
                </div>
              </div>
            )}

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border pt-4 mt-auto space-y-1">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pt-[53px] md:pt-0 min-w-0 flex flex-col">
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
