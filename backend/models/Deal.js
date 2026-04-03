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
  district: {
    type: String,
    required: [true, 'Please provide district name'],
    trim: true,
    index: true
  },
  subDistrict: {
    type: String,
    required: [true, 'Please provide sub-district name'],
    trim: true,
    index: true
  },
  villageName: {
    type: String,
    required: [true, 'Please provide village name'],
    trim: true,
    index: true  // Indexed for faster search queries
  },
  oldSurveyNo: {
    type: String,
    trim: true
  },
  newSurveyNo: {
    type: String,
    required: [true, 'Please provide new survey number'],
    trim: true,
    index: true
  },
  surveyNumber: {
    type: String,
    trim: true,
    index: true  // Keep for backward compatibility
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
    // Calculated from totalSqMeter * jantri in pre-save hook (after TDS if applicable)
  },
  whitePaymentBeforeTDS: {
    type: Number
    // Original white payment before TDS deduction
  },
  tdsAmount: {
    type: Number,
    default: 0
    // 1% TDS if white payment exceeds 50,00,000
  },
  notes: {
    type: String,
    trim: true,
    default: ''
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
    required: true,
    index: true  // Index for faster user-specific queries
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
 * - whitePaymentBeforeTDS = totalSqMeter * jantri
 * - If whitePaymentBeforeTDS >= 50,00,000 then deduct 1% TDS
 * - whitePayment = whitePaymentBeforeTDS - tdsAmount
 * - surveyNumber = newSurveyNo (for backward compatibility)
 */
dealSchema.pre('save', async function () {
  this.totalAmount = this.pricePerSqYard * this.totalSqYard;
  this.banakhatAmount = this.totalAmount * 0.25; // 25% of total
  
  const calculatedWhitePayment = (this.totalSqMeter || 0) * (this.jantri || 0);
  this.whitePaymentBeforeTDS = calculatedWhitePayment;
  
  // Apply 1% TDS if white payment exceeds or equals 50,00,000
  if (calculatedWhitePayment >= 5000000) {
    this.tdsAmount = calculatedWhitePayment * 0.01;
    this.whitePayment = calculatedWhitePayment - this.tdsAmount;
  } else {
    this.tdsAmount = 0;
    this.whitePayment = calculatedWhitePayment;
  }
  
  // Set surveyNumber from newSurveyNo for backward compatibility
  if (this.newSurveyNo) {
    this.surveyNumber = String(this.newSurveyNo);
  }
});

/**
 * Compound indexes for efficient queries
 */
dealSchema.index({ villageName: 1, newSurveyNo: 1 });
dealSchema.index({ district: 1, subDistrict: 1 });
dealSchema.index({ createdBy: 1, createdAt: -1 });  // For sorted user queries

module.exports = mongoose.model('Deal', dealSchema);
