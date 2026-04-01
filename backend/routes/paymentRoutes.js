/**
 * ============================================
 * PropLedger - Payment Routes
 * ============================================
 * Defines routes for payment tracking and management
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsByDeal,
  getAllPayments,
  getPaymentHistory,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect, admin, requirePremium } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Base Routes: /api/payments
// ============================================
router.route('/')
  .get(protect, asyncHandler(getAllPayments))                    // Get all payments
  .post(protect, requirePremium, asyncHandler(addPayment));      // Add payment (premium required)

// ============================================
// Special Routes (Must be before /:id)
// ============================================
router.get('/history', protect, asyncHandler(getPaymentHistory));        // Get payment history
router.get('/deal/:dealId', protect, asyncHandler(getPaymentsByDeal));   // Get payments by deal

// ============================================
// Individual Payment Routes: /api/payments/:id
// ============================================
router.route('/:id')
  .put(protect, admin, requirePremium, asyncHandler(updatePayment))    // Update payment (admin + premium)
  .delete(protect, admin, requirePremium, asyncHandler(deletePayment)); // Delete payment (admin + premium)

module.exports = router;
