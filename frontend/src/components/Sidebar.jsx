/**
 * ============================================
 * PropLedger - Sidebar Navigation Component
 * ============================================
 * Responsive sidebar with role-based navigation items
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-compact.jpg';
import AppButton from './ui/AppButton';
import { preloadRouteForPath, preloadRoute } from '../utils/preloadRoutes';

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
];

/**
 * User Management navigation links (admin only)
 */
const USER_MANAGEMENT_ITEMS = [
  {
    to: '/create-user',
    label: 'Create User',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    )
  },
  {
    to: '/manage-users',
    label: 'Manage Users',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

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

  const navPreloadProps = (to) => ({
    onMouseEnter: () => preloadRouteForPath(to),
    onFocus: () => preloadRouteForPath(to),
    onTouchStart: () => preloadRouteForPath(to),
  });

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
                {...navPreloadProps(item.to)}
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
                    {...navPreloadProps(item.to)}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          )}

          {/* User Management section (admin only) */}
          {user?.role === 'admin' && (
            <div className="sidebar-nav-section">
              {!collapsed && <span className="sidebar-nav-label">User Management</span>}
              {USER_MANAGEMENT_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                  onClick={() => onClose && onClose()}
                  title={collapsed ? item.label : undefined}
                  {...navPreloadProps(item.to)}
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
            <div
              className="sidebar-user"
              onClick={() => navigate('/profile')}
              onMouseEnter={() => preloadRoute('profile')}
              onTouchStart={() => preloadRoute('profile')}
              title="View Profile"
            >
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
                <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Staff' : 'User'}</div>
              </div>
            </div>
          )}
          <AppButton
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
          </AppButton>
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
              <AppButton className="logout-modal-btn logout-modal-btn--cancel" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>Cancel</AppButton>
              <AppButton className="logout-modal-btn logout-modal-btn--confirm" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <><span className="modal-spinner" /> Signing out…</> : 'Yes, Sign Out'}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
