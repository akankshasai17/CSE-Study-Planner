import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cse_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount using HttpOnly cookie or token
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await authService.getMe();
        if (res.data.success && isMounted) {
          setUser(res.data.user);
          localStorage.setItem('cse_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Not authenticated
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('cse_token');
          localStorage.removeItem('cse_user');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('cse_token');
      localStorage.removeItem('cse_user');
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data.success) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('cse_token', jwtToken);
        localStorage.setItem('cse_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      const serverMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        (err.response?.status === 503
          ? 'Database connecting or unavailable. Please ensure MongoDB Atlas or local MongoDB is reachable.'
          : err.message || 'Error signing in');
      return {
        success: false,
        message: serverMessage,
      };
    }
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    try {
      const res = await authService.register({ name, email, password, confirmPassword });
      if (res.data.success) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('cse_token', jwtToken);
        localStorage.setItem('cse_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      const serverMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        (err.response?.status === 503
          ? 'Database connecting or unavailable. Please ensure MongoDB Atlas or local MongoDB is reachable.'
          : err.message || 'Error creating account');
      return {
        success: false,
        message: serverMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('cse_token');
      localStorage.removeItem('cse_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('cse_user', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
