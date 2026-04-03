/**
 * ============================================
 * PropLedger - Payment Model
 * ============================================
 * Tracks payments made for land deals
 * 
 * @author PropLedger Development Team
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

module.exports = mongoose.model('Payment', paymentSchema);
