/**
 * ============================================
 * PropLedger - Authentication Controller
 * ============================================
 * Handles user authentication, registration, and profile management.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/** Maximum allowed size for a base64-encoded profile picture (500 KB) */
const MAX_PROFILE_PICTURE_BYTES = 500 * 1024;

/**
 * Parses a JWT expiry string (e.g. '30d', '1h', '60m') into milliseconds
 * for use as a cookie max-age.
 * Supports: s (seconds), m (minutes), h (hours), d (days).
 * Falls back to 7 days if the format is unrecognised.
 */
const parseExpireToMs = (expireStr) => {
  const match = String(expireStr).match(/^(\d+)([smhd]?)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2] || 'd';
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * (multipliers[unit] || multipliers.d);
};

/**
 * Builds the cookie options object, aligned with the JWT_EXPIRE setting.
 * Cookie max-age is derived from JWT_EXPIRE so they never get out of sync.
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  path: '/',
  maxAge: parseExpireToMs(process.env.JWT_EXPIRE || '7d'),
});

// ---------------------------------------------------------------------------
// Public Endpoints
// ---------------------------------------------------------------------------

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const {
    companyName,
    contactPersonName,
    country,
    state,
    city,
    pincode,
    email,
    phone,
    password,
  } = req.body;

  // Normalize email to lowercase before every DB operation
  const normalizedEmail = email ? email.toLowerCase().trim() : null;

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Please provide a valid email' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Please provide a password' });
  }

  // Trim password to prevent trivially-spaced passwords that bypass min-length checks
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const user = await User.create({
    companyName,
    contactPersonName,
    country,
    state,
    city,
    pincode,
    email: normalizedEmail,
    phone,
    password: trimmedPassword,
    isVerified: true,
  });

  const token = generateToken(user._id);

  res.cookie('token', token, getCookieOptions());

  res.status(201).json({
    _id: user._id,
    companyName: user.companyName,
    contactPersonName: user.contactPersonName,
    country: user.country,
    state: user.state,
    city: user.city,
    pincode: user.pincode,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    profilePicture: user.profilePicture,
    token,
  });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Account not verified. Please contact support.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.cookie('token', token, getCookieOptions());

  res.json({
    _id: user._id,
    companyName: user.companyName,
    contactPersonName: user.contactPersonName,
    country: user.country,
    state: user.state,
    city: user.city,
    pincode: user.pincode,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    profilePicture: user.profilePicture,
    token,
  });
};

// ---------------------------------------------------------------------------
// Protected Endpoints
// ---------------------------------------------------------------------------

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  // req.user is already populated by protect middleware — no extra DB call needed
  res.json(req.user);
};

/**
 * @desc    Verify JWT token validity and return fresh user data
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = async (req, res) => {
  // req.user is already attached by protect middleware — reuse it, no extra DB round-trip
  const user = req.user;

  res.json({
    _id: user._id,
    companyName: user.companyName,
    contactPersonName: user.contactPersonName,
    country: user.country,
    state: user.state,
    city: user.city,
    pincode: user.pincode,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profilePicture: user.profilePicture,
    // Compatibility fields retained for existing records
    name: user.name,
    mobileNumber: user.mobileNumber,
  });
};

/**
 * @desc    Update the authenticated user's profile picture
 * @route   PUT /api/auth/profile-picture
 * @access  Private
 */
const updateProfilePicture = async (req, res) => {
  const { profilePicture } = req.body;

  if (profilePicture === undefined) {
    return res.status(400).json({ message: 'Profile picture data is required' });
  }

  // Guard against oversized payloads (base64 strings can be very large)
  if (profilePicture && Buffer.byteLength(profilePicture, 'utf8') > MAX_PROFILE_PICTURE_BYTES) {
    return res.status(413).json({ message: 'Profile picture must be smaller than 500 KB' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.profilePicture = profilePicture;
  await user.save();

  res.json({
    _id: user._id,
    profilePicture: user.profilePicture,
    message: profilePicture
      ? 'Profile picture updated successfully'
      : 'Profile picture removed successfully',
  });
};

/**
 * @desc    Logout user and clear authentication cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// ---------------------------------------------------------------------------
// Admin-Only Endpoints
// ---------------------------------------------------------------------------

/**
 * @desc    Create a managed user (manager) under an admin account
 * @route   POST /api/auth/managed-users
 * @access  Private (admin)
 */
const createManagedUser = async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: 'Name, phone, email and password are required' });
  }

  // Trim password and enforce minimum length on trimmed value
  const trimmedPassword = String(password).trim();
  if (trimmedPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate format before hitting the database
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const trimmedName = name.trim();
  const trimmedPhone = String(phone).trim();

  const managedUser = new User({
    email: normalizedEmail,
    password: trimmedPassword,
    role: 'manager',
    createdByAdmin: req.user._id,
    isVerified: true,
    companyName: req.user.companyName || 'PropLedger',
    contactPersonName: trimmedName,
    country: req.user.country || 'India',
    state: req.user.state || 'Unknown',
    city: req.user.city || 'Unknown',
    pincode: String(req.user.pincode || '000000'),
    phone: trimmedPhone,
    name: trimmedName,
    mobileNumber: trimmedPhone,
  });

  const validationError = managedUser.validateSync();
  if (validationError) {
    return res.status(400).json({
      message: Object.values(validationError.errors).map((e) => e.message).join(', '),
    });
  }

  await managedUser.save();

  res.status(201).json({
    _id: managedUser._id,
    email: managedUser.email,
    role: managedUser.role,
    createdByAdmin: managedUser.createdByAdmin,
    message: 'User created successfully',
  });
};

/**
 * @desc    Get all managed users under this admin
 * @route   GET /api/auth/users
 * @access  Private (admin)
 */
const getAllUsers = async (req, res) => {
  const users = await User.find({ createdByAdmin: req.user._id }).select('-password');
  res.json({ count: users.length, users });
};

/**
 * @desc    Delete a managed user by ID
 * @route   DELETE /api/auth/users/:id
 * @access  Private (admin)
 */
const deleteUser = async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Prevent self-deletion
  if (targetUser._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  // Ensure admin can only delete users they created
  if (
    !targetUser.createdByAdmin ||
    targetUser.createdByAdmin.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Not authorized to delete this user' });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted successfully' });
};

module.exports = {
  register,
  login,
  getProfile,
  verifyToken,
  logout,
  updateProfilePicture,
  createManagedUser,
  getAllUsers,
  deleteUser,
};
