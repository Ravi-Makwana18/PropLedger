import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DealDetails from './pages/DealDetails';
import AddDeal from './pages/AddDeal';

function AppContent() {
  const location = useLocation();
  
  // Hide navbar and footer on login and register pages
  const hideNavbarFooter = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/deals/:id"
          element={
            <PrivateRoute>
              <DealDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-deal"
          element={
            <PrivateRoute adminOnly={true}>
              <AddDeal />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/add-deal"
          element={
            <PrivateRoute adminOnly={true}>
              <AddDeal />
            </PrivateRoute>
          }
        />
      </Routes>
      {!hideNavbarFooter && <Footer />}
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
