/**
 * ============================================
 * PropLedger - Deal Model
 * ============================================
 * Defines the land deal schema with automatic calculations.
 * Tracks property details, pricing, and payment deadlines.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Deal Schema Definition
 * Stores land deal information with automatic amount calculations.
 */
const dealSchema = new mongoose.Schema({
  dealDate: {
    type: Date,
  },
  district: {
    type: String,
    required: [true, 'Please provide district name'],
    trim: true,
    index: true,
  },
  subDistrict: {
    type: String,
    required: [true, 'Please provide sub-district name'],
    trim: true,
    index: true,
  },
  villageName: {
    type: String,
    required: [true, 'Please provide village name'],
    trim: true,
    index: true,
  },
  oldSurveyNo: {
    type: String,
    trim: true,
  },
  newSurveyNo: {
    type: String,
    required: [true, 'Please provide new survey number'],
    trim: true,
    index: true,
  },
  surveyNumber: {
    type: String,
    trim: true,
    index: true,
  },
  dealType: {
    type: String,
    enum: ['Buy', 'Sell', 'Other'],
    required: [true, 'Please specify deal type (Buy, Sell or Other)'],
    default: 'Buy',
  },
  brokerName: {
    type: String,
    trim: true,
    default: '',
  },
  naType: {
    type: String,
    enum: ['Residential', 'Industrial', 'Multi-purpose', ''],
    default: '',
  },
  pricePerSqYard: {
    type: Number,
    required: [true, 'Please provide price per sq. yard'],
    min: [0, 'Price cannot be negative'],
  },
  totalSqYard: {
    type: Number,
    required: [true, 'Please provide total sq. yard'],
    min: [0, 'Area cannot be negative'],
  },
  totalAmount: {
    type: Number,
    // Calculated automatically in pre-save hook
  },
  banakhatAmount: {
    type: Number,
    // Calculated as 25% of totalAmount in pre-save hook
  },
  totalSqMeter: {
    type: Number,
    min: [0, 'Area cannot be negative'],
  },
  jantri: {
    type: Number,
    min: [0, 'Jantri cannot be negative'],
  },
  whitePayment: {
    type: Number,
    // Calculated from totalSqMeter × jantri in pre-save hook (after TDS if applicable)
  },
  whitePaymentBeforeTDS: {
    type: Number,
    // Original white payment before TDS deduction
  },
  tdsAmount: {
    type: Number,
    default: 0,
    // 1% TDS if white payment >= 50,00,000
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  additionalExpenses: {
    buyBrokeringPercent: {
      type: Number,
      min: [0, 'Buy brokering % cannot be negative'],
      default: 0,
    },
    sellCpIncentiveRate: {
      type: Number,
      min: [0, 'Sell C.P. incentive rate cannot be negative'],
      default: 0,
    },
    planpassRatePerSqMtr: {
      type: Number,
      min: [0, 'Planpass rate cannot be negative'],
      default: 0,
    },
    naRatePerSqMtr: {
      type: Number,
      min: [0, 'NA rate cannot be negative'],
      default: 0,
    },
  },
  addMoreEntries: [{
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot be more than 100'],
    },
    date: {
      type: Date,
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
  }],
  deadlineStartDate: {
    type: Date,
  },
  deadlineEndDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Pre-save middleware
 * Synchronously calculates all derived amounts before saving.
 *
 * Calculations:
 *   totalAmount          = pricePerSqYard × totalSqYard
 *   banakhatAmount       = 25% of totalAmount
 *   whitePaymentBeforeTDS = totalSqMeter × jantri
 *   tdsAmount            = 1% of whitePaymentBeforeTDS if >= 50,00,000 else 0
 *   whitePayment         = whitePaymentBeforeTDS − tdsAmount
 *   surveyNumber         = newSurveyNo (kept in sync)
 */
dealSchema.pre('save', function () {
  this.totalAmount = this.pricePerSqYard * this.totalSqYard;
  this.banakhatAmount = this.totalAmount * 0.25;

  const calculatedWhitePayment = (this.totalSqMeter || 0) * (this.jantri || 0);
  this.whitePaymentBeforeTDS = calculatedWhitePayment;

  // Apply 1% TDS if white payment equals or exceeds ₹50,00,000
  if (calculatedWhitePayment >= 5000000) {
    this.tdsAmount = calculatedWhitePayment * 0.01;
    this.whitePayment = calculatedWhitePayment - this.tdsAmount;
  } else {
    this.tdsAmount = 0;
    this.whitePayment = calculatedWhitePayment;
  }

  // Keep surveyNumber aligned with newSurveyNo
  if (this.newSurveyNo) {
    this.surveyNumber = String(this.newSurveyNo);
  }
});

/**
 * Compound indexes for efficient queries
 */
dealSchema.index({ villageName: 1, newSurveyNo: 1 });
dealSchema.index({ district: 1, subDistrict: 1 });
dealSchema.index({ createdBy: 1, createdAt: -1 }); // Covers aggregation $match + $sort
dealSchema.index({ createdBy: 1, dealType: 1, createdAt: -1 }); // Covers deal-type filtered dashboard

module.exports = mongoose.model('Deal', dealSchema);
