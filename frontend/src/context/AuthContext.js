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
    // On mount, verify token with backend
    const verifyAuth = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/api/auth/verify', { withCredentials: true });
        setUser(data);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (mobileNumber, password) => {
    try {
      const { data } = await API.post('/api/auth/login', { mobileNumber, password }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (mobileNumber, password, name) => {
    try {
      const { data } = await API.post('/api/auth/register', { mobileNumber, password, name }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    // Clear cookie on backend
    API.post('/api/auth/logout', {}, { withCredentials: true }).finally(() => {
      setUser(null);
    });
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
