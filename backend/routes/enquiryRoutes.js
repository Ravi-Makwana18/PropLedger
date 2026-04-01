/**
 * ============================================
 * PropLedger - Enquiry Routes
 * ============================================
 * Defines routes for customer enquiry management
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { 
  submitEnquiry, 
  getAllEnquiries, 
  markEnquiryRead, 
  getUnreadCount, 
  deleteEnquiry, 
  deleteAllEnquiries 
} = require('../controllers/enquiryController');
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Public Routes
// ============================================
router.post('/', asyncHandler(submitEnquiry));  // Submit enquiry (public)

// ============================================
// Admin Routes (Protected)
// ============================================
router.get('/all', protect, admin, asyncHandler(getAllEnquiries));           // Get all enquiries
router.get('/unread-count', protect, admin, asyncHandler(getUnreadCount));   // Get unread count
router.patch('/:id/read', protect, admin, asyncHandler(markEnquiryRead));    // Mark as read
router.delete('/all', protect, admin, asyncHandler(deleteAllEnquiries));     // Delete all
router.delete('/:id', protect, admin, asyncHandler(deleteEnquiry));          // Delete single

module.exports = router;
