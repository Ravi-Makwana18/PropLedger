import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import AppCard from '../components/ui/AppCard';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import './ManageUsers.css';

const ManageUsers = () => {
  const { user } = useAuth();
  const [managedUsers, setManagedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/auth/users');
      setManagedUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (userToDelete) => {
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await API.delete(`/api/auth/users/${userToDelete._id}`);
      setManagedUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      setDeleteSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = managedUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const name = (u.contactPersonName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const getInitials = (u) => {
    return (u.contactPersonName || u.name || u.email || 'U')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="mu-page">
        <div className="mu-hero">
          <div className="mu-hero-inner">
            <div className="mu-hero-top">
              <div className="mu-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="mu-hero-title-group">
                <h1 className="mu-hero-title">Manage Users</h1>
                <p className="mu-hero-subtitle">View and manage staff user accounts</p>
              </div>
            </div>
          </div>
        </div>
        <AppCard className="mu-content">
          <div className="mu-error">You don't have permission to access this page.</div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="mu-page">
      {/* Hero Header */}
      <div className="mu-hero">
        <div className="mu-hero-inner">
          <div className="mu-hero-top">
            {/* <div className="mu-hero-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div> */}
            <div className="mu-hero-title-group">
              <h1 className="mu-hero-title">Manage Users</h1>
              <p className="mu-hero-subtitle">View and manage staff user accounts</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mu-stats">
            <div className="mu-stat-card">
              <span className="mu-stat-number">{managedUsers.length}</span>
              <span className="mu-stat-label">Total Users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AppCard className="mu-content">
        {/* Search */}
        <div className="mu-search-wrap">
          <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <AppInput
            type="text"
            className="mu-search-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Success Message */}
        {deleteSuccess && (
          <div className="mu-alert mu-alert--success pl-alert pl-alert--success">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{deleteSuccess}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mu-alert mu-alert--error pl-alert pl-alert--error">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <AppButton className="mu-retry-btn" onClick={fetchUsers}>Retry</AppButton>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="mu-empty pl-state pl-state--empty">
            <svg className="pl-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="pl-empty-title">No users found</h3>
            <p className="pl-empty-desc">{searchTerm ? 'No users match your search.' : 'Create a staff user first to get started.'}</p>
          </div>
        ) : (
          /* User List */
          <div className="mu-list">
            {filteredUsers.map(u => (
              <AppCard key={u._id} className="mu-user-card">
                <div className="mu-user-avatar">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt="avatar" />
                  ) : (
                    <span>{getInitials(u)}</span>
                  )}
                </div>
                <div className="mu-user-info">
                  <h3 className="mu-user-name">{u.contactPersonName || u.name || '—'}</h3>
                  <p className="mu-user-email">{u.email || u.mobileNumber || '—'}</p>
                  <div className="mu-user-meta">
                    <span className="mu-user-role">
                      {u.role === 'manager' ? 'Staff' : u.role === 'admin' ? 'Admin' : u.role || 'User'}
                    </span>
                  </div>
                </div>
                <AppButton
                  className="mu-delete-btn"
                  onClick={() => handleDeleteClick(u)}
                  title="Delete user"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </AppButton>
              </AppCard>
            ))}
          </div>
        )}
      </AppCard>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="mu-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="mu-modal" onClick={e => e.stopPropagation()}>
            <div className="mu-modal-icon mu-modal-icon--danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mu-modal-title">Delete User?</h3>
            <p className="mu-modal-desc">
              Are you sure you want to delete <strong>{userToDelete?.contactPersonName || userToDelete?.name || userToDelete?.email}</strong>? This action cannot be undone.
            </p>
            <div className="mu-modal-actions">
              <AppButton
                className="mu-modal-btn mu-modal-btn--cancel app-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </AppButton>
              <AppButton
                className="mu-modal-btn mu-modal-btn--delete app-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="mu-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;