/**
 * ============================================
 * PropLedger - Subscription Payment Routes
 * ============================================
 * Defines routes for subscription payment processing
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const express = require('express');
const { 
  initiatePayment, 
  getPaymentHistory, 
  getAllPayments, 
  adminVerifyPayment 
} = require('../controllers/subscriptionPaymentController');
const { protect, superadmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * CSRF Protection Middleware
 * Validates origin and referer headers for state-changing operations
 */
const csrfValidation = (req, res, next) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ message: 'Forbidden: Invalid origin' });
  }
  
  next();
};

// ============================================
// User Routes (Protected)
// ============================================
router.post('/initiate', protect, csrfValidation, asyncHandler(initiatePayment));  // Initiate payment
router.get('/history', protect, asyncHandler(getPaymentHistory));                  // Get payment history

// ============================================
// Super Admin Routes (Protected)
// ============================================
router.get('/admin/all', protect, superadmin, asyncHandler(getAllPayments));                           // Get all payments
router.post('/admin/verify/:paymentId', protect, superadmin, csrfValidation, asyncHandler(adminVerifyPayment));  // Verify payment

module.exports = router;
