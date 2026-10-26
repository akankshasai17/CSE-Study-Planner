import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { User } from '@/types';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cse_study_planner_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTheme } = useTheme();

  const applyUserTheme = useCallback(
    (u: User | null) => {
      if (u?.profile?.theme_preference === 'dark' || u?.profile?.theme_preference === 'light') {
        setTheme(u.profile.theme_preference);
      }
    },
    [setTheme]
  );

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('cse_study_planner_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<User>('/api/auth/me');
      setUser(res.data);
      setToken(storedToken);
      applyUserTheme(res.data);
    } catch {
      localStorage.removeItem('cse_study_planner_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyUserTheme]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('cse_study_planner_token', newToken);
    setToken(newToken);
    setUser(newUser);
    applyUserTheme(newUser);
  };

  const logout = () => {
    localStorage.removeItem('cse_study_planner_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
