import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ onMenuClick, pageTitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);

    // Close the avatar dropdown when the user clicks outside of it
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);



    // Open the sign-out confirmation modal (also closes the avatar dropdown)
    const openLogoutModal = () => {
        setAvatarOpen(false);
        setShowLogoutModal(true);
    };

    // Delay actual logout by 700 ms to show processing feedback,
    // then clear auth state and redirect to the public home page.
    const handleLogout = () => {
        setIsLoggingOut(true);
        setTimeout(() => {
            setShowLogoutModal(false);
            setIsLoggingOut(false);
            logout();
            navigate('/login');
        }, 700);
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <>
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

                    {/* ── Avatar dropdown (user info + sign-out) ── */}
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
                                <button className="topbar-dropdown-item topbar-dropdown-item--danger" onClick={openLogoutModal}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Sign-out confirmation modal (backdrop click to cancel) ── */}
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
