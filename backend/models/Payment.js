/**
 * ============================================
 * PropLedger - Payment Model
 * ============================================
 * Tracks payments made for land deals
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Payment Schema Definition
 * Stores payment transactions linked to deals
 */
const paymentSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: [true, 'Deal reference is required'],
    index: true  // Indexed for faster queries by deal
  },
  date: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  modeOfPayment: {
    type: String,
    enum: {
      values: ['Bank', 'Other'],
      message: '{VALUE} is not a valid payment mode'
    },
    required: [true, 'Payment mode is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentType: {
    type: String,
    enum: ['white', 'total'],
    default: function() {
      return this.modeOfPayment === 'Bank' ? 'white' : 'total';
    }
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt
});

// Compound index for efficient queries by deal and user
paymentSchema.index({ dealId: 1, createdBy: 1 });
// Index for payment history sorted by date (most common query pattern)
paymentSchema.index({ createdAt: -1 });
// Compound index covering payment history filter + sort in one pass
paymentSchema.index({ dealId: 1, createdAt: -1 });
// Index for sorted queries on a single deal (getPaymentsByDeal)
paymentSchema.index({ dealId: 1, date: -1 });
// Index for filtering payments by creator (admin/manager scoped queries)
paymentSchema.index({ createdBy: 1 });
// Covers getPaymentHistory when modeOfPayment filter is active (Bank / Other)
paymentSchema.index({ dealId: 1, modeOfPayment: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
