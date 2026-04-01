/**
 * ============================================
 * PropLedger - Enquiry Model
 * ============================================
 * Defines the customer enquiry schema
 * Tracks customer inquiries and their read status
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Enquiry Schema Definition
 * Stores customer inquiries from the website
 */
const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
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
