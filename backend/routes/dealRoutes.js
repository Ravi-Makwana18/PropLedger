/**
 * ============================================
 * PropLedger - Deal Routes
 * ============================================
 * Defines routes for land deal management
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const {
  createDeal,
  getDeals,
  getDealById,
  searchDeals,
  updateDeal,
  deleteDeal
} = require('../controllers/dealController');
const { protect, adminOrManager } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Base Routes: /api/deals
// ============================================
router.route('/')
  .get(protect, asyncHandler(getDeals))                              // Get all deals
  .post(protect, adminOrManager, asyncHandler(createDeal));                   // Create deal (admin/manager)

// ============================================
// Search Route
// ============================================
router.get('/search', protect, asyncHandler(searchDeals));  // Search deals by village/survey

// ============================================
// Individual Deal Routes: /api/deals/:id
// ============================================
router.route('/:id')
  .get(protect, asyncHandler(getDealById))                          // Get deal by ID
  .put(protect, adminOrManager, asyncHandler(updateDeal))                    // Update deal (admin/manager)
  .delete(protect, adminOrManager, asyncHandler(deleteDeal));                 // Delete deal (admin/manager)

module.exports = router;
