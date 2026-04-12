/**
 * ============================================
 * PropLedger - Main Application Component
 * ============================================
 * Configures routing and authentication for the application
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DealDetails = lazy(() => import('./pages/DealDetails'));
const AddDeal = lazy(() => import('./pages/AddDeal'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const CreateUser = lazy(() => import('./pages/CreateUser'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));


/**
 * Application Content Component
 * Defines all application routes with proper authentication
 */
function AppContent() {
  return (
    <Suspense
      fallback={
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
      }
    >
    <Routes>
      {/* ============================================ */}
      {/* Public Routes */}
      {/* ============================================ */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />


      {/* ============================================ */}
      {/* Protected Routes (Authentication Required) */}
      {/* ============================================ */}
      
      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Deals List */}
      <Route
        path="/deals"
        element={
          <PrivateRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Deal Details */}
      <Route
        path="/deals/:id"
        element={
          <PrivateRoute>
            <AdminLayout>
              <DealDetails />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Add Deal (Admin + Manager) */}
      <Route
        path="/add-deal"
        element={
          <PrivateRoute>
            <AdminLayout>
              <AddDeal />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Payment History */}
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <AdminLayout>
              <HistoryPage />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* User Profile */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      {/* Create User (Admin Only) */}
      <Route
        path="/create-user"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminLayout>
              <CreateUser />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      {/* Manage Users (Admin Only) */}
      <Route
        path="/manage-users"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminLayout>
              <ManageUsers />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      

    </Routes>
    </Suspense>
  );
}

/**
 * Main App Component
 * Wraps the application with Router and AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
