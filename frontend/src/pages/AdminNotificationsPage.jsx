import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './AdminNotificationsPage.css';

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    API.get('/api/enquiry/all')
      .then(res => {
        setEnquiries(res.data.enquiries || []);
      })
      .catch(() => {
        // Optionally handle error here if needed
      });
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/api/enquiry/${id}/read`);
      setEnquiries(enquiries => enquiries.map(e => e._id === id ? { ...e, isRead: true } : e));
    } catch {
      // Optionally handle error here if needed
    }
  };

  return (
    <div className="admin-notifications-page" style={{ position: 'relative' }}>
      {/* Back Button */}
      <div style={{ position: 'relative', height: 0 }}>
        <button
          className="admin-back-btn"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#fff',
            color: '#2563eb',
            border: '1px solid #dbeafe',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '1rem',
            padding: '0.45rem 1.2rem',
            boxShadow: '0 1px 4px rgba(44,62,80,0.08)',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => navigate('/dashboard')}
        >
          <span style={{ fontSize: 18, fontWeight: 700, marginRight: 4 }}>&larr;</span> Back
        </button>
      </div>
      {/* Header Section */}
      <div className="admin-notifications-header" style={{ marginTop: 48 }}>
        <div className="admin-notifications-header-left">
          <h1>Enquiry Notifications</h1>
          <div className="admin-notifications-header-subtitle">View and manage all incoming property enquiries in real time.</div>
        </div>
        <div className="admin-notifications-header-right">
          <span className="admin-notifications-count-badge">{enquiries.length}</span>
        </div>
      </div>
      {/* Notification List */}
      <div className="admin-notifications-list">
        {enquiries.length === 0 ? (
          <div className="admin-notifications-empty">No enquiries found.</div>
        ) : (
          enquiries.map(enquiry => (
            <div
              key={enquiry._id}
              className="notification-card"
              style={{
                background: '#eaf4ff',
                borderRadius: '18px',
                boxShadow: '0 4px 18px rgba(44,62,80,0.10)',
                padding: '2rem 1.5rem 1.5rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                maxWidth: 700,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem', marginRight: 8 }}>Name:</span>
                    <span style={{ color: '#222', fontSize: '1.08rem' }}>{enquiry.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem', marginRight: 8 }}>Phone:</span>
                    <span style={{ color: '#222', fontSize: '1.08rem' }}>{enquiry.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem', marginRight: 8 }}>Type:</span>
                    <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.08rem' }}>{enquiry.enquiryType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem', marginRight: 8 }}>Message:</span>
                    <span style={{ color: '#374151', fontSize: '1.08rem' }}>{enquiry.message || 'No message provided.'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem', marginRight: 8 }}>Date:</span>
                    <span style={{ color: '#374151', fontSize: '1.08rem' }}>{new Date(enquiry.createdAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  {!enquiry.isRead && (
                    <button className="mark-read-btn" onClick={() => markAsRead(enquiry._id)} style={{
                      background: '#3498db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: '1rem',
                      padding: '0.5rem 1.2rem',
                      marginBottom: 6,
                      boxShadow: '0 2px 8px rgba(52,152,219,0.12)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}>
                      Mark as Read
                    </button>
                  )}
                  <button className="view-details-btn" style={{
                    background: '#fff',
                    color: '#2563eb',
                    border: '1px solid #dbeafe',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1.2rem',
                    boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
                    cursor: 'pointer',
                    transition: 'border 0.2s, color 0.2s',
                  }}>
                    View Details
                  </button>
                  {/* Unread dot */}
                  {!enquiry.isRead && (
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', display: 'inline-block', marginTop: 8 }}></span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
