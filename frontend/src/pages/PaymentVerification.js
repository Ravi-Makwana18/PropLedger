import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const PaymentVerification = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, all
  const [verifying, setVerifying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/subscription-payment/admin/all', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      setPayments(data.payments || []);
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId, approve = true) => {
    setVerifying(paymentId);
    setError('');
    setSuccess('');

    try {
      const { data } = await API.post(`/api/subscription-payment/admin/verify/${paymentId}`, {
        approve
      });

      setSuccess(approve ? 'Payment verified and subscription activated!' : 'Payment rejected');
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
      failed: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
      refunded: { bg: '#f3f4f6', color: '#374151', label: 'Refunded' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="payment-verification-page">
      {/* Header */}
      <div className="pv-header">
        <button className="pv-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <div className="pv-header-content">
          <h1 className="pv-title">Payment Verification</h1>
          <p className="pv-subtitle">Review and approve subscription payments</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="pv-alert pv-alert--error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="pv-alert pv-alert--success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="pv-filters">
        <button
          className={`pv-filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`pv-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`pv-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="pv-loading">
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="pv-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3>No {filter !== 'all' ? filter : ''} payments found</h3>
          <p>Payments will appear here when users make subscription purchases</p>
        </div>
      ) : (
        <div className="pv-list">
          {payments.map((payment) => (
            <div key={payment._id} className="pv-card">
              <div className="pv-card-header">
                <div className="pv-user-info">
                  <div className="pv-user-avatar">
                    {payment.userId?.contactPersonName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="pv-user-name">
                      {payment.userId?.contactPersonName || 'Unknown User'}
                    </h3>
                    <p className="pv-user-email">{payment.userId?.email || 'No email'}</p>
                  </div>
                </div>
                {getStatusBadge(payment.paymentStatus)}
              </div>

              <div className="pv-card-body">
                <div className="pv-info-grid">
                  <div className="pv-info-item">
                    <span className="pv-info-label">Plan</span>
                    <span className="pv-info-value">{payment.subscriptionPlan}</span>
                  </div>
                  <div className="pv-info-item">
                    <span className="pv-info-label">Amount</span>
                    <span className="pv-info-value pv-amount">₹{payment.amount}</span>
                  </div>
                  <div className="pv-info-item">
                    <span className="pv-info-label">Payment Method</span>
                    <span className="pv-info-value">{payment.paymentMethod}</span>
                  </div>
                  <div className="pv-info-item">
                    <span className="pv-info-label">Date</span>
                    <span className="pv-info-value">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>

                <div className="pv-transaction-id">
                  <span className="pv-info-label">Transaction ID</span>
                  <code>{payment.transactionId}</code>
                </div>

                {payment.upiId && (
                  <div className="pv-upi-id">
                    <span className="pv-info-label">UPI ID</span>
                    <span>{payment.upiId}</span>
                  </div>
                )}

                {payment.notes && (
                  <div className="pv-notes">
                    <span className="pv-info-label">Notes</span>
                    <p>{payment.notes}</p>
                  </div>
                )}
              </div>

              {payment.paymentStatus === 'pending' && (
                <div className="pv-card-actions">
                  <button
                    className="pv-action-btn pv-action-btn--reject"
                    onClick={() => handleVerifyPayment(payment._id, false)}
                    disabled={verifying === payment._id}
                  >
                    {verifying === payment._id ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    className="pv-action-btn pv-action-btn--approve"
                    onClick={() => handleVerifyPayment(payment._id, true)}
                    disabled={verifying === payment._id}
                  >
                    {verifying === payment._id ? (
                      <>
                        <span className="modal-spinner"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Approve & Activate
                      </>
                    )}
                  </button>
                </div>
              )}

              {payment.paymentStatus === 'completed' && payment.verifiedAt && (
                <div className="pv-verified-info">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified on {formatDate(payment.verifiedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
