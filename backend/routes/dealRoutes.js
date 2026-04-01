/**
 * ============================================
 * PropLedger - Deal Routes
 * ============================================
 * Defines routes for land deal management
 * 
 * @author PropLedger Development Team
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
const { protect, admin, requirePremium } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Base Routes: /api/deals
// ============================================
router.route('/')
  .get(protect, asyncHandler(getDeals))                              // Get all deals
  .post(protect, admin, requirePremium, asyncHandler(createDeal));   // Create deal (admin + premium)

// ============================================
// Search Route
// ============================================
router.get('/search', protect, asyncHandler(searchDeals));  // Search deals by village/survey

// ============================================
// Individual Deal Routes: /api/deals/:id
// ============================================
router.route('/:id')
  .get(protect, asyncHandler(getDealById))                          // Get deal by ID
  .put(protect, admin, requirePremium, asyncHandler(updateDeal))    // Update deal (admin + premium)
  .delete(protect, admin, requirePremium, asyncHandler(deleteDeal)); // Delete deal (admin + premium)

module.exports = router;
