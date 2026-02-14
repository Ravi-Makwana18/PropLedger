import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DealDetails from './pages/DealDetails';
import AddDeal from './pages/AddDeal';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
