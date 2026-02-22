// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Verify JWT token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    // req.user is set by auth middleware if token is valid
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOTP } = require('../utils/smsService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { mobileNumber, password, name } = req.body;
    // Check if user exists
    const userExists = await User.findOne({ mobileNumber });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Create user
    const user = await User.create({
      mobileNumber,
      password,
      name,
      role: 'user',
      isVerified: true
    });
    // Generate JWT
    const token = generateToken(user._id);
    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  console.log('Login request cookies:', req.cookies);
  console.log('Register request cookies:', req.cookies);
  try {
    const { mobileNumber, password } = req.body;
    // Check for user
    const user = await User.findOne({ mobileNumber }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT
    const token = generateToken(user._id);
    // Set secure cookie
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: "destination-dholera.onrender.com",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTPController = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    await sendOTP(mobileNumber, otp);

    res.json({ message: 'OTP sent successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);
    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  sendOTPController,
  verifyOTP,
  getProfile,
  verifyToken,
  logout
};