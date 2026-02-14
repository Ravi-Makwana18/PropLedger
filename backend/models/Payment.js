const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: [true, 'Deal ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide payment date'],
    default: Date.now
  },
  modeOfPayment: {
    type: String,
    required: [true, 'Please provide mode of payment'],
    enum: {
      values: ['NEFT', 'RTGS', 'CASH', 'CHEQUE', 'UPI', 'NA', 'OTHER'],
      message: '{VALUE} is not a valid payment mode'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Please provide payment amount'],
    min: [0, 'Amount cannot be negative']
  },
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
