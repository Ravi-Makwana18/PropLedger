const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  villageName: {
    type: String,
    required: [true, 'Please provide village name'],
    trim: true,
    index: true
  },
  surveyNumber: {
    type: String,
    required: [true, 'Please provide survey number'],
    trim: true,
    index: true
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
  },
  banakhatAmount: {
    type: Number
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate derived amounts before saving
dealSchema.pre('save', async function () {
  this.totalAmount = this.pricePerSqYard * this.totalSqYard;
  this.banakhatAmount = this.totalAmount * 0.25; // 25% of total amount
  this.whitePayment = (this.totalSqMeter || 0) * (this.jantri || 0);
});

// Compound index for search
dealSchema.index({ villageName: 1, surveyNumber: 1 });

module.exports = mongoose.model('Deal', dealSchema);
