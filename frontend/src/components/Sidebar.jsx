import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
    {
        to: '/',
        label: 'Home',
        icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        )
    },
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
];

const ADMIN_ITEMS = [
    {
        to: '/add-deal',
        label: 'Add Deal',
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
        label: 'Buy Deals',
        icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
            </svg>
        )
    },
    {
        to: '/dashboard?type=Sell',
        label: 'Sell Deals',
        icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
            </svg>
        )
    },
    {
        to: '/dashboard?type=Other',
        label: 'Other Deals',
        icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
        )
    },
    {
        to: '/admin/notifications',
        label: 'Notifications',
        icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        )
    },
];

const Sidebar = ({ collapsed, mobileOpen, onClose }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
        onClose?.();
    };

    return (
        <>
            {/* Mobile overlay — shown when drawer is open */}
            <div
                className={`sidebar-overlay${mobileOpen ? ' sidebar-overlay--visible' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <img src={logo} alt="Destination Dholera" className="sidebar-logo" />
                    {!collapsed && (
                        <div className="sidebar-brand-text">
                            <span className="sidebar-brand-name">DDPL</span>
                            <span className="sidebar-brand-tagline">Admin Panel</span>
                        </div>
                    )}
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-section">
                        {!collapsed && <span className="sidebar-nav-label">Main</span>}
                        {NAV_ITEMS.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                                onClick={onClose}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="sidebar-nav-icon">{item.icon}</span>
                                {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    {isAdmin && (
                        <div className="sidebar-nav-section">
                            {!collapsed && <span className="sidebar-nav-label">Admin</span>}
                            {ADMIN_ITEMS.map(item => {
                                // For Buy/Sell Deals: match both path and query param
                                const isActive = location.pathname + location.search === item.to ||
                                    (item.to === '/dashboard?type=Buy' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Buy') ||
                                    (item.to === '/dashboard?type=Sell' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Sell') ||
                                    (item.to === '/dashboard?type=Other' && location.pathname === '/dashboard' && new URLSearchParams(location.search).get('type') === 'Other');
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={() => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
                                        onClick={onClose}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <span className="sidebar-nav-icon">{item.icon}</span>
                                        {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
                                        {!collapsed && item.label === 'Buy Deals' && (
                                            <span className="sidebar-deal-badge sidebar-deal-badge--buy">Buy</span>
                                        )}
                                        {!collapsed && item.label === 'Sell Deals' && (
                                            <span className="sidebar-deal-badge sidebar-deal-badge--sell">Sell</span>
                                        )}
                                        {!collapsed && item.label === 'Other Deals' && (
                                            <span className="sidebar-deal-badge sidebar-deal-badge--other">Other</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </nav>

                {/* User + Logout */}
                <div className="sidebar-footer">
                    {!collapsed && (
                        <div className="sidebar-user">
                            <div className="sidebar-user-avatar">
                                {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                            </div>
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
                                <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
                            </div>
                        </div>
                    )}
                    <button
                        className="sidebar-logout-btn"
                        onClick={handleLogout}
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
        </>
    );
};

export default Sidebar;
