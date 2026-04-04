/**
 * ============================================
 * PropLedger - Sidebar Navigation Component
 * ============================================
 * Responsive sidebar with role-based navigation items
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

/**
 * Main navigation links (visible to all authenticated users)
 */
const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    to: '/deals',
    label: 'Deals',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    to: '/subscription-status',
    label: 'Subscription',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
];

/**
 * Admin-only navigation links
 */
const ADMIN_ITEMS = [
  {
    to: '/add-deal',
    label: 'Add New Deal',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  {
    to: '/dashboard?type=Buy',
    label: 'Purchase',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  {
    to: '/dashboard?type=Sell',
    label: 'Sell',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    )
  },
  {
    to: '/dashboard?type=Other',
    label: 'Other',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="12 8 12 12 14 14" />
        <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
      </svg>
    )
  },
];

/**
 * Super Admin only navigation links
 */
const SUPERADMIN_ITEMS = [
  {
    to: '/admin/payments',
    label: 'Payments',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    )
  },
];

/**
 * Sidebar Component
 * Responsive navigation sidebar with role-based menu items
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.collapsed - Sidebar collapsed state (desktop)
 * @param {boolean} props.mobileOpen - Mobile drawer open state
 * @param {Function} props.onClose - Callback to close mobile drawer
 */
const Sidebar = ({ collapsed, mobileOpen, onClose }) => {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  // Debug logging for props
  console.log('🎯 Sidebar received props - collapsed:', collapsed, 'mobileOpen:', mobileOpen, 'isMobile:', isMobile);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && mobileOpen && onClose) {
      console.log('🚪 Closing sidebar due to route change');
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /**
   * Open logout confirmation modal
   */
  const openLogoutModal = () => setShowLogoutModal(true);

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
      if (onClose) onClose();
    }, 700);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={() => onClose && onClose()}
        aria-hidden="true"
      />

      <aside 
        className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`} 
        data-mobile-open={mobileOpen}
        style={isMobile && mobileOpen ? { transform: 'translateX(0)' } : {}}
      >
        {/* Brand / logo area */}
        <div className="sidebar-brand">
          <img src={logo} alt="PropLedger" className="sidebar-logo" />
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">PropLedger</span>
            </div>
          )}
          <button className="sidebar-close-btn" onClick={() => onClose && onClose()} aria-label="Close sidebar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Main section */}
          <div className="sidebar-nav-section">
            {!collapsed && <span className="sidebar-nav-label">Main</span>}
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                onClick={() => onClose && onClose()}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="sidebar-nav-section">
              {!collapsed && <span className="sidebar-nav-label">Manage</span>}
              {ADMIN_ITEMS.map(item => {
                const isActive =
                  location.pathname + location.search === item.to ||
                  (item.to === '/dashboard?type=Buy' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Buy') ||
                  (item.to === '/dashboard?type=Sell' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Sell') ||
                  (item.to === '/dashboard?type=Other' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Other');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={() => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                    onClick={() => onClose && onClose()}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
                    {!collapsed && item.label === 'Buy Deals' && <span className="sidebar-deal-badge sidebar-deal-badge--buy">Buy</span>}
                    {!collapsed && item.label === 'Sell Deals' && <span className="sidebar-deal-badge sidebar-deal-badge--sell">Sell</span>}
                    {!collapsed && item.label === 'Other Deals' && <span className="sidebar-deal-badge sidebar-deal-badge--other">Other</span>}
                  </NavLink>
                );
              })}
            </div>
          )}

          {/* Super Admin section */}
          {isSuperAdmin && (
            <div className="sidebar-nav-section">
              {!collapsed && <span className="sidebar-nav-label">Super Admin</span>}
              {SUPERADMIN_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                  onClick={() => onClose && onClose()}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Footer: user info + sign-out button */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="View Profile">
              <div className="sidebar-user-avatar">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" />
                ) : (
                  user?.contactPersonName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ||
                  user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'
                )}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.companyName || user?.name || 'Company'}</div>
                <div className="sidebar-user-role">{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : 'User'}</div>
              </div>
            </div>
          )}
          <button
            className="sidebar-logout-btn"
            onClick={openLogoutModal}
            title="Sign Out"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

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

export default Sidebar;
