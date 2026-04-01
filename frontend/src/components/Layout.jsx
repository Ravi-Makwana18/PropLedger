/**
 * ============================================
 * PropLedger - Admin Layout Component
 * ============================================
 * Main layout wrapper with sidebar and topbar navigation
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Page title mapping for different routes
 */
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/deals': 'Deals',
  '/add-deal': 'Add New Deal',
  '/admin/add-deal': 'Add New Deal',
  '/admin/notifications': 'Notifications',
  '/history': 'Payment History',
  '/profile': 'My Profile',
  '/subscription-status': 'Subscription Status'
};

/**
 * Get page title based on current pathname
 * @param {string} pathname - Current route pathname
 * @returns {string} Page title
 */
const getPageTitle = (pathname) => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/deals/')) return 'Deal Details';
  return 'Dashboard';
};

/**
 * Admin Layout Component
 * Provides responsive layout with collapsible sidebar
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 */
const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /**
   * Handle menu button click
   * Toggles sidebar on desktop, opens drawer on mobile
   */
  const handleMenuClick = () => {
    const mobile = window.innerWidth < 768;
    if (mobile) {
      setMobileOpen(v => !v);
    } else {
      setSidebarCollapsed(v => !v);
    }
  };

  /**
   * Close mobile drawer
   */
  const handleClose = () => setMobileOpen(false);

  const pageTitle = getPageTitle(location.pathname);

  // Determine if currently on mobile
  const isMobileNow = typeof window !== 'undefined' && window.innerWidth < 768;
  const sidebarCollapsedProp = !isMobileNow && sidebarCollapsed;

  return (
    <div className={`admin-layout${sidebarCollapsed && !isMobileNow ? ' admin-layout--collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsedProp}
        mobileOpen={mobileOpen}
        onClose={handleClose}
      />
      <div className="admin-main">
        <Topbar onMenuClick={handleMenuClick} pageTitle={pageTitle} />
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
