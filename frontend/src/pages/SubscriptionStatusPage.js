import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './SubscriptionStatusPage.css';

const SubscriptionStatusPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgradeClick = () => {
    // If subscription is active (including trial), show modal
    if (user?.subscriptionStatus === 'active') {
      setShowUpgradeModal(true);
      return;
    }
    // If expired, redirect to upgrade page
    navigate('/subscription-expired');
  };

  useEffect(() => {
    fetchPaymentHistory();
    
    // Only poll if there's a pending payment
    const hasPendingPayment = payments.length > 0 && payments[0]?.paymentStatus === 'pending';
    
    if (hasPendingPayment) {
      const interval = setInterval(fetchPaymentHistory, 10000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  useEffect(() => {
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const { data } = await API.get('/api/subscription-payment/history');
      setPayments(data.payments || []);
      await refreshUser();
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#d1fae5', color: '#065f46', icon: '✓' };
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳' };
      case 'failed':
        return { bg: '#fee2e2', color: '#991b1b', icon: '✗' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', icon: '?' };
    }
  };

  const getPlanLabel = (plan) => {
    const labels = {
      '7-day-trial': '7 Day Trial',
      'monthly': 'Monthly Plan',
      'yearly': 'Yearly Plan'
    };
    return labels[plan] || plan;
  };

  const latestPayment = payments[0];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="db-skeleton-search" />
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="deal-card">
              <div className="db-skeleton-line" style={{ height: 18, width: '60%', marginBottom: 12 }} />
              <div className="db-skeleton-line" style={{ height: 14, width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-status-page">
      {/* Hero Section */}
      <div className="subscription-hero">
        <div className="subscription-hero-content">
          <div className="subscription-hero-badge">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Subscription Management
          </div>
          <h1 className="subscription-hero-title">Your Subscription</h1>
          <p className="subscription-hero-desc">Manage your plan and view payment history</p>
        </div>
      </div>

      {/* Current Subscription Card */}
      <div className="subscription-current-card">
        <div className="subscription-card-header">
          <div className="subscription-card-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="subscription-card-title">Current Plan</h2>
            <p className="subscription-card-subtitle">Your active subscription details</p>
          </div>
        </div>
        
        <div className="subscription-plan-details">
          <div className="subscription-plan-main">
            <div className="subscription-plan-name">
              {getPlanLabel(user?.subscriptionPlan)}
            </div>
            <div className={`subscription-status-badge subscription-status-badge--${user?.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
              {user?.subscriptionStatus === 'active' ? (
                <>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Active
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" clipRule="evenodd" />
                  </svg>
                  Inactive
                </>
              )}
            </div>
          </div>

          <div className="subscription-info-grid">
            <div className="subscription-info-item">
              <div className="subscription-info-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="subscription-info-label">Valid Until</div>
                <div className="subscription-info-value">
                  {user?.subscriptionEndDate 
                    ? new Date(user.subscriptionEndDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>

            {user?.subscriptionPlan === '7-day-trial' && (
              <div className="subscription-info-item">
                <div className="subscription-info-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="subscription-info-label">Trial Limit</div>
                  <div className="subscription-info-value">9 Deals Max</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleUpgradeClick}
            className="subscription-upgrade-btn"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {user?.subscriptionStatus === 'active' ? 'Manage Plan' : 'Upgrade Plan'}
          </button>
        </div>
      </div>

      {/* Active Subscription Modal */}
      {showUpgradeModal && (
        <div className="subscription-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="subscription-modal-icon subscription-modal-icon--info">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="subscription-modal-title">Active Subscription</h3>
            <p className="subscription-modal-desc">
              You already have an active {getPlanLabel(user?.subscriptionPlan)} subscription. 
              You can upgrade or change your plan after your current subscription expires on{' '}
              <strong>
                {user?.subscriptionEndDate 
                  ? new Date(user.subscriptionEndDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'N/A'}
              </strong>.
            </p>
            <div className="subscription-modal-info">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>You're enjoying all premium features until your subscription expires.</span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="subscription-modal-btn"
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      <div className="subscription-section">
        <div className="subscription-section-header">
          <div>
            <h2 className="subscription-section-title">Payment History</h2>
            <p className="subscription-section-subtitle">Track all your subscription payments</p>
          </div>
          <div className="subscription-payments-count">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            {payments.length} Payment{payments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Latest Payment Alert */}
        {latestPayment?.paymentStatus === 'pending' && (
          <div className="subscription-alert subscription-alert--pending">
            <div className="subscription-alert-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="subscription-alert-content">
              <div className="subscription-alert-title">Payment Under Review</div>
              <div className="subscription-alert-desc">
                Your payment of ₹{latestPayment.amount.toLocaleString('en-IN')} for {getPlanLabel(latestPayment.subscriptionPlan)} is being reviewed by admin. 
                You'll get access once approved. This usually takes a few hours.
              </div>
            </div>
          </div>
        )}

        {/* Payment Cards */}
        {payments.length === 0 ? (
          <div className="subscription-empty-state">
            <div className="subscription-empty-icon">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="subscription-empty-title">No Payment History</h3>
            <p className="subscription-empty-desc">You haven't made any payments yet. Start by choosing a plan.</p>
            <button
              onClick={() => navigate('/subscription-expired')}
              className="subscription-empty-btn"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Make Your First Payment
            </button>
          </div>
        ) : (
          <div className="subscription-payments-grid">
            {payments.map((payment) => {
              const statusStyle = getStatusColor(payment.paymentStatus);
              return (
                <div key={payment._id} className="subscription-payment-card">
                  <div className="subscription-payment-header">
                    <div className="subscription-payment-info">
                      <div className="subscription-payment-plan">{getPlanLabel(payment.subscriptionPlan)}</div>
                      <div className="subscription-payment-date">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="subscription-payment-amount-section">
                      <div className="subscription-payment-amount">₹{payment.amount.toLocaleString('en-IN')}</div>
                      <span className="subscription-payment-status" style={{
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {statusStyle.icon} {payment.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="subscription-payment-details">
                    <div className="subscription-payment-detail-item">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="subscription-payment-detail-label">Transaction ID</div>
                        <div className="subscription-payment-detail-value">{payment.transactionId}</div>
                      </div>
                    </div>
                    
                    {payment.upiTransactionId && (
                      <div className="subscription-payment-detail-item">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="subscription-payment-detail-label">UPI Transaction ID</div>
                          <div className="subscription-payment-detail-value">{payment.upiTransactionId}</div>
                        </div>
                      </div>
                    )}
                    
                    {payment.verifiedAt && (
                      <div className="subscription-payment-detail-item">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="subscription-payment-detail-label">Verified On</div>
                          <div className="subscription-payment-detail-value">
                            {new Date(payment.verifiedAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div className="subscription-payment-notes">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="subscription-payment-notes-label">Admin Notes</div>
                        <div className="subscription-payment-notes-text">{payment.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatusPage;
