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

// Calculate total amount and banakhat amount before saving
dealSchema.pre('save', async function() {
  this.totalAmount = this.pricePerSqYard * this.totalSqYard;
  this.banakhatAmount = this.totalAmount * 0.25; // 25% of total amount
});

// Compound index for search
dealSchema.index({ villageName: 1, surveyNumber: 1 });

module.exports = mongoose.model('Deal', dealSchema);
