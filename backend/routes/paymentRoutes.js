const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsByDeal,
  getAllPayments,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.route('/')
  .get(protect, asyncHandler(getAllPayments))
  .post(protect, asyncHandler(addPayment));

router.get('/deal/:dealId', protect, asyncHandler(getPaymentsByDeal));

router.route('/:id')
  .put(protect, admin, asyncHandler(updatePayment))
  .delete(protect, admin, asyncHandler(deletePayment));

module.exports = router;
