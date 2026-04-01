/**
 * ============================================
 * PropLedger - Deal Controller
 * ============================================
 * Handles land deal management operations
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const Deal = require('../models/Deal');
const Payment = require('../models/Payment');

/**
 * @desc    Create new land deal
 * @route   POST /api/deals
 * @access  Private/Admin
 */
const createDeal = async (req, res) => {
  const session = await Deal.startSession();
  session.startTransaction();
  
  try {
    // Check if user is on 7-day trial and has reached limit
    if (req.user.subscriptionPlan === '7-day-trial') {
      const dealCount = await Deal.countDocuments({ createdBy: req.user._id }).session(session);
      
      if (dealCount >= 9) {
        await session.abortTransaction();
        return res.status(403).json({ 
          message: 'Trial limit reached. You can only create 9 deals in 7-day trial. Please upgrade to add more deals.',
          trialLimitReached: true
        });
      }
    }

    const {
      villageName,
      surveyNumber,
      dealType,
      pricePerSqYard,
      totalSqYard,
      totalSqMeter,
      jantri,
      deadlineStartDate,
      deadlineEndDate
    } = req.body;

    const [deal] = await Deal.create([{
      villageName,
      surveyNumber,
      dealType: dealType || 'Buy',
      pricePerSqYard,
      totalSqYard,
      ...(totalSqMeter !== undefined && { totalSqMeter }),
      ...(jantri !== undefined && { jantri }),
      deadlineStartDate,
      deadlineEndDate,
      createdBy: req.user._id
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
    const deals = await Deal.find({ createdBy: req.user._id })
      .populate('createdBy', 'name mobileNumber')
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
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('createdBy', 'name mobileNumber')
      .lean();

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Get all payments for this deal
    const payments = await Payment.find({ dealId: deal._id, createdBy: req.user._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .lean();

    // Calculate total paid
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = deal.totalAmount - totalPaid;

    res.json({
      deal,
      payments,
      totalPaid,
      remainingAmount
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

    const deals = await Deal.find({
      createdBy: req.user._id,
      $or: [
        { villageName: { $regex: searchTerm, $options: 'i' } },
        { surveyNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .populate('createdBy', 'name mobileNumber')
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
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: req.user._id }).session(session);

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
    const deal = await Deal.findOne({ _id: req.params.id, createdBy: req.user._id }).session(session);

    if (!deal) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Delete all payments associated with this deal (within transaction)
    await Payment.deleteMany({ dealId: deal._id }).session(session);
    
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
