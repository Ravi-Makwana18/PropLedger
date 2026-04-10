/**
 * ============================================
 * PropLedger - Authentication Routes
 * ============================================
 * Defines routes for user authentication and profile management.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  verifyToken,
  logout,
  updateProfilePicture,
  createManagedUser,
  getAllUsers,
  deleteUser,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================
// Public Routes
// ============================================
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// ============================================
// Protected Routes (Authentication Required)
// ============================================
router.get('/profile', protect, asyncHandler(getProfile));
router.get('/verify', protect, asyncHandler(verifyToken));
router.post('/logout', asyncHandler(logout));
router.put('/profile-picture', protect, asyncHandler(updateProfilePicture));

// ============================================
// Admin-Only Routes (User Management)
// ============================================
router.get('/users', protect, admin, asyncHandler(getAllUsers));
router.delete('/users/:id', protect, admin, asyncHandler(deleteUser));
router.post('/managed-users', protect, admin, asyncHandler(createManagedUser));

module.exports = router;
