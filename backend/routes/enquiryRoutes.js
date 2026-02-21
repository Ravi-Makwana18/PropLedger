const express = require('express');
const router = express.Router();
const { submitEnquiry } = require('../controllers/enquiryController');

const { getAllEnquiries, markEnquiryRead, getUnreadCount } = require('../controllers/enquiryController');

router.post('/', submitEnquiry);
router.get('/all', getAllEnquiries);
router.patch('/:id/read', markEnquiryRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;
