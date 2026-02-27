const Payment = require('../models/Payment');
const Deal = require('../models/Deal');

// @desc    Add payment
// @route   POST /api/payments
// @access  Private
const addPayment = async (req, res) => {
  try {
    const { dealId, date, modeOfPayment, amount, remarks } = req.body;

    // Check if deal exists (lean — no Mongoose overhead)
    const dealExists = await Deal.exists({ _id: dealId });
    if (!dealExists) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const payment = await Payment.create({
      dealId,
      date,
      modeOfPayment,
      amount,
      remarks,
      createdBy: req.user._id
    });

    // Populate in-place on the same document (no second DB round trip)
    await payment.populate('createdBy', 'name');

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments for a deal
// @route   GET /api/payments/deal/:dealId
// @access  Private
const getPaymentsByDeal = async (req, res) => {
  try {
    const payments = await Payment.find({ dealId: req.params.dealId })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ payments, totalPaid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ date: -1 })
      .populate('dealId', 'villageName surveyNumber')
      .populate('createdBy', 'name');

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private/Admin
const updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, returnDocument: 'after' }
    ).populate('createdBy', 'name');

    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPayment,
  getPaymentsByDeal,
  getAllPayments,
  updatePayment,
  deletePayment
};
