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
const shouldUseTokenFallback = process.env.REACT_APP_ENABLE_TOKEN_FALLBACK === 'true';
let verifySessionPromise = null;

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('pl_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('pl_user');
};

const persistSession = (data) => {
  if (shouldUseTokenFallback && data.token) {
    localStorage.setItem('token', data.token);
  } else {
    localStorage.removeItem('token');
  }

  localStorage.setItem('pl_user', JSON.stringify(data));
};

const verifySession = async () => {
  if (!verifySessionPromise) {
    verifySessionPromise = API.get('/api/auth/verify', { withCredentials: true })
      .then(({ data }) => data)
      .finally(() => {
        verifySessionPromise = null;
      });
  }

  return verifySessionPromise;
};

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
  const storedUser = typeof window !== 'undefined' ? getStoredUser() : null;
  const hasStoredToken = typeof window !== 'undefined' && shouldUseTokenFallback && Boolean(localStorage.getItem('token'));
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(() => !storedUser && (shouldUseTokenFallback ? hasStoredToken : true));

  /**
   * Background token verification.
   * Runs silently — does NOT block page rendering.
   * Clears state only if the token is actually invalid/expired.
   */
  useEffect(() => {
    const storedToken = shouldUseTokenFallback ? localStorage.getItem('token') : null;
    const shouldVerifySession = !shouldUseTokenFallback || Boolean(storedToken);
    const cachedUser = getStoredUser();

    if (!shouldVerifySession) {
      setUser(null);
      clearStoredAuth();
      setLoading(false);
      return;
    }

    if (cachedUser) {
      // Render immediately from cached user and refresh in the background.
      setLoading(false);
    }

    verifySession()
      .then((data) => {
        setUser(data);
        persistSession(data);
      })
      .catch(() => {
        clearStoredAuth();
        setUser(null);
      })
      .finally(() => {
        if (!cachedUser) {
          setLoading(false);
        }
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

      persistSession(data);
      setUser(data);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
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

      persistSession(data);
      setUser(data);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  /**
   * Logout user
   * Clears local state and notifies backend
   */
  const logout = () => {
    // Always clear local state immediately
    clearStoredAuth();
    sessionStorage.clear();
    setUser(null);
    setLoading(false);
    
    // Best-effort: tell backend to clear cookie (ignore errors)
    API.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => { });
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/api/auth/verify', { withCredentials: true });
      setUser(data);
      persistSession(data);
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
