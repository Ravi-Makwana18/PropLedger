/**
 * ============================================
 * PropLedger - Subscription Payment Controller
 * ============================================
 * Handles subscription payment processing and verification
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const SubscriptionPayment = require('../models/SubscriptionPayment');
const User = require('../models/User');

// Subscription plan duration calculators
const PLAN_DURATION = {
  '7-day-trial': (d) => d.setDate(d.getDate() + 7),
  'monthly': (d) => d.setMonth(d.getMonth() + 1),
  'yearly': (d) => d.setFullYear(d.getFullYear() + 1)
};

/**
 * @desc    Initiate manual UPI payment
 * @route   POST /api/subscription-payment/initiate
 * @access  Private
 */
const initiatePayment = async (req, res) => {
  const { subscriptionPlan, amount, upiTransactionId, paymentScreenshot } = req.body;

  if (!subscriptionPlan || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid subscription plan and amount required' });
  }

  const validPlans = ['7-day-trial', 'monthly', 'yearly'];
  if (!validPlans.includes(subscriptionPlan)) {
    return res.status(400).json({ message: 'Invalid subscription plan' });
  }

  // Validate amount matches plan
  const expectedAmounts = {
    '7-day-trial': 0,
    'monthly': 999,
    'yearly': 9999
  };
  
  if (amount !== expectedAmounts[subscriptionPlan]) {
    return res.status(400).json({ message: 'Invalid amount for selected plan' });
  }

  const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

  const payment = await SubscriptionPayment.create({
    userId: req.user._id,
    subscriptionPlan,
    amount,
    transactionId,
    upiTransactionId,
    paymentScreenshot,
    paymentStatus: 'pending'
  });

  // DO NOT activate subscription here - wait for admin approval

  res.json({
    success: true,
    transactionId: payment.transactionId,
    message: 'Payment submitted. Waiting for admin approval.'
  });
};

/**
 * @desc    Get payment history for current user
 * @route   GET /api/subscription-payment/history
 * @access  Private
 */
const getPaymentHistory = async (req, res) => {
  const payments = await SubscriptionPayment.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, payments });
};

/**
 * @desc    Get all subscription payments (Admin)
 * @route   GET /api/subscription-payment/admin/all
 * @access  Private/SuperAdmin
 */
const getAllPayments = async (req, res) => {
  const { status } = req.query;
  const query = status ? { paymentStatus: status } : {};

  const payments = await SubscriptionPayment.find(query)
    .populate('userId', 'contactPersonName email companyName phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
};

/**
 * @desc    Approve or reject subscription payment (Admin)
 * @route   POST /api/subscription-payment/admin/verify/:paymentId
 * @access  Private/SuperAdmin
 */
const adminVerifyPayment = async (req, res) => {
  const { approve, notes } = req.body;
  const payment = await SubscriptionPayment.findById(req.params.paymentId);

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (payment.paymentStatus === 'completed') {
    return res.status(400).json({ message: 'Payment already verified' });
  }

  if (approve) {
    // ONLY activate subscription when admin approves
    payment.paymentStatus = 'completed';
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    if (notes) payment.notes = notes;
    await payment.save();

    // Activate subscription for the user
    const endDate = new Date();
    PLAN_DURATION[payment.subscriptionPlan](endDate);

    await User.findByIdAndUpdate(payment.userId, {
      subscriptionPlan: payment.subscriptionPlan,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate
    });

    res.json({ 
      success: true, 
      message: 'Payment approved and subscription activated successfully' 
    });
  } else {
    // Reject payment - do NOT activate subscription
    payment.paymentStatus = 'failed';
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.notes = notes || 'Rejected by admin';
    await payment.save();

    res.json({ 
      success: true, 
      message: 'Payment rejected. Subscription not activated.' 
    });
  }
};

module.exports = { initiatePayment, getPaymentHistory, getAllPayments, adminVerifyPayment };
