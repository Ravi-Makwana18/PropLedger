import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';

const SubscriptionExpiredPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    localStorage.removeItem('subscriptionExpired');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('subscriptionExpired');
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="40" height="40" fill="#dc2626" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.5rem', color: '#111827' }}>
          Subscription Expired
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
          Your subscription has expired. Please renew to continue using PropLedger.
        </p>

        {/* User Info */}
        {user && (
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Account</div>
            <div style={{ fontWeight: '600', color: '#111827' }}>{user.companyName || user.email}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Expired on: {user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        )}

        {/* Plans */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Choose a Plan</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Monthly Plan */}
            <div 
              onClick={() => handleUpgrade('monthly')}
              onMouseEnter={() => setHoveredPlan('monthly')}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{ 
                border: hoveredPlan === 'monthly' ? '2px solid #8b5cf6' : '2px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '1rem', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#111827' }}>Monthly Plan</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>30 days access</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>₹999</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per month</div>
                </div>
              </div>
            </div>

            {/* Yearly Plan */}
            <div 
              onClick={() => handleUpgrade('yearly')}
              onMouseEnter={() => setHoveredPlan('yearly')}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{ 
                border: hoveredPlan === 'yearly' ? '2px solid #8b5cf6' : '2px solid #8b5cf6', 
                borderRadius: '12px', 
                padding: '1rem', 
                cursor: 'pointer',
                background: '#f3e8ff',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                SAVE 17%
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#111827' }}>Yearly Plan</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>365 days access</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>₹9,999</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per year</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#6b7280',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '8px',
              background: '#8b5cf6',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Renew Now
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default SubscriptionExpiredPage;
