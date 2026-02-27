import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DealDetails from './pages/DealDetails';
import AddDeal from './pages/AddDeal';
import AdminNotificationsPage from './pages/AdminNotificationsPage';

// Routes that use the public Navbar/Footer layout
const PUBLIC_ROUTES = ['/', '/login', '/register'];

function AppContent() {
  const location = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {/* Public pages keep the Navbar/Footer */}
      {isPublic && !isAuthPage && <Navbar />}

      <Routes>
        {/* ── Public routes ─────────────────────── */}
        <Route path="/" element={<Home />} />
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
      </Routes>

      {isPublic && !isAuthPage && <Footer />}
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
