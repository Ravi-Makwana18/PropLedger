/**
 * ============================================
 * PropLedger - Subscription Payment Model
 * ============================================
 * Tracks subscription payment transactions and verification status
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Subscription Payment Schema Definition
 * Stores subscription payment records with admin verification
 */
const subscriptionPaymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
    index: true
  },
  subscriptionPlan: {
    type: String,
    enum: {
      values: ['7-day-trial', 'monthly', 'yearly'],
      message: '{VALUE} is not a valid subscription plan'
    },
    required: [true, 'Subscription plan is required']
  },
  amount: { 
    type: Number, 
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: { 
    type: String, 
    default: 'INR',
    uppercase: true
  },
  transactionId: { 
    type: String, 
    required: [true, 'Transaction ID is required'], 
    unique: true,
    index: true
  },
  upiTransactionId: { 
    type: String,
    trim: true
  },
  paymentScreenshot: { 
    type: String,  // Base64 or URL
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'pending',
    index: true
  },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: { 
    type: Date 
  },
  notes: { 
    type: String,
    trim: true
  }
}, { 
  timestamps: true  // Automatically add createdAt and updatedAt
});

// Compound index for efficient queries
subscriptionPaymentSchema.index({ userId: 1, paymentStatus: 1 });

module.exports = mongoose.models.SubscriptionPayment ||
  mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
