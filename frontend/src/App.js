/**
 * ============================================
 * PropLedger - Main Application Component
 * ============================================
 * Configures routing and authentication for the application
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DealDetails from './pages/DealDetails';
import AddDeal from './pages/AddDeal';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import HistoryPage from './pages/HistoryPage';
import AdminProfile from './pages/AdminProfile';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import SubscriptionExpiredPage from './pages/SubscriptionExpiredPage';
import SubscriptionStatusPage from './pages/SubscriptionStatusPage';

/**
 * Application Content Component
 * Defines all application routes with proper authentication
 */
function AppContent() {
  return (
    <Routes>
      {/* ============================================ */}
      {/* Public Routes */}
      {/* ============================================ */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />

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
      
      {/* Add Deal (Admin Only) */}
      <Route
        path="/add-deal"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminLayout>
              <AddDeal />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Admin Add Deal (Admin Only) */}
      <Route
        path="/admin/add-deal"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminLayout>
              <AddDeal />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Admin Notifications (Admin Only) */}
      <Route
        path="/admin/notifications"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminLayout>
              <AdminNotificationsPage />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      
      {/* Payment History (Admin Only) */}
      <Route
        path="/history"
        element={
          <PrivateRoute adminOnly={true}>
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
      
      {/* Admin Payments (Super Admin Only) */}
      <Route
        path="/admin/payments"
        element={
          <PrivateRoute superAdminOnly={true}>
            <AdminPaymentsPage />
          </PrivateRoute>
        }
      />
      
      {/* Subscription Status */}
      <Route
        path="/subscription-status"
        element={
          <PrivateRoute>
            <AdminLayout>
              <SubscriptionStatusPage />
            </AdminLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

/**
 * Main App Component
 * Wraps the application with Router and AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
