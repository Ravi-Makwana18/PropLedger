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

function AppContent() {

  return (
    <>
      <Routes>
        {/* ── Public routes ─────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Admin / Private routes – wrapped in AdminLayout ──── */}
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
      </Routes>

    </>
  );
}

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
