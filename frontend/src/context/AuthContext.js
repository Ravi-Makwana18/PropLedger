/**
 * ============================================
 * PropLedger - Authentication Context
 * ============================================
 * Provides global authentication state and methods
 * Manages user login, registration, logout, and token verification
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

/**
 * Custom hook to access authentication context
 * Must be used within AuthProvider
 * 
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps the application to provide authentication state globally
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // Initialise user state immediately from localStorage — no round-trip required.
  // We store minimal user info in localStorage on login so pages can render at once.
  // The background verify call will correct stale info or clear an expired token.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pl_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // loading is always false — PrivateRoute no longer blocks rendering
  const loading = false;

  /**
   * Warm up the backend server as early as possible.
   * Render's free tier spins down after inactivity — this fires immediately
   * when the app loads so the server is hot before the user submits the form.
   */
  useEffect(() => {
    API.get('/api/health').catch(() => { /* ignore — best effort warm-up */ });
  }, []);

  /**
   * Background token verification.
   * Runs silently — does NOT block page rendering.
   * Clears state only if the token is actually invalid/expired.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      // No token → make sure we're logged out
      setUser(null);
      localStorage.removeItem('pl_user');
      return;
    }
    // Verify in background — pages are already rendering
    API.get('/api/auth/verify', { withCredentials: true })
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('pl_user', JSON.stringify(data));
      })
      .catch(() => {
        // Token expired / invalid — force logout
        localStorage.removeItem('token');
        localStorage.removeItem('pl_user');
        setUser(null);
      });
  }, []);

  /**
   * Login user with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} Success status
   * @throws {string} Error message if login fails
   */
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/api/auth/login', { email, password }, { withCredentials: true });
      
      // Save token to localStorage (required for iOS Safari)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // Persist user data so next load is instant (optimistic auth)
      localStorage.setItem('pl_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  /**
   * Register new user
   * 
   * @param {Object} formData - Registration form data
   * @returns {Promise<Object>} Success status
   * @throws {string} Error message if registration fails
   */
  const register = async (formData) => {
    try {
      const { data } = await API.post('/api/auth/register', formData, { withCredentials: true });
      
      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // Persist user data so next load is instant
      localStorage.setItem('pl_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  /**
   * Logout user
   * Clears local state and notifies backend
   */
  const logout = () => {
    // Always clear local state immediately
    localStorage.removeItem('token');
    localStorage.removeItem('pl_user');
    sessionStorage.clear();
    setUser(null);
    
    // Best-effort: tell backend to clear cookie (ignore errors)
    API.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => { });
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/api/auth/verify', { withCredentials: true });
      setUser(data);
      localStorage.setItem('pl_user', JSON.stringify(data));
    } catch {
      // silently fail
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin' || user?.role === 'manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
