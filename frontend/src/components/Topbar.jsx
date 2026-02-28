import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Topbar = ({ onMenuClick, pageTitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

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

    // Poll unread notification count every 30s (admin only)
    useEffect(() => {
        if (user?.role !== 'admin') return;
        const fetchCount = () => {
            API.get('/api/enquiry/unread-count')
                .then(res => setUnreadCount(res.data.count || 0))
                .catch(() => { });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-hamburger" onClick={onMenuClick} aria-label="Open menu">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <h1 className="topbar-title">{pageTitle}</h1>
            </div>

            <div className="topbar-right">
                {/* Notification Bell */}
                <Link to="/admin/notifications" className="topbar-icon-btn" title="Notifications" aria-label="Notifications">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </Link>

                {/* Avatar Dropdown */}
                <div className="topbar-avatar-wrap" ref={dropdownRef}>
                    <button
                        className="topbar-avatar"
                        onClick={() => setAvatarOpen(v => !v)}
                        aria-label="User menu"
                        aria-expanded={avatarOpen}
                    >
                        {initials}
                    </button>
                    {avatarOpen && (
                        <div className="topbar-dropdown">
                            <div className="topbar-dropdown-header">
                                <div className="topbar-dropdown-name">{user?.name || 'Admin'}</div>
                                <div className="topbar-dropdown-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
                            </div>
                            <div className="topbar-dropdown-divider" />
                            <Link to="/dashboard" className="topbar-dropdown-item" onClick={() => setAvatarOpen(false)}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                Dashboard
                            </Link>
                            <button className="topbar-dropdown-item topbar-dropdown-item--danger" onClick={handleLogout}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
