import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/deals': 'Deals',
    '/add-deal': 'Add New Deal',
    '/admin/add-deal': 'Add New Deal',
    '/admin/notifications': 'Notifications',
};

const getPageTitle = (pathname) => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith('/deals/')) return 'Deal Details';
    return 'Dashboard';
};

const AdminLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleMenuClick = () => {
        const mobile = window.innerWidth < 768;
        if (mobile) {
            setMobileOpen(v => !v);
        } else {
            setSidebarCollapsed(v => !v);
        }
    };

    const handleClose = () => setMobileOpen(false);

    const pageTitle = getPageTitle(location.pathname);

    // On desktop: pass collapsed state; on mobile: sidebar always full-width when open
    // Sidebar is "collapsed" for CSS only on desktop
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
