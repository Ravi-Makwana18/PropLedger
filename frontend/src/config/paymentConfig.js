/**
 * ============================================
 * PropLedger - Payment Configuration
 * ============================================
 * Configure your UPI payment details and subscription plans
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

export const PAYMENT_CONFIG = {
  /**
   * UPI Payment Details
   * Configure your UPI ID for payment collection via environment variable
   * Set REACT_APP_UPI_ID in your .env file
   */
  upi: {
    id: process.env.REACT_APP_UPI_ID || '',
    name: 'PropLedger',
    merchantCode: 'PROPLEDGER'
  },

  /**
   * Subscription Plan Pricing (in INR)
   * Define pricing and features for each plan
   */
  plans: {
    '7-day-trial': {
      amount: 0,
      label: '7 Day Trial',
      duration: '7 days',
      features: ['Full access', 'All features', 'No credit card required']
    },
    'monthly': {
      amount: 999,
      label: 'Monthly Plan',
      duration: '30 days',
      features: ['Full access', 'All features', 'Cancel anytime']
    },
    'yearly': {
      amount: 9999,
      label: 'Yearly Plan',
      duration: '365 days',
      features: ['Full access', 'All features', 'Save 17%', 'Priority support']
    }
  },

  /**
   * Support Contact Information
   * Update with your actual support details
   */
  support: {
    email: 'support@propledger.com',
    phone: '+91-9999999999',
    whatsapp: '+91-9999999999'
  }
};

export default PAYMENT_CONFIG;
