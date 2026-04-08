import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import PAYMENT_CONFIG from '../config/paymentConfig';
import { useAuth } from '../context/AuthContext';
import AppInput from './ui/AppInput';
import AppButton from './ui/AppButton';

const PaymentModal = ({ isOpen, onClose, selectedPlan, onSuccess }) => {
  useAuth();
  const [step, setStep] = useState(1); // 1: QR Code, 2: Upload Screenshot, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const currentPlan = PAYMENT_CONFIG.plans[selectedPlan];
  const upiId = PAYMENT_CONFIG.upi.id;

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setError('');
      setUpiTransactionId('');
      setScreenshot('');
      setTransactionId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (!currentPlan) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!upiTransactionId) {
      setError('Please enter UPI transaction ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/api/subscription-payment/initiate', {
        subscriptionPlan: selectedPlan,
        amount: currentPlan.amount,
        upiTransactionId,
        paymentScreenshot: screenshot
      });

      setTransactionId(data.transactionId);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
    // Don't refresh user here - subscription not active yet
    // User needs to wait for admin approval
    onSuccess && onSuccess();
    onClose();
  };

  if (!isOpen) return null;
  if (!currentPlan) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {step === 1 && (
          <>
            <div className="payment-modal-header">
              <div className="payment-modal-icon payment-modal-icon--qr">
                <svg width="28" height="28" fill="#8b5cf6" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                  <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                </svg>
              </div>
              <h3 className="payment-modal-title">Scan QR Code to Pay</h3>
              <p className="payment-modal-desc">Pay using any UPI app</p>
            </div>

            <div className="payment-plan-summary">
              <div className="payment-plan-row">
                <span>Plan</span>
                <strong>{currentPlan?.label}</strong>
              </div>
              <div className="payment-plan-row payment-plan-total">
                <span>Amount to Pay</span>
                <strong className="payment-plan-amount">₹{currentPlan?.amount}</strong>
              </div>
            </div>

            <div className="payment-qr-wrap">
              <img src="/upi-qr-code.png" alt="UPI QR Code" className="payment-qr-image" />
              <div className="payment-upi-box">
                <div className="payment-upi-label">Pay to UPI ID</div>
                <div className="payment-upi-id">{upiId}</div>
              </div>
            </div>

            <div className="payment-note-card">
              <div className="payment-note-text">
                <strong>📱 Steps:</strong>
                <ol className="payment-note-list">
                  <li>Open any UPI app (PhonePe, GPay, Paytm, etc.)</li>
                  <li>Scan the QR code above</li>
                  <li>Pay ₹{currentPlan?.amount}</li>
                  <li>Click "Next" below after payment</li>
                </ol>
              </div>
            </div>

            <div className="payment-modal-actions">
              <AppButton className="payment-modal-btn payment-modal-btn--cancel" onClick={onClose}>
                Cancel
              </AppButton>
              <AppButton
                className="payment-modal-btn payment-modal-btn--confirm"
                onClick={() => setStep(2)}
              >
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="payment-modal-header">
              <div className="payment-modal-icon payment-modal-icon--upload">
                <svg width="28" height="28" fill="#2563eb" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="payment-modal-title">Upload Payment Proof</h3>
              <p className="payment-modal-desc">Enter transaction details</p>
            </div>

            {error && (
              <div className="payment-error-banner">
                {error}
              </div>
            )}

            <div className="payment-field-group">
              <label className="payment-field-label">
                UPI Transaction ID <span className="payment-required">*</span>
              </label>
              <AppInput
                className="payment-form-input"
                type="text"
                placeholder="e.g., 123456789012"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
              />
              <small className="payment-field-help">Enter the 12-digit transaction ID from your UPI app</small>
            </div>

            <div className="payment-field-group">
              <label className="payment-field-label">
                Payment Screenshot (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="app-input payment-file-input"
              />
              {screenshot && (
                <img src={screenshot} alt="Preview" className="payment-screenshot-preview" />
              )}
            </div>

            <div className="payment-modal-actions">
              <AppButton className="payment-modal-btn payment-modal-btn--cancel" onClick={() => setStep(1)} disabled={loading}>
                Back
              </AppButton>
              <AppButton
                className="payment-modal-btn payment-modal-btn--confirm payment-modal-btn--success"
                onClick={handleSubmitPayment}
                disabled={loading}
              >
                {loading ? <><span className="modal-spinner" /> Submitting...</> : 'Submit for Approval'}
              </AppButton>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="payment-modal-header">
              <div className="payment-modal-icon payment-modal-icon--success">
                <svg width="28" height="28" fill="#10b981" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="payment-modal-title">Payment Submitted!</h3>
              <p className="payment-modal-desc">Waiting for admin approval</p>
            </div>

            <div className="payment-note-card">
              <div className="payment-note-text">
                <strong>⏳ What's Next?</strong>
                <p className="payment-note-paragraph">
                  Your payment is under review. You'll receive access once the admin approves your payment. This usually takes a few minutes.
                </p>
              </div>
            </div>

            <div className="payment-success-details">
              <div className="payment-success-row">
                <span>Transaction ID</span>
                <strong className="payment-txn-id">{transactionId}</strong>
              </div>
              <div className="payment-success-row">
                <span>Plan</span>
                <strong>{currentPlan?.label}</strong>
              </div>
              <div className="payment-success-row">
                <span>Amount</span>
                <strong className="payment-success-amount">₹{currentPlan?.amount}</strong>
              </div>
            </div>

            <div className="payment-modal-actions">
              <AppButton
                className="payment-modal-btn payment-modal-btn--confirm payment-modal-btn--success payment-modal-btn--block"
                onClick={handleDone}
              >
                Done
              </AppButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
