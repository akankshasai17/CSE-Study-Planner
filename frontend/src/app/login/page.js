'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, User, AlertCircle, ArrowRight, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegister ? '/api/register' : '/api/login';
    const payload = isRegister 
      ? formData 
      : { username: formData.username, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Success - user is stored in session cookie, redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0c101d] overflow-hidden select-none">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/25 blur-[120px] pointer-events-none"></div>

      {/* Main card */}
      <div className="relative w-full max-w-md mx-4 z-10">
        
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4 border border-primary/20 shadow-lg shadow-primary/10">
            <GraduationCap className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CSE Study Planner
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {isRegister ? 'Create an account to structure your semesters' : 'Log in to manage your CSE studies'}
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="E.g., Akanksha Sai"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="E.g., akanksha99"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up' : 'Log In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account yet?"} </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-primary hover:underline font-semibold"
            >
              {isRegister ? 'Log In' : 'Sign Up'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
