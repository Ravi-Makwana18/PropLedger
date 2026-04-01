/**
 * ============================================
 * PropLedger - Topbar Component
 * ============================================
 * Top navigation bar with user menu and page title
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Topbar Component
 * Displays page title, breadcrumbs, and user profile dropdown
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onMenuClick - Callback for menu button click
 * @param {string} props.pageTitle - Current page title
 */
const Topbar = ({ onMenuClick, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setAvatarOpen(false);
  }, [location.pathname]);

  /**
   * Open logout confirmation modal
   */
  const openLogoutModal = () => {
    setAvatarOpen(false);
    setShowLogoutModal(true);
  };

  /**
   * Handle logout with delay for UX feedback
   */
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      logout();
      navigate('/login');
    }, 700);
  };

  // Generate user initials
  const initials = user?.contactPersonName
    ? user.contactPersonName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.name
      ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : 'AD';

  return (
    <>
      <header className={`topbar${scrolled ? ' topbar--scrolled' : ''}`}>
        <div className="topbar-left">
          <button 
            className="topbar-hamburger" 
            onClick={onMenuClick} 
            aria-label="Open menu"
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-title-wrapper">
            <h1 className="topbar-title">{pageTitle}</h1>
            <div className="topbar-breadcrumb">
              <span className="topbar-breadcrumb-item">Dashboard</span>
              {pageTitle !== 'Dashboard' && (
                <>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span className="topbar-breadcrumb-item topbar-breadcrumb-item--active">{pageTitle}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="topbar-right">
          {/* User Profile Dropdown */}
          <div className="topbar-avatar-wrap" ref={dropdownRef}>
            <button
              className={`topbar-avatar${avatarOpen ? ' topbar-avatar--active' : ''}`}
              onClick={() => setAvatarOpen(v => !v)}
              aria-label="User menu"
              aria-expanded={avatarOpen}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="topbar-avatar-image"
                />
              ) : (
                <span className="topbar-avatar-initials">{initials}</span>
              )}
              <svg className="topbar-avatar-chevron" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {avatarOpen && (
              <div className="topbar-dropdown">
                <div className="topbar-dropdown-header">
                  <div className="topbar-dropdown-avatar">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="topbar-dropdown-info">
                    <div className="topbar-dropdown-name">{user?.companyName || user?.name || 'Company'}</div>
                    <div className="topbar-dropdown-email">{user?.email || 'user@example.com'}</div>
                  </div>
                </div>
                <div className="topbar-dropdown-divider" />
                <Link to="/profile" className="topbar-dropdown-item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Profile</span>
                </Link>
                <Link to="/subscription-status" className="topbar-dropdown-item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span>Subscription</span>
                </Link>
                <div className="topbar-dropdown-divider" />
                <button className="topbar-dropdown-item topbar-dropdown-item--danger" onClick={openLogoutModal}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sign-out confirmation modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)} aria-modal="true" role="dialog">
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="logout-modal-title">Sign Out?</h3>
            <p className="logout-modal-desc">Are you sure you want to sign out of your account?</p>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn logout-modal-btn--cancel" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>Cancel</button>
              <button className="logout-modal-btn logout-modal-btn--confirm" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <><span className="modal-spinner" /> Signing out…</> : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
