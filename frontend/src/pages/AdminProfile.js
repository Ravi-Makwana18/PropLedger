import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';


import ImageCropModal from '../components/ImageCropModal';
import API from '../api/axios';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user, refreshUser } = useAuth();


  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemovingPicture, setIsRemovingPicture] = useState(false);
  const [expandedCards, setExpandedCards] = useState([]);
  const toggleCard = (cardId) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };



  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous messages
    setUploadError('');
    setUploadSuccess('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for original)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    // Convert image to base64 for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image
  const handleCropComplete = async (croppedImage) => {
    setShowCropModal(false);
    setIsUploadingPicture(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Upload to backend using axios
      const { data } = await API.put('/api/auth/profile-picture', {
        profilePicture: croppedImage
      });

      setProfilePicture(data.profilePicture);
      setUploadSuccess('Profile picture updated successfully!');

      // Refresh user context without a page reload
      await refreshUser();
      setIsUploadingPicture(false);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload profile picture. Please try again.');
      setIsUploadingPicture(false);
      setImageToCrop(null);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  // Handle remove profile picture
  const handleRemoveProfilePicture = async () => {
    setIsRemovingPicture(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      await API.put('/api/auth/profile-picture', {
        profilePicture: null
      });

      setProfilePicture(null);
      setUploadSuccess('Profile picture removed successfully!');
      setShowRemoveConfirm(false);

      // Refresh user context without a page reload
      await refreshUser();
      setIsRemovingPicture(false);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to remove profile picture. Please try again.');
      setIsRemovingPicture(false);
      setShowRemoveConfirm(false);
    }
  };

  return (
    <div className="admin-profile-page">
      {/* Header */}
      <div className="admin-profile-header">
        {/* <button className="admin-profile-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button> */}
        <div className="admin-profile-header-content">
          <div className="admin-profile-avatar-wrapper">
            {profilePicture || user?.profilePicture ? (
              <>
                <img 
                  src={profilePicture || user?.profilePicture} 
                  alt="Profile" 
                  className="admin-profile-avatar-image"
                />
                <div className="admin-profile-avatar-overlay">
                  <label className="admin-profile-avatar-action admin-profile-avatar-action--edit" htmlFor="profile-picture-input" title="Change picture">
                    {isUploadingPicture ? (
                      <div className="admin-profile-upload-spinner" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                  </label>
                  <button 
                    className="admin-profile-avatar-action admin-profile-avatar-action--delete" 
                    onClick={() => setShowRemoveConfirm(true)}
                    title="Remove picture"
                    disabled={isRemovingPicture}
                  >
                    {isRemovingPicture ? (
                      <div className="admin-profile-upload-spinner" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Mobile buttons */}
                <label className="admin-profile-avatar-edit-btn" htmlFor="profile-picture-input" title="Change picture">
                  {isUploadingPicture ? (
                    <div className="admin-profile-upload-spinner" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  )}
                </label>
                <button 
                  className="admin-profile-avatar-delete-btn" 
                  onClick={() => setShowRemoveConfirm(true)}
                  title="Remove picture"
                  disabled={isRemovingPicture}
                >
                  {isRemovingPicture ? (
                    <div className="admin-profile-upload-spinner" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="admin-profile-avatar-large">
                  {user?.contactPersonName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 
                   user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                </div>
                <div className="admin-profile-avatar-overlay">
                  <label className="admin-profile-avatar-action admin-profile-avatar-action--edit" htmlFor="profile-picture-input" title="Upload picture">
                    {isUploadingPicture ? (
                      <div className="admin-profile-upload-spinner" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                        <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
                      </svg>
                    )}
                  </label>
                </div>
                {/* Mobile button */}
                <label className="admin-profile-avatar-edit-btn" htmlFor="profile-picture-input" title="Upload picture">
                  {isUploadingPicture ? (
                    <div className="admin-profile-upload-spinner" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                      <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
                    </svg>
                  )}
                </label>
              </>
            )}
            <input
              id="profile-picture-input"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="admin-profile-file-input-hidden"
              disabled={isUploadingPicture}
            />
          </div>
          <div className="admin-profile-header-info">
            <h1 className="admin-profile-title">
              {user?.contactPersonName || user?.name || 'Administrator'}
            </h1>
            {/* <p className="admin-profile-subtitle">
              {user?.companyName ? `${user.companyName} · ` : ''}
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Staff User' : 'User'} • {user?.email || user?.mobileNumber || 'No email'}
            </p> */}
            {user?.isVerified && (
              <div className="admin-profile-header-chips">
                <div className="admin-profile-header-chip admin-profile-header-chip--verified">
                  <span>✓ Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload / feedback alerts */}
      {uploadError && (
        <div className="admin-profile-alert admin-profile-alert--danger pl-alert pl-alert--error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Upload Failed</strong>
            <p>{uploadError}</p>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="admin-profile-alert admin-profile-alert--success pl-alert pl-alert--success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Success!</strong>
            <p>{uploadSuccess}</p>
          </div>
        </div>
      )}


      <div className="admin-profile-grid">
        {/* Company Information */}
        <div className={`admin-profile-card ${expandedCards.includes('company') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('company')}>
            <div className="admin-profile-card-icon admin-profile-card-icon--company">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2>Company Information</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Company Name</span>
              <span className="admin-profile-info-value">{user?.companyName || 'Not available'}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Contact Person</span>
              <span className="admin-profile-info-value">{user?.contactPersonName || user?.name || 'Not available'}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Role</span>
              <span className="admin-profile-info-value">
                <span className="admin-profile-role-badge">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Staff' : 'User'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`admin-profile-card ${expandedCards.includes('contact') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('contact')}>
            <div className="admin-profile-card-icon admin-profile-card-icon--contact">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h2>Contact Information</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Email</span>
              <span className="admin-profile-info-value">{user?.email || 'Not available'}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Phone</span>
              <span className="admin-profile-info-value">{user?.phone || user?.mobileNumber || 'Not available'}</span>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className={`admin-profile-card ${expandedCards.includes('location') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('location')}>
            <div className="admin-profile-card-icon admin-profile-card-icon--location">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2>Location Details</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-info-grid">
              <div className="admin-profile-info-row">
                <span className="admin-profile-info-label">Country</span>
                <span className="admin-profile-info-value">{user?.country || 'Not available'}</span>
              </div>
              <div className="admin-profile-info-row">
                <span className="admin-profile-info-label">State</span>
                <span className="admin-profile-info-value">{user?.state || 'Not available'}</span>
              </div>
              <div className="admin-profile-info-row">
                <span className="admin-profile-info-label">City</span>
                <span className="admin-profile-info-value">{user?.city || 'Not available'}</span>
              </div>
              <div className="admin-profile-info-row">
                <span className="admin-profile-info-label">Pincode</span>
                <span className="admin-profile-info-value">{user?.pincode || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className={`admin-profile-card admin-profile-card--actions ${expandedCards.includes('actions') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('actions')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <h2>Quick Actions</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-actions-grid">
              <button className="admin-profile-action-btn admin-profile-action-btn--primary" onClick={() => navigate('/dashboard')}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Go to Dashboard
              </button>
              <button className="admin-profile-action-btn admin-profile-action-btn--secondary" onClick={() => navigate('/add-deal')}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add New Deal
              </button>
              <button className="admin-profile-action-btn admin-profile-action-btn--secondary" style={{marginBottom: 0}} onClick={() => navigate('/history')}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                View History
              </button>
              <button className="admin-profile-action-btn admin-profile-action-btn--upgrade" style={{marginBottom: 0}} onClick={() => setShowUpgradeModal(true)}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Upgrade Plan
              </button>
            </div>
          </div>
        </div> */}
      </div>


      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Remove Profile Picture Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="logout-modal-overlay" onClick={() => !isRemovingPicture && setShowRemoveConfirm(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon admin-profile-remove-icon">
              <svg width="28" height="28" fill="#dc2626" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="logout-modal-title">Remove Profile Picture?</h3>
            <p className="logout-modal-desc">Are you sure you want to remove your profile picture? This action cannot be undone.</p>
            <div className="logout-modal-actions">
              <button 
                className="logout-modal-btn logout-modal-btn--cancel" 
                onClick={() => setShowRemoveConfirm(false)}
                disabled={isRemovingPicture}
              >
                Cancel
              </button>
              <button 
                className="logout-modal-btn logout-modal-btn--confirm admin-profile-remove-confirm-btn" 
                onClick={handleRemoveProfilePicture}
                disabled={isRemovingPicture}
              >
                {isRemovingPicture ? (
                  <>
                    <span className="modal-spinner" /> Removing...
                  </>
                ) : (
                  'Yes, Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;