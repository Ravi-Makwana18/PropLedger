import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaBars, FaHome, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../nav-btn.css';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = window.location.pathname;
  // Use CSS classes for button styling for consistency
  // .nav-btn, .nav-btn--logout, .nav-btn--primary in CSS
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 900;

  // Helper for hover effect
  const handleMouseEnter = (e, color) => {
    e.currentTarget.style.backgroundColor = color;
  };
  const handleMouseLeave = (e, color) => {
    e.currentTarget.style.backgroundColor = color;
  };
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };
  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div className="navbar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to={user ? "/dashboard" : "/"} className="navbar-brand" style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: '"Bricolage Grotesque", sans-serif', color: 'white' }}>
            Destination Dholera
          </Link>
        </div>
        {isMobile ? (
          <button
            className="navbar-burger"
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer', marginLeft: 'auto' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        ) : null}
        {/* Desktop nav links */}
        {!isMobile && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            {user && currentPath !== '/dashboard' && (
              <Link to="/dashboard" className="nav-btn nav-btn--primary dashboard-button">
                <span>Dashboard</span>
              </Link>
            )}
            {user && currentPath === '/dashboard' && (
              <Link
                to="/"
                className="nav-btn nav-btn--primary home-button"
              >
                <span>Home</span>
              </Link>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="nav-btn nav-btn--logout logout-button"
                title="Logout"
              >
                <span>Logout</span>
              </button>
            ) : (
              <Link to="/login" className="nav-btn nav-btn--primary login-button">
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
      {/* Mobile nav menu */}
      {isMobile && menuOpen && !loading && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: 0,
          background: '#2d2d4d',
          borderRadius: '0 0 0 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: 180,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          {user && currentPath !== '/dashboard' && (
            <Link
              to="/dashboard"
              className="nav-btn nav-btn--primary dashboard-button"
              style={{ width: '100%', marginRight: 0, marginBottom: 8 }}
              onClick={() => setMenuOpen(false)}
            >
              <span>Dashboard</span>
            </Link>
          )}
          {user && currentPath === '/dashboard' && (
            <Link
              to="/"
              className="nav-btn nav-btn--primary home-button"
              style={{ width: '100%', marginRight: 0, marginBottom: 8 }}
              onClick={() => setMenuOpen(false)}
            >
              <span>Home</span>
            </Link>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="nav-btn nav-btn--logout logout-button"
              style={{ width: '100%', marginRight: 0, marginBottom: 8 }}
              title="Logout"
            >
              <span>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="nav-btn nav-btn--primary login-button"
              style={{ width: '100%', marginRight: 0, marginBottom: 8 }}
              onClick={() => setMenuOpen(false)}
            >
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
        </div>
    </nav>
  );
};

export default Navbar;
