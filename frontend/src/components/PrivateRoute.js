/**
 * ============================================
 * PropLedger - Private Route Component
 * ============================================
 * Protects routes requiring authentication and role-based access
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Private Route Component
 * Redirects to login if not authenticated
 * Redirects to dashboard if insufficient permissions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} props.adminOnly - Requires admin role
 */
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-skeleton-container">
        <div className="auth-skeleton-left"></div>
        <div className="auth-skeleton-right">
          <div className="auth-skeleton-form">
            <div className="skeleton-base auth-skeleton-badge"></div>
            <div className="skeleton-base auth-skeleton-form-title"></div>
            <div className="skeleton-base auth-skeleton-form-subtitle"></div>
            <div className="skeleton-base auth-skeleton-field"></div>
            <div className="skeleton-base auth-skeleton-field"></div>
            <div className="skeleton-base auth-skeleton-btn"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;
