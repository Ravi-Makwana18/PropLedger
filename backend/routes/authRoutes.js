/**
 * ============================================
 * PropLedger - Authentication Routes
 * ============================================
 * Defines routes for user authentication operations
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendOTPController,
  verifyOTP,
  getProfile,
  verifyToken,
  logout,
  upgradeSubscription,
  updateProfilePicture
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Public Routes
// ============================================
router.post('/register', asyncHandler(register));           // Register new user
router.post('/login', asyncHandler(login));                 // Login user
router.post('/send-otp', asyncHandler(sendOTPController));  // Send OTP to mobile
router.post('/verify-otp', asyncHandler(verifyOTP));        // Verify OTP

// ============================================
// Protected Routes (Authentication Required)
// ============================================
router.get('/profile', protect, asyncHandler(getProfile));                      // Get user profile
router.get('/verify', protect, asyncHandler(verifyToken));                      // Verify JWT token
router.post('/logout', asyncHandler(logout));                                   // Logout user
router.put('/upgrade-subscription', protect, asyncHandler(upgradeSubscription)); // Upgrade subscription
router.put('/profile-picture', protect, asyncHandler(updateProfilePicture));    // Update profile picture

module.exports = router;
