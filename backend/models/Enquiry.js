const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  enquiryType: {
    type: String,
    default: 'General Question',
    enum: ['Land Buying', 'Land Selling', 'N.A. File', 'Plot Enquiries', 'General Question'],
  },
  message: {
    type: String,
    required: false,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Enquiry', enquirySchema);
