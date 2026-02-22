import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import API from '../api/axios';
import './NotificationBell.css';

const NotificationBell = ({ user }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      API.get('/api/enquiry/unread-count')
        .then(res => setUnreadCount(res.data.count || 0));
    }
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="notification-bell-container" onClick={() => navigate('/admin/notifications')}>
      <FaBell className="notification-bell-icon" />
      {unreadCount > 0 && (
        <span className="notification-bell-badge">{unreadCount}</span>
      )}
    </div>
  );
};

export default NotificationBell;
