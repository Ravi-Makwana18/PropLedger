/**
 * ============================================
 * PropLedger - Deal Model
 * ============================================
 * Defines the land deal schema with automatic calculations
 * Tracks property details, pricing, and payment deadlines
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Deal Schema Definition
 * Stores land deal information with automatic amount calculations
 */
const dealSchema = new mongoose.Schema({
  villageName: {
    type: String,
    required: [true, 'Please provide village name'],
    trim: true,
    index: true  // Indexed for faster search queries
  },
  surveyNumber: {
    type: String,
    required: [true, 'Please provide survey number'],
    trim: true,
    index: true  // Indexed for faster search queries
  },
  dealType: {
    type: String,
    enum: ['Buy', 'Sell', 'Other'],
    required: [true, 'Please specify deal type (Buy, Sell or Other)'],
    default: 'Buy'
  },
  pricePerSqYard: {
    type: Number,
    required: [true, 'Please provide price per sq. yard'],
    min: [0, 'Price cannot be negative']
  },
  totalSqYard: {
    type: Number,
    required: [true, 'Please provide total sq. yard'],
    min: [0, 'Area cannot be negative']
  },
  totalAmount: {
    type: Number
    // Calculated automatically in pre-save hook
  },
  banakhatAmount: {
    type: Number
    // Calculated as 25% of total amount in pre-save hook
  },
  totalSqMeter: {
    type: Number,
    min: [0, 'Area cannot be negative']
  },
  jantri: {
    type: Number,
    min: [0, 'Jantri cannot be negative']
  },
  whitePayment: {
    type: Number
    // Calculated from totalSqMeter * jantri in pre-save hook
  },
  deadlineStartDate: {
    type: Date,
    required: false
  },
  deadlineEndDate: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-save middleware
 * Automatically calculates derived amounts before saving
 * - totalAmount = pricePerSqYard * totalSqYard
 * - banakhatAmount = 25% of totalAmount
 * - whitePayment = totalSqMeter * jantri
 */
dealSchema.pre('save', async function () {
  this.totalAmount = this.pricePerSqYard * this.totalSqYard;
  this.banakhatAmount = this.totalAmount * 0.25; // 25% of total
  this.whitePayment = (this.totalSqMeter || 0) * (this.jantri || 0);
});

/**
 * Compound index for efficient search by village and survey number
 */
dealSchema.index({ villageName: 1, surveyNumber: 1 });

module.exports = mongoose.model('Deal', dealSchema);
