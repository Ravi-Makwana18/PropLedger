import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './AdminNotificationsPage.css';

const TYPE_COLORS = {
  'Land Buying': { bg: '#eff6ff', color: '#2563eb' },
  'Land Selling': { bg: '#f0fdf4', color: '#16a34a' },
  'Investment': { bg: '#fdf4ff', color: '#9333ea' },
  'Partnership': { bg: '#fff7ed', color: '#c2410c' },
  'General': { bg: '#f1f5f9', color: '#475569' },
};

const typeStyle = (type) => TYPE_COLORS[type] || { bg: '#f1f5f9', color: '#475569' };

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

// Trash SVG icon
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // id of single delete confirm
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    API.get('/api/enquiry/all')
      .then(res => setEnquiries(res.data.enquiries || []))
      .catch(() => { });
  }, []);

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

  const unreadCount = enquiries.filter(e => !e.isRead).length;

  const filtered = enquiries.filter(e => {
    if (filter === 'unread') return !e.isRead;
    if (filter === 'read') return e.isRead;
    return true;
  });

  return (
    <div className="nf-page">

      {/* ── Back Button ── */}
      <button className="ad-back-btn" onClick={() => navigate(-1)}>
        <span className="ad-back-arrow">←</span> Back
      </button>

      {/* ── Page Header ── */}
      <div className="nf-header">
        <div className="nf-header-left">
          <div className="nf-header-icon">🔔</div>
          <div>
            <h1 className="nf-title">Enquiry Notifications</h1>
            <p className="nf-subtitle">Incoming property enquiries from customers</p>
          </div>
        </div>
        <div className="nf-header-right">
          {unreadCount > 0 && (
            <button className="nf-mark-all-btn" onClick={markAllRead}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="nf-stats-row">
        <div className="nf-stat">
          <span className="nf-stat-num">{enquiries.length}</span>
          <span className="nf-stat-label">Total</span>
        </div>
        <div className="nf-stat nf-stat--unread">
          <span className="nf-stat-num">{unreadCount}</span>
          <span className="nf-stat-label">Unread</span>
        </div>
        <div className="nf-stat nf-stat--read">
          <span className="nf-stat-num">{enquiries.length - unreadCount}</span>
          <span className="nf-stat-label">Read</span>
        </div>
      </div>

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
  );
};

export default AdminNotificationsPage;
