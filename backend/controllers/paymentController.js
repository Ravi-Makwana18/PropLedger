/**
 * ============================================
 * PropLedger - Payment Controller
 * ============================================
 * Handles payment tracking and management operations
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const Payment = require('../models/Payment');
const Deal = require('../models/Deal');

/**
 * @desc    Add new payment to a deal
 * @route   POST /api/payments
 * @access  Private
 */
const addPayment = async (req, res) => {
  const session = await Payment.startSession();
  session.startTransaction();
  
  try {
    const { dealId, date, modeOfPayment, amount, remarks } = req.body;

    // Verify deal exists and belongs to user (within transaction)
    const deal = await Deal.findOne({ _id: dealId, createdBy: req.user._id }).session(session);
    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found or access denied' });
    }

    // Create payment (within transaction)
    const [payment] = await Payment.create([{
      dealId,
      date,
      modeOfPayment,
      amount,
      remarks,
      createdBy: req.user._id
    }], { session });

    await payment.populate('createdBy', 'name');

    await session.commitTransaction();
    res.status(201).json(payment);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get all payments for a specific deal
 * @route   GET /api/payments/deal/:dealId
 * @access  Private
 */
const getPaymentsByDeal = async (req, res) => {
  try {
    // Verify the deal belongs to the user
    const deal = await Deal.findOne({ _id: req.params.dealId, createdBy: req.user._id });
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const payments = await Payment.find({ dealId: req.params.dealId, createdBy: req.user._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ payments, totalPaid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all payments for current user
 * @route   GET /api/payments
 * @access  Private
 */
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ createdBy: req.user._id })
      .sort({ date: -1 })
      .populate('dealId', 'villageName surveyNumber')
      .populate('createdBy', 'name');

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get paginated payment history with search and filters
 * @route   GET /api/payments/history
 * @access  Private
 */
const getPaymentHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const search = (req.query.search || '').trim();
    const mode = req.query.mode || '';

    let filter = { createdBy: req.user._id };

    // Village name search — resolve matching deal IDs first
    if (search) {
      const matchingDeals = await Deal.find({
        createdBy: req.user._id,
        villageName: { $regex: search, $options: 'i' }
      }).select('_id').lean();
      filter.dealId = { $in: matchingDeals.map(d => d._id) };
    }

    // Mode of payment filter
    if (mode && mode !== 'ALL') {
      filter.modeOfPayment = mode;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('dealId', 'villageName surveyNumber dealType _id')
        .populate('createdBy', 'name')
        .lean(),
      Payment.countDocuments(filter)
    ]);

    res.json({
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update existing payment
 * @route   PUT /api/payments/:id
 * @access  Private/Admin
 */
const updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
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

/**
 * @desc    Delete payment
 * @route   DELETE /api/payments/:id
 * @access  Private/Admin
 */
const deletePayment = async (req, res) => {
  const session = await Payment.startSession();
  session.startTransaction();
  
  try {
    const payment = await Payment.findOne({ _id: req.params.id, createdBy: req.user._id }).session(session);

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(payment._id).session(session);

    await session.commitTransaction();
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  addPayment,
  getPaymentsByDeal,
  getAllPayments,
  getPaymentHistory,
  updatePayment,
  deletePayment
};
