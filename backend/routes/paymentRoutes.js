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
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.route('/')
  .get(protect, asyncHandler(getAllPayments))
  .post(protect, asyncHandler(addPayment));

// /history must be before /:id so Express doesn't match "history" as an id param
router.get('/history', protect, asyncHandler(getPaymentHistory));

router.get('/deal/:dealId', protect, asyncHandler(getPaymentsByDeal));

router.route('/:id')
  .put(protect, admin, asyncHandler(updatePayment))
  .delete(protect, admin, asyncHandler(deletePayment));

module.exports = router;

