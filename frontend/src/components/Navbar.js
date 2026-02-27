import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentPath = window.location.pathname;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav
      className={`navbar-premium${scrolled ? ' navbar-premium--scrolled' : ''}`}
    >
      <div className="navbar-premium-inner">
        {/* LEFT – Brand */}
        <Link to={user ? '#' : '/'} className="navbar-brand-premium">
          <img src={logo} alt="Destination Dholera" className="navbar-logo" />
          Destination Dholera
        </Link>

        {/* CENTER – Nav links (desktop) */}
        <div className="navbar-links-center">
          <a href="/" className="navbar-nav-link">Home</a>
          <a href="#contact" className="navbar-nav-link">Contact</a>
        </div>

        {/* RIGHT – Auth buttons (desktop) */}
        <div className="navbar-actions-desktop">
          {!loading && (
            <>
              {user && currentPath !== '/dashboard' && (
                <Link to="/dashboard" className="nbtn nbtn--primary">
                  Dashboard
                </Link>
              )}
              {user && currentPath === '/dashboard' && (
                <Link to="/" className="nbtn nbtn--primary">
                  Home
                </Link>
              )}
              {user ? (
                <button onClick={handleLogout} className="nbtn nbtn--logout" title="Logout">
                  Logout
                </button>
              ) : (
                <Link to="/login" className="nbtn nbtn--primary">
                  Admin Login
                </Link>
              )}
            </>
          )}
        </div>

        {/* Hamburger – mobile only */}
        <button
          className="navbar-hamburger-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile slide-in drawer */}
      <div className={`navbar-mobile-drawer${menuOpen ? ' navbar-mobile-drawer--open' : ''}`}>
        <a href="/" className="drawer-nav-link" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="#contact" className="drawer-nav-link" onClick={() => setMenuOpen(false)}>Contact</a>
        <div className="drawer-divider" />
        {!loading && (
          <>
            {user && currentPath !== '/dashboard' && (
              <Link to="/dashboard" className="nbtn nbtn--primary drawer-btn" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            {user && currentPath === '/dashboard' && (
              <Link to="/" className="nbtn nbtn--primary drawer-btn" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="nbtn nbtn--logout drawer-btn">
                Logout
              </button>
            ) : (
              <Link to="/login" className="nbtn nbtn--primary drawer-btn" onClick={() => setMenuOpen(false)}>
                Admin Login
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;