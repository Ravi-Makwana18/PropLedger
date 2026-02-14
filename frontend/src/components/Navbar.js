import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logo} alt="Destination Dholera Logo" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>Destination Dholera</span>
          </Link>
          
          {user && (
            <>
              <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
              
              <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <Link to="/dashboard" className="navbar-link" onClick={closeMobileMenu}>Dashboard</Link>
                {isAdmin && (
                  <Link to="/admin/add-deal" className="navbar-link" onClick={closeMobileMenu}>Add Deal</Link>
                )}
                <span className="navbar-link">{user.name}</span>
                <button onClick={() => { logout(); closeMobileMenu(); }} className="btn btn-sm btn-danger">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
