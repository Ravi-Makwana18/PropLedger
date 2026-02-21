// Get all enquiries (admin)
exports.getAllEnquiries = async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Mark enquiry as read
exports.markEnquiryRead = async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get unread enquiry count
exports.getUnreadCount = async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const count = await Enquiry.countDocuments({ isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
const Enquiry = require('../models/Enquiry');

exports.submitEnquiry = async (req, res) => {
  try {
    const { name, phone, enquiryType, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }
    // Sanitize input (basic)
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
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
