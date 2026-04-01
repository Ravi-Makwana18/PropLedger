/**
 * ============================================
 * PropLedger - Enquiry Controller
 * ============================================
 * Handles customer enquiry management operations
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const Enquiry = require('../models/Enquiry');

/**
 * @desc    Submit new customer enquiry
 * @route   POST /api/enquiry
 * @access  Public
 */
exports.submitEnquiry = async (req, res) => {
  try {
    const { name, phone, enquiryType, message } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone are required.' 
      });
    }
    
    // Sanitize input
    const cleanName = String(name).trim();
    const cleanPhone = String(phone).trim();
    const cleanMessage = message ? String(message).trim() : '';
    const cleanType = enquiryType || 'General Question';
    
    const enquiry = new Enquiry({
      name: cleanName,
      phone: cleanPhone,
      enquiryType: cleanType,
      message: cleanMessage,
    });
    
    await enquiry.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Submit enquiry error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get all enquiries
 * @route   GET /api/enquiry/all
 * @access  Private/Admin
 */
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (err) {
    console.error('❌ Get enquiries error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Mark enquiry as read
 * @route   PATCH /api/enquiry/:id/read
 * @access  Private/Admin
 */
exports.markEnquiryRead = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndUpdate(
      id, 
      { isRead: true }, 
      { new: true }
    );
    
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Mark enquiry read error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Get count of unread enquiries
 * @route   GET /api/enquiry/unread-count
 * @access  Private/Admin
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ isRead: false });
    res.json({ count });
  } catch (err) {
    console.error('❌ Get unread count error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Delete single enquiry
 * @route   DELETE /api/enquiry/:id
 * @access  Private/Admin
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete enquiry error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Delete all enquiries
 * @route   DELETE /api/enquiry/all
 * @access  Private/Admin
 */
exports.deleteAllEnquiries = async (req, res) => {
  try {
    await Enquiry.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete all enquiries error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
