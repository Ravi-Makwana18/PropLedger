/**
 * ============================================
 * PropLedger - Deal Controller
 * ============================================
 * Handles land deal management operations
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const Deal = require('../models/Deal');
const Payment = require('../models/Payment');
const { getAccessibleUserIds } = require('../utils/accessControl');

/**
 * @desc    Create new land deal
 * @route   POST /api/deals
 * @access  Private/Admin
 */
const createDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();
  
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);

    const {
      brokerName,
      naType,
      district,
      subDistrict,
      villageName,
      oldSurveyNo,
      newSurveyNo,
      dealType,
      pricePerSqYard,
      totalSqYard,
      totalSqMeter,
      jantri,
      notes,
      dealDate,
      deadlineStartDate,
      deadlineEndDate
    } = req.body;

    const ownerId = req.user._id;

    const [deal] = await Deal.create([{
      brokerName,
      naType,
      district,
      subDistrict,
      villageName,
      ...(oldSurveyNo !== undefined && { oldSurveyNo }),
      newSurveyNo,
      dealType: dealType || 'Buy',
      pricePerSqYard,
      totalSqYard,
      ...(totalSqMeter !== undefined && { totalSqMeter }),
      ...(jantri !== undefined && { jantri }),
      ...(notes !== undefined && { notes }),
      dealDate,
      deadlineStartDate,
      deadlineEndDate,
      createdBy: ownerId
    }], { session });

    await session.commitTransaction();
    res.status(201).json(deal);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};


/**
 * @desc    Get all deals for current user
 * @route   GET /api/deals
 * @access  Private
 */
const getDeals = async (req, res) => {
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deals = await Deal.find({ createdBy: { $in: accessibleUserIds } })
      .select('brokerName naType district subDistrict villageName oldSurveyNo newSurveyNo surveyNumber dealType pricePerSqYard totalSqYard totalSqMeter jantri totalAmount notes dealDate deadlineEndDate createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get deal by ID with payment summary
 * @route   GET /api/deals/:id
 * @access  Private
 */
const getDealById = async (req, res) => {
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: { $in: accessibleUserIds } })
      .populate('createdBy', 'name mobileNumber')
      .lean();

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Get all payments for this deal
    const payments = await Payment.find({ dealId: deal._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    // Total Paid = ALL payments combined (Bank + Other)
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = deal.totalAmount - totalPaid;

    // Split payments by mode
    const bankPaid = payments
      .filter(p => p.modeOfPayment === 'Bank')
      .reduce((sum, p) => sum + p.amount, 0);
    const otherPaid = payments
      .filter(p => p.modeOfPayment === 'Other')
      .reduce((sum, p) => sum + p.amount, 0);

    // Jantri Amount = Jantri Rate × Total sq. mtr (no TDS deduction)
    const jantriAmount = (deal.jantri || 0) * (deal.totalSqMeter || 0);
    // Other Amount = Total Amount - Jantri Amount
    const otherAmount = deal.totalAmount - jantriAmount;

    // Remaining per category
    const jantriRemaining = jantriAmount - bankPaid;
    const otherRemaining = otherAmount - otherPaid;

    res.json({
      deal,
      payments,
      totalPaid,
      remainingAmount,
      bankPaid,
      otherPaid,
      jantriAmount,
      otherAmount,
      jantriRemaining,
      otherRemaining
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Search deals by village name or survey number
 * @route   GET /api/deals/search?q=searchTerm
 * @access  Private
 */
const searchDeals = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term required' });
    }

    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deals = await Deal.find({
      createdBy: { $in: accessibleUserIds },
      $or: [
        { villageName: { $regex: searchTerm, $options: 'i' } },
        { district: { $regex: searchTerm, $options: 'i' } },
        { subDistrict: { $regex: searchTerm, $options: 'i' } },
        { surveyNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .select('brokerName naType district subDistrict villageName oldSurveyNo newSurveyNo surveyNumber dealType pricePerSqYard totalSqYard totalSqMeter jantri totalAmount notes dealDate deadlineEndDate createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update existing deal
 * @route   PUT /api/deals/:id
 * @access  Private/Admin
 */
const updateDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();
  
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: { $in: accessibleUserIds } }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Merge incoming fields onto the document so pre-save hook re-runs
    Object.assign(deal, req.body);
    const updatedDeal = await deal.save({ session });

    await session.commitTransaction();
    res.json(updatedDeal);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Delete deal and associated payments
 * @route   DELETE /api/deals/:id
 * @access  Private/Admin
 */
const deleteDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();
  
  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: { $in: accessibleUserIds } }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Delete all payments associated with this deal (within transaction)
    await Payment.deleteMany({ dealId: deal._id, createdBy: { $in: accessibleUserIds } }).session(session);
    
    // Delete the deal (within transaction)
    await Deal.findByIdAndDelete(deal._id).session(session);

    await session.commitTransaction();
    res.json({ message: 'Deal and associated payments deleted' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  searchDeals,
  updateDeal,
  deleteDeal
};