/**
 * ============================================
 * PropLedger - Deal Controller
 * ============================================
 * Handles land deal management operations.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const Deal = require('../models/Deal');
const Payment = require('../models/Payment');
const DealAdditionalExpenses = require('../models/DealAdditionalExpenses');
const DealScheduleEntry = require('../models/DealScheduleEntry');
const { getAccessibleUserIds } = require('../utils/accessControl');

/**
 * Escapes special regex characters in a user-supplied string.
 * Prevents Regular Expression Denial of Service (ReDoS) attacks.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Fields that a caller is permitted to update on an existing deal.
 * Protecting createdBy, totalAmount, and other derived/meta fields.
 */
const DEAL_UPDATABLE_FIELDS = [
  'brokerName', 'naType', 'district', 'subDistrict', 'villageName',
  'oldSurveyNo', 'newSurveyNo', 'dealType', 'pricePerSqYard', 'totalSqYard',
  'totalSqMeter', 'jantri', 'notes', 'additionalExpenses', 'addMoreEntries',
  'dealDate', 'deadlineStartDate', 'deadlineEndDate',
];

/**
 * @desc    Create new land deal
 * @route   POST /api/deals
 * @access  Private / Admin or Manager
 */
const createDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();

  try {
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
      additionalExpenses,
      addMoreEntries,
      dealDate,
      deadlineStartDate,
      deadlineEndDate,
    } = req.body;

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
      ...(additionalExpenses !== undefined && { additionalExpenses }),
      ...(addMoreEntries !== undefined && { addMoreEntries }),
      dealDate,
      deadlineStartDate,
      deadlineEndDate,
      createdBy: req.user._id,
    }], { session });

    // Normalize additional expenses to separate collection (dual-write)
    if (additionalExpenses && typeof additionalExpenses === 'object') {
      await DealAdditionalExpenses.updateOne(
        { dealId: deal._id },
        { $set: { dealId: deal._id, ...additionalExpenses } },
        { upsert: true, session }
      );
    }

    // Normalize schedule entries to separate collection (dual-write)
    if (Array.isArray(addMoreEntries) && addMoreEntries.length > 0) {
      await DealScheduleEntry.deleteMany({ dealId: deal._id }).session(session);
      const docs = addMoreEntries.map((e, idx) => ({
        dealId: deal._id,
        percentage: e.percentage,
        date: e.date,
        amount: e.amount,
        sortOrder: idx,
      }));
      await DealScheduleEntry.insertMany(docs, { session });
    }

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
 * @desc    Get all deals accessible to the current user
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

    // Get all payment data for these deals
    const dealIds = deals.map(d => d._id);
    const payments = await Payment.find({ dealId: { $in: dealIds } }).lean();
    
    // Calculate totalPaid per deal
    const paymentMap = payments.reduce((acc, p) => {
      const dealIdStr = p.dealId.toString();
      acc[dealIdStr] = (acc[dealIdStr] || 0) + p.amount;
      return acc;
    }, {});

    // Add totalPaid to each deal
    const dealsWithPayments = deals.map(deal => ({
      ...deal,
      totalPaid: paymentMap[deal._id.toString()] || 0
    }));

    res.json(dealsWithPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a single deal by ID with payment summary
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

    // Dual-read normalized children (fallback to legacy embedded fields)
    const [normalizedExpenses, normalizedSchedule] = await Promise.all([
      DealAdditionalExpenses.findOne({ dealId: deal._id }).lean(),
      DealScheduleEntry.find({ dealId: deal._id }).sort({ sortOrder: 1, date: 1 }).lean(),
    ]);

    if (normalizedExpenses) {
      deal.additionalExpenses = {
        buyBrokeringPercent: normalizedExpenses.buyBrokeringPercent ?? 0,
        sellCpIncentiveRate: normalizedExpenses.sellCpIncentiveRate ?? 0,
        planpassRatePerSqMtr: normalizedExpenses.planpassRatePerSqMtr ?? 0,
        naRatePerSqMtr: normalizedExpenses.naRatePerSqMtr ?? 0,
      };
    }

    if (normalizedSchedule && normalizedSchedule.length > 0) {
      deal.addMoreEntries = normalizedSchedule.map((e) => ({
        percentage: e.percentage,
        date: e.date,
        amount: e.amount,
      }));
    }

    // Fetch all payments for this deal
    const payments = await Payment.find({ dealId: deal._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = deal.totalAmount - totalPaid;

    const bankPaid = payments
      .filter((p) => p.modeOfPayment === 'Bank')
      .reduce((sum, p) => sum + p.amount, 0);
    const otherPaid = payments
      .filter((p) => p.modeOfPayment === 'Other')
      .reduce((sum, p) => sum + p.amount, 0);

    const jantriAmount = (deal.jantri || 0) * (deal.totalSqMeter || 0);
    const otherAmount = deal.totalAmount - jantriAmount;
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
      otherRemaining,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Search deals by village name, district, sub-district, or survey number
 * @route   GET /api/deals/search?q=searchTerm
 * @access  Private
 */
const searchDeals = async (req, res) => {
  try {
    const rawTerm = (req.query.q || '').trim();

    if (!rawTerm) {
      return res.status(400).json({ message: 'Search term required' });
    }

    if (rawTerm.length > 100) {
      return res.status(400).json({ message: 'Search term too long' });
    }

    // Escape user input to prevent ReDoS attacks
    const searchTerm = escapeRegex(rawTerm);

    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deals = await Deal.find({
      createdBy: { $in: accessibleUserIds },
      $or: [
        { villageName: { $regex: searchTerm, $options: 'i' } },
        { district: { $regex: searchTerm, $options: 'i' } },
        { subDistrict: { $regex: searchTerm, $options: 'i' } },
        { surveyNumber: { $regex: searchTerm, $options: 'i' } },
      ],
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
 * @desc    Update an existing deal
 * @route   PUT /api/deals/:id
 * @access  Private / Admin or Manager
 */
const updateDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();

  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deal = await Deal.findOne({
      _id: req.params.id,
      createdBy: { $in: accessibleUserIds },
    }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Whitelist safe fields — prevents overwriting createdBy, _id, derived amounts, etc.
    for (const field of DEAL_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        deal[field] = req.body[field];
      }
    }
    const updatedDeal = await deal.save({ session });

    // Sync normalized children
    if (req.body.additionalExpenses && typeof req.body.additionalExpenses === 'object') {
      await DealAdditionalExpenses.updateOne(
        { dealId: updatedDeal._id },
        { $set: { dealId: updatedDeal._id, ...req.body.additionalExpenses } },
        { upsert: true, session }
      );
    }

    if (Array.isArray(req.body.addMoreEntries)) {
      await DealScheduleEntry.deleteMany({ dealId: updatedDeal._id }).session(session);
      if (req.body.addMoreEntries.length > 0) {
        const docs = req.body.addMoreEntries.map((e, idx) => ({
          dealId: updatedDeal._id,
          percentage: e.percentage,
          date: e.date,
          amount: e.amount,
          sortOrder: idx,
        }));
        await DealScheduleEntry.insertMany(docs, { session });
      }
    }

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
 * @desc    Delete a deal and ALL associated records (payments, expenses, schedule)
 * @route   DELETE /api/deals/:id
 * @access  Private / Admin or Manager
 */
const deleteDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();

  try {
    const accessibleUserIds = await getAccessibleUserIds(req.user);
    const deal = await Deal.findOne({
      _id: req.params.id,
      createdBy: { $in: accessibleUserIds },
    }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Delete all associated records within the same transaction
    await Promise.all([
      Payment.deleteMany({ dealId: deal._id }).session(session),
      DealAdditionalExpenses.deleteMany({ dealId: deal._id }).session(session),
      DealScheduleEntry.deleteMany({ dealId: deal._id }).session(session),
    ]);

    await Deal.findByIdAndDelete(deal._id).session(session);

    await session.commitTransaction();
    res.json({ message: 'Deal and all associated records deleted' });
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
  deleteDeal,
};