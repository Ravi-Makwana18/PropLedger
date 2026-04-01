/**
 * ============================================
 * PropLedger - Private Route Component
 * ============================================
 * Protects routes requiring authentication and role-based access
 * 
 * @author PropLedger Development Team
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
 * @param {boolean} props.adminOnly - Requires admin or superadmin role
 * @param {boolean} props.superAdminOnly - Requires superadmin role only
 */
const PrivateRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check super admin access
  if (superAdminOnly && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  // Check admin access
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  // User has required permissions - render children
  return children;
};

export default PrivateRoute;
