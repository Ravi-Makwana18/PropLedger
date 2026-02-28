import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, verify token with backend only if we have a token stored
    const verifyAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        // No token at all — user is not logged in, skip the API call
        setLoading(false);
        return;
      }
      try {
        const { data } = await API.get('/api/auth/verify', { withCredentials: true });
        setUser(data);
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (mobileNumber, password) => {
    try {
      const { data } = await API.post('/api/auth/login', { mobileNumber, password }, { withCredentials: true });
      // Save token to localStorage — required for iOS Safari (cross-site cookie ITP blocking)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (mobileNumber, password, name) => {
    try {
      const { data } = await API.post('/api/auth/register', { mobileNumber, password, name }, { withCredentials: true });
      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    // Always clear local state immediately — never depend on backend success
    localStorage.removeItem('token');
    sessionStorage.clear();
    setUser(null);
    // Best-effort: tell the backend to clear the cookie (ignore errors)
    API.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => { });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};