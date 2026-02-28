const Deal = require('../models/Deal');
const Payment = require('../models/Payment');

// @desc    Create new deal
// @route   POST /api/deals
// @access  Private/Admin
const createDeal = async (req, res) => {
  try {
    const {
      villageName,
      surveyNumber,
      dealType,
      pricePerSqYard,
      totalSqYard,
      deadlineStartDate,
      deadlineEndDate
    } = req.body;

    const deal = await Deal.create({
      villageName,
      surveyNumber,
      dealType: dealType || 'Buy',
      pricePerSqYard,
      totalSqYard,
      deadlineStartDate,
      deadlineEndDate,
      createdBy: req.user._id
    });

    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('createdBy', 'name mobileNumber')
      .lean();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get deal by ID with payment summary
// @route   GET /api/deals/:id
// @access  Private
const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id).populate('createdBy', 'name mobileNumber');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Get all payments for this deal
    const payments = await Payment.find({ dealId: deal._id })
      .sort({ date: -1 })
      .populate('createdBy', 'name');

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

// @desc    Search deals by village or survey number
// @route   GET /api/deals/search?q=searchTerm
// @access  Private
const searchDeals = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term required' });
    }

    const deals = await Deal.find({
      $or: [
        { villageName: { $regex: searchTerm, $options: 'i' } },
        { surveyNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    }).populate('createdBy', 'name mobileNumber');

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private/Admin
const updateDeal = async (req, res) => {
  try {
    const updatedDeal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, returnDocument: 'after' }
    );

    if (!updatedDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private/Admin
const deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Delete all payments associated with this deal
    await Payment.deleteMany({ dealId: deal._id });

    res.json({ message: 'Deal and associated payments deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
