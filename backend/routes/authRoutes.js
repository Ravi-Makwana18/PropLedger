const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendOTPController,
  verifyOTP,
  getProfile,
  verifyToken,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');


router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/send-otp', asyncHandler(sendOTPController));
router.post('/verify-otp', asyncHandler(verifyOTP));
router.get('/profile', protect, asyncHandler(getProfile));
router.get('/verify', protect, asyncHandler(verifyToken));
router.post('/logout', asyncHandler(logout));

module.exports = router;
