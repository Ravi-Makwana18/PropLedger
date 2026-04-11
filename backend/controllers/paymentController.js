/**
 * ============================================
 * PropLedger - Payment Controller
 * ============================================
 * Handles payment tracking and management operations.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const Payment = require('../models/Payment');
const Deal = require('../models/Deal');
const { getAccessibleUserIds } = require('../utils/accessControl');

/**
 * Escapes special regex characters in a user-supplied string.
 * Prevents Regular Expression Denial of Service (ReDoS) attacks.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Fields a user is allowed to update on an existing payment */
const PAYMENT_UPDATABLE_FIELDS = ['date', 'modeOfPayment', 'amount', 'remarks'];

/**
 * @desc    Add a new payment to a deal
 * @route   POST /api/payments
 * @access  Private
 */
const addPayment = async (req, res) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    const { dealId, date, modeOfPayment, amount, remarks } = req.body;

    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const deal = await Deal.findOne({
      _id: dealId,
      createdBy: { $in: accessibleUserIds },
    }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found or access denied' });
    }

    const [payment] = await Payment.create([{
      dealId,
      date,
      modeOfPayment,
      amount,
      remarks,
      createdBy: req.user._id,
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const deal = await Deal.findOne({
      _id: req.params.dealId,
      createdBy: { $in: accessibleUserIds },
    });
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const payments = await Payment.find({
      dealId: req.params.dealId,
      createdBy: { $in: accessibleUserIds },
    })
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
 * @desc    Get all payments accessible to the current user
 * @route   GET /api/payments
 * @access  Private
 */
const getAllPayments = async (req, res) => {
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const accessibleDeals = await Deal.find({ createdBy: { $in: accessibleUserIds } })
      .select('_id')
      .lean();
    const dealIds = accessibleDeals.map((d) => d._id);

    const payments = await Payment.find({ dealId: { $in: dealIds } })
      .sort({ date: -1 })
      .populate('dealId', 'villageName surveyNumber')
      .populate('createdBy', 'name')
      .lean();

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get paginated payment history with optional search and mode filter
 * @route   GET /api/payments/history
 * @access  Private
 */
const getPaymentHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
    const rawSearch = (req.query.search || '').trim();
    const mode = req.query.mode || '';

    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const dealFilter = { createdBy: { $in: accessibleUserIds } };
    if (rawSearch) {
      if (rawSearch.length > 100) {
        return res.status(400).json({ message: 'Search term too long' });
      }
      const search = escapeRegex(rawSearch);
      dealFilter.$or = [
        { villageName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { subDistrict: { $regex: search, $options: 'i' } },
      ];
    }

    const accessibleDeals = await Deal.find(dealFilter).select('_id').lean();
    const dealIds = accessibleDeals.map((d) => d._id);

    const filter = { dealId: { $in: dealIds } };
    // Validate mode against the exact Payment enum to prevent NoSQL injection
    const VALID_MODES = ['Bank', 'Other'];
    if (mode && mode !== 'ALL') {
      if (!VALID_MODES.includes(mode)) {
        return res.status(400).json({ message: 'Invalid payment mode filter' });
      }
      filter.modeOfPayment = mode;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('dealId', 'villageName surveyNumber dealType _id')
        .populate('createdBy', 'name contactPersonName companyName')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.json({
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update an existing payment
 * @route   PUT /api/payments/:id
 * @access  Private / Admin or Manager
 */
const updatePayment = async (req, res) => {
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    // Whitelist only safe, user-editable fields to prevent mass-assignment
    const safeUpdate = {};
    for (const field of PAYMENT_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        safeUpdate[field] = req.body[field];
      }
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: req.params.id, createdBy: { $in: accessibleUserIds } },
      { $set: safeUpdate },
      { new: true, runValidators: true }
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
 * @desc    Delete a payment
 * @route   DELETE /api/payments/:id
 * @access  Private / Admin or Manager
 */
const deletePayment = async (req, res) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const payment = await Payment.findOne({
      _id: req.params.id,
      createdBy: { $in: accessibleUserIds },
    }).session(session);

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
  deletePayment,
};
