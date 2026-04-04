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
const getPageTitle = (pathname, search) => {
  const params = new URLSearchParams(search);
  const type = params.get('type');
  
  if (pathname === '/dashboard') {
    if (type === 'Buy') return 'Purchase Deals';
    if (type === 'Sell') return 'Sell Deals';
    if (type === 'Other') return 'Other Deals';
  }
  
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      // Close mobile drawer when switching to desktop
      if (!mobile && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /**
   * Handle menu button click
   * Toggles sidebar on desktop, opens drawer on mobile
   */
  const handleMenuClick = () => {
    console.log('🍔 Hamburger clicked! isMobile:', isMobile, 'current mobileOpen:', mobileOpen);
    if (isMobile) {
      setMobileOpen(prev => {
        console.log('📱 Setting mobileOpen from', prev, 'to', !prev);
        return !prev;
      });
    } else {
      setSidebarCollapsed(v => !v);
    }
  };

  /**
   * Close mobile drawer
   */
  const handleClose = () => setMobileOpen(false);

  const pageTitle = getPageTitle(location.pathname, location.search);
  const sidebarCollapsedProp = !isMobile && sidebarCollapsed;

  // Debug logging
  console.log('📐 Layout render - isMobile:', isMobile, 'mobileOpen:', mobileOpen, 'sidebarCollapsed:', sidebarCollapsed);

  return (
    <div className={`admin-layout${sidebarCollapsed && !isMobile ? ' admin-layout--collapsed' : ''}`}>
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
