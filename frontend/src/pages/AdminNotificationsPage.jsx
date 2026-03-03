import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import './AdminNotificationsPage.css';

// ── Enquiry type colour map (background + foreground) ───────────────────
const TYPE_COLORS = {
  'Land Buying': { bg: '#eff6ff', color: '#2563eb' },
  'Land Selling': { bg: '#f0fdf4', color: '#16a34a' },
  'Investment': { bg: '#fdf4ff', color: '#9333ea' },
  'Partnership': { bg: '#fff7ed', color: '#c2410c' },
  'General': { bg: '#f1f5f9', color: '#475569' },
};

// Falls back to the 'General' style for any unknown enquiry type
const typeStyle = (type) => TYPE_COLORS[type] || { bg: '#f1f5f9', color: '#475569' };

// ── Utility helpers ────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const formatDate = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Inline SVG trash icon reused in each notification card
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const AdminNotificationsPage = () => {
  // ── State ───────────────────────────────────────────────────────────────
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── On mount: fetch all enquiries ───────────────────────────────────────
  useEffect(() => {
    API.get('/api/enquiry/all')
      .then(res => setEnquiries(res.data.enquiries || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // ── API action handlers ───────────────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await API.patch(`/api/enquiry/${id}/read`);
      setEnquiries(prev => prev.map(e => e._id === id ? { ...e, isRead: true } : e));
    } catch { }
  };

  const markAllRead = async () => {
    const unread = enquiries.filter(e => !e.isRead);
    await Promise.all(unread.map(e => API.patch(`/api/enquiry/${e._id}/read`).catch(() => { })));
    setEnquiries(prev => prev.map(e => ({ ...e, isRead: true })));
  };

  const deleteOne = async (id) => {
    try {
      await API.delete(`/api/enquiry/${id}`);
      setEnquiries(prev => prev.filter(e => e._id !== id));
    } catch { }
    setConfirmDeleteId(null);
  };

  const deleteAll = async () => {
    try {
      await API.delete('/api/enquiry/all');
      setEnquiries([]);
    } catch { }
    setConfirmDeleteAll(false);
  };

  // ── Derived data: unread count + filtered list ─────────────────────────
  const unreadCount = enquiries.filter(e => !e.isRead).length;

  const filtered = enquiries.filter(e => {
    if (filter === 'unread') return !e.isRead;
    if (filter === 'read') return e.isRead;
    return true;
  });

  if (loading) {
    return (
      <div className="nf-page">
        {/* Hero shimmer */}
        <div className="nf-skeleton-hero">
          <div className="nf-skeleton-hero-top">
            <div className="db-skeleton-line" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="db-skeleton-line" style={{ height: 22, width: '55%', marginBottom: 10 }} />
              <div className="db-skeleton-line" style={{ height: 14, width: '70%' }} />
            </div>
          </div>
          <div className="nf-skeleton-chips">
            {[80, 80, 80].map((w, i) => <div key={i} className="db-skeleton-line" style={{ width: w, height: 60, borderRadius: 12 }} />)}
          </div>
        </div>
        {/* Content shimmer */}
        <div className="nf-content-area">
          <div className="db-skeleton-line" style={{ height: 44, marginBottom: 20, borderRadius: 8 }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="nf-skeleton-card">
              <div className="db-skeleton-line" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="db-skeleton-line" style={{ height: 14, width: '40%', marginBottom: 8 }} />
                <div className="db-skeleton-line" style={{ height: 12, width: '30%', marginBottom: 6 }} />
                <div className="db-skeleton-line" style={{ height: 12, width: '60%' }} />
              </div>
              <div className="db-skeleton-line" style={{ width: 60, height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="nf-page">

      {/* ── Hero Header (History-style) ── */}
      <div className="nf-hero">
        <div className="nf-hero-inner">
          <div className="nf-hero-top">
            <div className="nf-hero-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h1 className="nf-hero-title">Enquiry Notifications</h1>
              <p className="nf-hero-subtitle">Incoming property enquiries from customers</p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="nf-hero-chips">
            <div className="nf-hero-chip">
              <span className="nf-hero-chip-label">Total</span>
              <span className="nf-hero-chip-value">{enquiries.length}</span>
            </div>
            <div className="nf-hero-chip">
              <span className="nf-hero-chip-label">Unread</span>
              <span className="nf-hero-chip-value">{unreadCount}</span>
            </div>
            <div className="nf-hero-chip">
              <span className="nf-hero-chip-label">Read</span>
              <span className="nf-hero-chip-value">{enquiries.length - unreadCount}</span>
            </div>
            {unreadCount > 0 && (
              <button className="nf-mark-all-btn" onClick={markAllRead}>
                ✓ Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter Tabs + List ── */}
      <div className="nf-content-area">
        {/* ── Filter Tabs ── */}
        <div className="nf-tabs">
          {['all', 'unread', 'read'].map(tab => (
            <button
              key={tab}
              className={`nf-tab${filter === tab ? ' nf-tab--active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'all' ? 'All' : tab === 'unread' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'Read'}
            </button>
          ))}
          {/* Delete all — right side of tabs bar */}
          {enquiries.length > 0 && (
            <div className="nf-tabs-delete">
              {confirmDeleteAll ? (
                <div className="nf-confirm-strip">
                  <span className="nf-confirm-text">Delete all?</span>
                  <button className="nf-confirm-yes" onClick={deleteAll}>Yes</button>
                  <button className="nf-confirm-no" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
                </div>
              ) : (
                <button className="nf-delete-all-btn" onClick={() => setConfirmDeleteAll(true)} title="Delete all notifications">
                  <TrashIcon /> Delete all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Notification List ── */}
        <div className="nf-list">
          {filtered.length === 0 ? (
            <div className="nf-empty">
              <span className="nf-empty-icon">📭</span>
              <p>No {filter !== 'all' ? filter : ''} notifications found.</p>
            </div>
          ) : (
            filtered.map(enquiry => {
              const ts = typeStyle(enquiry.enquiryType);
              const initials = getInitials(enquiry.name);
              const isConfirmingDelete = confirmDeleteId === enquiry._id;
              return (
                <div
                  key={enquiry._id}
                  className={`nf-card${enquiry.isRead ? '' : ' nf-card--unread'}`}
                >
                  {!enquiry.isRead && <div className="nf-unread-bar" />}

                  {/* Avatar */}
                  <div className="nf-avatar">{initials}</div>

                  {/* Main content */}
                  <div className="nf-content">
                    <div className="nf-content-top">
                      <span className="nf-name">{enquiry.name}</span>
                      <span className="nf-type-badge" style={{ background: ts.bg, color: ts.color }}>
                        {enquiry.enquiryType}
                      </span>
                      {!enquiry.isRead && <span className="nf-dot" />}
                    </div>
                    <div className="nf-phone">📞 {enquiry.phone}</div>
                    <div className="nf-message">
                      {enquiry.message || <span className="nf-no-msg">No message provided</span>}
                    </div>
                  </div>

                  {/* Meta / actions */}
                  <div className="nf-meta">
                    <span className="nf-date">{formatDate(enquiry.createdAt)}</span>
                    <div className="nf-actions-row">
                      {!enquiry.isRead && (
                        <button className="nf-read-btn" onClick={() => markAsRead(enquiry._id)} title="Mark as read">
                          ✓ Read
                        </button>
                      )}
                      {enquiry.isRead && (
                        <span className="nf-read-tag">✓ Read</span>
                      )}
                      {/* Trash / confirm delete */}
                      {isConfirmingDelete ? (
                        <div className="nf-inline-confirm">
                          <button className="nf-confirm-yes-sm" onClick={() => deleteOne(enquiry._id)}>Yes</button>
                          <button className="nf-confirm-no-sm" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          className="nf-trash-btn"
                          onClick={() => setConfirmDeleteId(enquiry._id)}
                          title="Delete notification"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
