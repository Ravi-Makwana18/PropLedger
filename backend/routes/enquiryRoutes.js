const express = require('express');
const router = express.Router();
const { submitEnquiry, getAllEnquiries, markEnquiryRead, getUnreadCount, deleteEnquiry, deleteAllEnquiries } = require('../controllers/enquiryController');

router.post('/', submitEnquiry);
router.get('/all', getAllEnquiries);
router.patch('/:id/read', markEnquiryRead);
router.get('/unread-count', getUnreadCount);
router.delete('/all', deleteAllEnquiries);
router.delete('/:id', deleteEnquiry);

module.exports = router;
