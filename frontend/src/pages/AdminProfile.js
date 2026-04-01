import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import ImageCropModal from '../components/ImageCropModal';
import API from '../api/axios';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemovingPicture, setIsRemovingPicture] = useState(false);
  const [expandedCards, setExpandedCards] = useState([]); // Default all cards closed for mobile

  // Toggle card expansion for mobile
  const toggleCard = (cardId) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not available';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining(user?.subscriptionEndDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && user?.subscriptionStatus === 'active';
  const isExpired = user?.subscriptionStatus === 'expired' || (user?.subscriptionStatus === 'active' && daysRemaining !== null && daysRemaining <= 0);

  // Get subscription badge color
  const getSubscriptionBadge = (plan) => {
    switch(plan) {
      case '7-day-trial':
        return { label: '7 Day Trial', color: '#10b981', bg: '#d1fae5' };
      case 'monthly':
        return { label: 'Monthly Plan', color: '#f59e0b', bg: '#fef3c7' };
      case 'yearly':
        return { label: 'Yearly Plan', color: '#8b5cf6', bg: '#ede9fe' };
      default:
        return { label: 'Unknown', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const subscriptionBadge = getSubscriptionBadge(user?.subscriptionPlan);

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      setUpgradeError('Please select a plan');
      return;
    }
    
    // Close plan selection modal and open payment modal
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (updatedUser) => {
    setUpgradeSuccess('Subscription upgraded successfully!');
    setShowPaymentModal(false);
    
    // Refresh user data
    window.location.reload();
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
      
      // Refresh page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
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
      
      // Refresh page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setUploadError(error.response?.data?.message || 'Failed to remove profile picture. Please try again.');
      setIsRemovingPicture(false);
      setShowRemoveConfirm(false);
    }
  };

  const plans = [
    { value: '7-day-trial', label: '7 Day Trial', price: 'Free', color: '#10b981', bg: '#d1fae5' },
    { value: 'monthly', label: 'Monthly Plan', price: '₹999/month', color: '#f59e0b', bg: '#fef3c7' },
    { value: 'yearly', label: 'Yearly Plan', price: '₹9,999/year', color: '#8b5cf6', bg: '#ede9fe', savings: 'Save 17%' }
  ];

  // Check if user has already used trial or is on a paid plan
  const hasUsedTrial = user?.subscriptionPlan === '7-day-trial' && user?.subscriptionStatus === 'expired';
  const isOnPaidPlan = user?.subscriptionPlan === 'monthly' || user?.subscriptionPlan === 'yearly';
  const cannotUseTrial = hasUsedTrial || isOnPaidPlan;

  return (
    <div className="admin-profile-page">
      {/* Header */}
      <div className="admin-profile-header">
        <button className="admin-profile-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
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
              style={{ display: 'none' }}
              disabled={isUploadingPicture}
            />
          </div>
          <div className="admin-profile-header-info">
            <h1 className="admin-profile-title">
              {user?.contactPersonName || user?.name || 'Administrator'}
            </h1>
            <p className="admin-profile-subtitle">
              {user?.role === 'admin' ? 'System Administrator' : 'User'} • {user?.email || user?.mobileNumber || 'No email'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {uploadError && (
        <div className="admin-profile-alert admin-profile-alert--danger">
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
        <div className="admin-profile-alert admin-profile-alert--success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Success!</strong>
            <p>{uploadSuccess}</p>
          </div>
        </div>
      )}

      {/* Subscription Status Alert */}
      {isExpired && (
        <div className="admin-profile-alert admin-profile-alert--danger">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Subscription Expired</strong>
            <p>Your subscription has expired. Please renew to continue using all features.</p>
          </div>
        </div>
      )}

      {isExpiringSoon && (
        <div className="admin-profile-alert admin-profile-alert--warning">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Subscription Expiring Soon</strong>
            <p>Your subscription expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Renew now to avoid interruption.</p>
          </div>
        </div>
      )}

      <div className="admin-profile-grid">
        {/* Company Information */}
        <div className={`admin-profile-card ${expandedCards.includes('company') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('company')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
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
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`admin-profile-card ${expandedCards.includes('contact') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('contact')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h2>Location Details</h2>
          </div>
          <div className="admin-profile-card-content">
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

        {/* Subscription Information */}
        <div className={`admin-profile-card admin-profile-card--highlight ${expandedCards.includes('subscription') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('subscription')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <h2>Subscription Details</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Current Plan</span>
              <span className="admin-profile-info-value">
                <span 
                  className="admin-profile-plan-badge" 
                  style={{ 
                    backgroundColor: subscriptionBadge.bg, 
                    color: subscriptionBadge.color 
                  }}
                >
                  {subscriptionBadge.label}
                </span>
              </span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Status</span>
              <span className="admin-profile-info-value">
                <span className={`admin-profile-status-badge admin-profile-status-badge--${user?.subscriptionStatus || 'active'}`}>
                  {user?.subscriptionStatus === 'active' ? '✓ Active' : 
                   user?.subscriptionStatus === 'expired' ? '✗ Expired' : 
                   user?.subscriptionStatus === 'cancelled' ? '⊘ Cancelled' : 'Unknown'}
                </span>
              </span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Start Date</span>
              <span className="admin-profile-info-value">{formatDate(user?.subscriptionStartDate)}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">End Date</span>
              <span className="admin-profile-info-value">{formatDate(user?.subscriptionEndDate)}</span>
            </div>
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="admin-profile-info-row">
                <span className="admin-profile-info-label">Days Remaining</span>
                <span className="admin-profile-info-value">
                  <strong style={{ color: isExpiringSoon ? '#f59e0b' : '#10b981' }}>
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className={`admin-profile-card ${expandedCards.includes('account') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('account')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <h2>Account Information</h2>
          </div>
          <div className="admin-profile-card-content">
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">User ID</span>
              <span className="admin-profile-info-value admin-profile-info-value--mono">{user?._id || 'Not available'}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Account Created</span>
              <span className="admin-profile-info-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Last Updated</span>
              <span className="admin-profile-info-value">{formatDate(user?.updatedAt)}</span>
            </div>
            <div className="admin-profile-info-row">
              <span className="admin-profile-info-label">Verification Status</span>
              <span className="admin-profile-info-value">
                <span className={`admin-profile-verify-badge ${user?.isVerified ? 'admin-profile-verify-badge--verified' : ''}`}>
                  {user?.isVerified ? '✓ Verified' : '○ Not Verified'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`admin-profile-card admin-profile-card--actions ${expandedCards.includes('actions') ? 'admin-profile-card--expanded' : ''}`}>
          <div className="admin-profile-card-header" onClick={() => toggleCard('actions')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <h2>Quick Actions</h2>
          </div>
          <div className="admin-profile-card-content">
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
            <button className="admin-profile-action-btn admin-profile-action-btn--secondary" onClick={() => navigate('/history')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              View History
            </button>
            <button className="admin-profile-action-btn admin-profile-action-btn--upgrade" onClick={() => setShowUpgradeModal(true)}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Subscription Modal */}
      {showUpgradeModal && (
        <div className="logout-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="logout-modal upgrade-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon" style={{ background: '#ede9fe' }}>
              <svg width="28" height="28" fill="#8b5cf6" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="logout-modal-title">Upgrade Subscription</h3>
            <p className="logout-modal-desc">Choose a plan that works best for you</p>
            
            {upgradeError && (
              <div className="upgrade-error" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {upgradeError}
              </div>
            )}
            
            {upgradeSuccess && (
              <div className="upgrade-success" style={{ background: '#d1fae5', color: '#059669', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ✓ {upgradeSuccess}
              </div>
            )}
            
            <div className="upgrade-plans">
              {plans.map(plan => {
                const isTrialDisabled = plan.value === '7-day-trial' && cannotUseTrial;
                return (
                  <div 
                    key={plan.value}
                    className={`upgrade-plan-card ${selectedPlan === plan.value ? 'selected' : ''} ${user?.subscriptionPlan === plan.value ? 'current' : ''} ${isTrialDisabled ? 'disabled' : ''}`}
                    onClick={() => !isTrialDisabled && setSelectedPlan(plan.value)}
                    style={{
                      border: selectedPlan === plan.value ? `2px solid ${plan.color}` : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: isTrialDisabled ? 'not-allowed' : 'pointer',
                      marginBottom: '0.75rem',
                      position: 'relative',
                      transition: 'all 0.2s',
                      opacity: isTrialDisabled ? 0.5 : 1
                    }}
                  >
                    {user?.subscriptionPlan === plan.value && (
                      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: plan.bg, color: plan.color, padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                        Current
                      </span>
                    )}
                    {plan.savings && !isTrialDisabled && (
                      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {plan.savings}
                      </span>
                    )}
                    {isTrialDisabled && (
                      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                        Not Available
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedPlan === plan.value ? plan.color : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPlan === plan.value && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: plan.color }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{plan.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: plan.color }}>{plan.price}</div>
                        {isTrialDisabled && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: '500' }}>
                            {hasUsedTrial ? 'Trial already used' : 'Upgrade only'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {cannotUseTrial && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  {hasUsedTrial ? 'Your trial period has ended. Please select a paid plan to continue.' : 'Trial is only available for new users. Please select a paid plan.'}
                </span>
              </div>
            )}
            
            <div className="logout-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button 
                className="logout-modal-btn logout-modal-btn--cancel" 
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="logout-modal-btn logout-modal-btn--confirm" 
                onClick={handleUpgrade} 
                disabled={!selectedPlan}
                style={{ background: selectedPlan ? '#8b5cf6' : '#d1d5db' }}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlan('');
        }}
        selectedPlan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />

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
            <div className="logout-modal-icon" style={{ background: '#fee2e2' }}>
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
                className="logout-modal-btn logout-modal-btn--confirm" 
                onClick={handleRemoveProfilePicture}
                disabled={isRemovingPicture}
                style={{ background: '#dc2626' }}
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
