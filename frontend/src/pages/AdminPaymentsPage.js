import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import './AdminPaymentsPage.css';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await API.get(`/api/subscription-payment/admin/all${query}`);
      setPayments(data.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId, approve) => {
    if (!window.confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this payment?`)) {
      return;
    }

    try {
      await API.post(`/api/subscription-payment/admin/verify/${paymentId}`, { approve });
      alert(`Payment ${approve ? 'approved' : 'rejected'} successfully`);
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify payment');
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

  if (loading) {
    return (
      <div className="admin-payments-page">
        <div className="admin-payments-section">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-payments-page">
      {/* Hero Section */}
      <div className="admin-payments-hero">
        <div className="admin-payments-hero-content">
          <div className="admin-payments-hero-badge">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            Payment Management
          </div>
          <h1 className="admin-payments-hero-title">Subscription Payments</h1>
          <p className="admin-payments-hero-desc">Review and approve user subscription payments</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="admin-payments-filters">
        {['all', 'pending', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`admin-payments-filter-btn ${filter === status ? 'admin-payments-filter-btn--active' : ''}`}
          >
            {status === 'pending' && '⏳'}
            {status === 'completed' && '✓'}
            {status === 'failed' && '✗'}
            {status === 'all' && '📋'}
            {' '}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Payments Section */}
      <div className="admin-payments-section">
        {payments.length === 0 ? (
          <div className="admin-payments-empty">
            <div className="admin-payments-empty-icon">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="admin-payments-empty-title">No Payments Found</h3>
            <p className="admin-payments-empty-desc">There are no {filter !== 'all' ? filter : ''} payments to display.</p>
          </div>
        ) : (
          <div className="admin-payments-grid">
            {payments.map((payment) => {
              const statusStyle = getStatusColor(payment.paymentStatus);
              return (
                <div key={payment._id} className="admin-payment-card">
                  <div className="admin-payment-card-header">
                    <div className="admin-payment-user-info">
                      <div className="admin-payment-user-name">
                        {payment.userId?.companyName || payment.userId?.contactPersonName || 'N/A'}
                      </div>
                      <div className="admin-payment-user-email">
                        {payment.userId?.email || 'N/A'}
                      </div>
                    </div>
                    <span className="admin-payment-status-badge" style={{
                      background: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {statusStyle.icon} {payment.paymentStatus}
                    </span>
                  </div>

                  <div className="admin-payment-details">
                    <div className="admin-payment-detail-item">
                      <div className="admin-payment-detail-label">Plan</div>
                      <div className="admin-payment-detail-value">{getPlanLabel(payment.subscriptionPlan)}</div>
                    </div>
                    <div className="admin-payment-detail-item">
                      <div className="admin-payment-detail-label">Amount</div>
                      <div className="admin-payment-amount">₹{payment.amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="admin-payment-detail-item">
                      <div className="admin-payment-detail-label">Transaction ID</div>
                      <div className="admin-payment-detail-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {payment.transactionId}
                      </div>
                    </div>
                    <div className="admin-payment-detail-item">
                      <div className="admin-payment-detail-label">UPI Txn ID</div>
                      <div className="admin-payment-detail-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {payment.upiTransactionId || 'N/A'}
                      </div>
                    </div>
                    <div className="admin-payment-detail-item">
                      <div className="admin-payment-detail-label">Date</div>
                      <div className="admin-payment-detail-value">
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    {payment.verifiedAt && (
                      <div className="admin-payment-detail-item">
                        <div className="admin-payment-detail-label">Verified On</div>
                        <div className="admin-payment-detail-value">
                          {new Date(payment.verifiedAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>

                  {payment.paymentStatus === 'pending' && (
                    <div className="admin-payment-actions">
                      <button
                        onClick={() => handleVerify(payment._id, true)}
                        className="admin-payment-btn admin-payment-btn--approve"
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(payment._id, false)}
                        className="admin-payment-btn admin-payment-btn--reject"
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" clipRule="evenodd" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}

                  {payment.paymentScreenshot && (
                    <a
                      href={payment.paymentScreenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-payment-screenshot-link"
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ display: 'inline', marginRight: '0.5rem' }}>
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      View Payment Screenshot
                    </a>
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

export default AdminPaymentsPage;
