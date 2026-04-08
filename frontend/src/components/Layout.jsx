/**
 * ============================================
 * PropLedger - Admin Layout Component
 * ============================================
 * Main layout wrapper with sidebar and topbar navigation
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  '/subscription-status': 'Subscription Status',
  '/create-user': 'Create User',
  '/manage-users': 'Manage Users'
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
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeAnimKey, setRouteAnimKey] = useState(0);
  const location = useLocation();
  const previousRouteRef = useRef(`${location.pathname}${location.search}`);

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

  // Professional micro-loader on internal route transitions.
  useEffect(() => {
    const currentRoute = `${location.pathname}${location.search}`;
    if (currentRoute === previousRouteRef.current) return;

    previousRouteRef.current = currentRoute;
    setIsRouteLoading(true);
    setRouteAnimKey((prev) => prev + 1);
    const timer = setTimeout(() => setIsRouteLoading(false), 420);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  /**
   * Handle menu button click
   * Toggles sidebar on desktop, opens drawer on mobile
   */
  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev);
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

  return (
    <div className={`admin-layout${sidebarCollapsed && !isMobile ? ' admin-layout--collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsedProp}
        mobileOpen={mobileOpen}
        onClose={handleClose}
      />
      <div className="admin-main">
        {isRouteLoading && (
          <div className="admin-route-loader" aria-hidden="true">
            <span className="admin-route-loader-bar" />
          </div>
        )}
        <Topbar onMenuClick={handleMenuClick} pageTitle={pageTitle} />
        <main key={routeAnimKey} className="admin-content admin-content--route-enter">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
