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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
 * Verify authentication on mount
   * Checks if stored token is still valid
   */
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      // No token stored - user is not logged in
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      try {
        // Verify token with backend
        const { data } = await API.get('/api/auth/verify', { withCredentials: true });
        setUser(data);
      } catch (error) {
        // Token is invalid or expired - clear it
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
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
    sessionStorage.clear();
    setUser(null);
    
    // Best-effort: tell backend to clear cookie (ignore errors)
    API.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => { });
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/api/auth/verify', { withCredentials: true });
      setUser(data);
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
    isAdmin: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
