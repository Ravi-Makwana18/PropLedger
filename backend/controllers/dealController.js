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
  'totalSqMeter', 'jantri', 'notes',
  'dealDate', 'deadlineStartDate', 'deadlineEndDate',
];

const normalizeAdditionalExpenses = (expenses = {}) => ({
  buyBrokeringPercent: Number(expenses.buyBrokeringPercent) || 0,
  sellCpIncentiveRate: Number(expenses.sellCpIncentiveRate) || 0,
  planpassRatePerSqMtr: Number(expenses.planpassRatePerSqMtr) || 0,
  naRatePerSqMtr: Number(expenses.naRatePerSqMtr) || 0,
});

const normalizeScheduleEntries = (entries = []) =>
  entries.map((entry, index) => ({
    dealId: entry.dealId,
    percentage: Number(entry.percentage) || 0,
    date: entry.date,
    amount: Number(entry.amount) || 0,
    sortOrder: entry.sortOrder ?? index,
  }));

const syncAdditionalExpenses = async (dealId, expenses, session) => {
  if (expenses === undefined) {
    return null;
  }

  if (expenses === null) {
    await DealAdditionalExpenses.deleteOne({ dealId }).session(session);
    return normalizeAdditionalExpenses();
  }

  const normalizedExpenses = normalizeAdditionalExpenses(expenses);
  await DealAdditionalExpenses.updateOne(
    { dealId },
    { $set: { dealId, ...normalizedExpenses } },
    { upsert: true, session }
  );

  return normalizedExpenses;
};

const syncScheduleEntries = async (dealId, entries, session) => {
  if (entries === undefined) {
    return null;
  }

  await DealScheduleEntry.deleteMany({ dealId }).session(session);

  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const normalizedEntries = normalizeScheduleEntries(
    entries.map((entry, index) => ({
      ...entry,
      dealId,
      sortOrder: index,
    }))
  );

  await DealScheduleEntry.insertMany(normalizedEntries, { session });

  return normalizedEntries.map(({ percentage, date, amount }) => ({
    percentage,
    date,
    amount,
  }));
};

const hydrateDealRelations = async (deal) => {
  const plainDeal = typeof deal.toObject === 'function' ? deal.toObject() : { ...deal };

  const [normalizedExpenses, normalizedSchedule] = await Promise.all([
    DealAdditionalExpenses.findOne({ dealId: plainDeal._id }).lean(),
    DealScheduleEntry.find({ dealId: plainDeal._id }).sort({ sortOrder: 1, date: 1 }).lean(),
  ]);

  plainDeal.additionalExpenses = normalizeAdditionalExpenses(normalizedExpenses || {});
  plainDeal.addMoreEntries = normalizeScheduleEntries(normalizedSchedule).map(({ percentage, date, amount }) => ({
    percentage,
    date,
    amount,
  }));

  return plainDeal;
};

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
      dealDate,
      deadlineStartDate,
      deadlineEndDate,
      createdBy: req.user._id,
    }], { session });

    await syncAdditionalExpenses(deal._id, additionalExpenses, session);
    await syncScheduleEntries(deal._id, addMoreEntries, session);

    await session.commitTransaction();
    res.status(201).json(await hydrateDealRelations(deal));
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);

    const deals = await Deal.find({ createdBy: { $in: accessibleUserIds } })
      .select(
        'brokerName naType district subDistrict villageName oldSurveyNo newSurveyNo surveyNumber ' +
        'dealType pricePerSqYard totalSqYard totalSqMeter jantri totalAmount totalPaid notes ' +
        'dealDate deadlineEndDate createdAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json(deals);
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: { $in: accessibleUserIds } })
      .populate('createdBy', 'name mobileNumber')
      .lean();

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const hydratedDeal = await hydrateDealRelations(deal);

    // Fetch all payments for this deal
    const payments = await Payment.find({ dealId: hydratedDeal._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = hydratedDeal.totalAmount - totalPaid;

    const bankPaid = payments
      .filter((p) => p.modeOfPayment === 'Bank')
      .reduce((sum, p) => sum + p.amount, 0);
    const otherPaid = payments
      .filter((p) => p.modeOfPayment === 'Other')
      .reduce((sum, p) => sum + p.amount, 0);

    const jantriAmount = (hydratedDeal.jantri || 0) * (hydratedDeal.totalSqMeter || 0);
    const otherAmount = hydratedDeal.totalAmount - jantriAmount;
    const jantriRemaining = jantriAmount - bankPaid;
    const otherRemaining = otherAmount - otherPaid;

    res.json({
      deal: hydratedDeal,
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

    const accessibleUserIds = await getAccessibleUserIds(req.user, req);
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);
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

    await syncAdditionalExpenses(updatedDeal._id, req.body.additionalExpenses, session);
    await syncScheduleEntries(updatedDeal._id, req.body.addMoreEntries, session);

    await session.commitTransaction();
    res.json(await hydrateDealRelations(updatedDeal));
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, req);
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
