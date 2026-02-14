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
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.route('/')
  .get(protect, asyncHandler(getDeals))
  .post(protect, admin, asyncHandler(createDeal));

router.get('/search', protect, asyncHandler(searchDeals));

router.route('/:id')
  .get(protect, asyncHandler(getDealById))
  .put(protect, admin, asyncHandler(updateDeal))
  .delete(protect, admin, asyncHandler(deleteDeal));

module.exports = router;
