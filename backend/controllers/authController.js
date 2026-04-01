/**
 * ============================================
 * PropLedger - Authentication Controller
 * ============================================
 * Handles user authentication, registration, and profile management
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOTP } = require('../utils/smsService');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
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
      subscriptionPlan 
    } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create new user
    const user = await User.create({
      companyName,
      contactPersonName,
      country,
      state,
      city,
      pincode,
      email,
      phone,
      password,
      subscriptionPlan,
      isVerified: true
    });
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
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
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      token
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, mobileNumber, password } = req.body;
    
    // Support both email and mobile number login for backward compatibility
    let user;
    if (email) {
      user = await User.findOne({ email }).select('+password');
    } else if (mobileNumber) {
      user = await User.findOne({ mobileNumber }).select('+password');
    } else {
      return res.status(400).json({ message: 'Please provide email or mobile number' });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

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
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      // Legacy fields for backward compatibility
      name: user.name,
      mobileNumber: user.mobileNumber,
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Send OTP to user's mobile
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
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

/**
 * @desc    Verify OTP and authenticate user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
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
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Upgrade user subscription plan
 * @route   PUT /api/auth/upgrade-subscription
 * @access  Private
 */
const upgradeSubscription = async (req, res) => {
  try {
    const { subscriptionPlan } = req.body;
    
    if (!['7-day-trial', 'monthly', 'yearly'].includes(subscriptionPlan)) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent trial abuse and downgrades
    if (subscriptionPlan === '7-day-trial') {
      if (user.subscriptionPlan === '7-day-trial' && user.subscriptionStatus === 'expired') {
        return res.status(400).json({ 
          message: 'Trial period already used. Please choose Monthly or Yearly plan.' 
        });
      }
      if (user.subscriptionPlan === 'monthly' || user.subscriptionPlan === 'yearly') {
        return res.status(400).json({ 
          message: 'Cannot downgrade to trial. Please choose Monthly or Yearly plan.' 
        });
      }
    }
    
    // Update subscription
    user.subscriptionPlan = subscriptionPlan;
    user.subscriptionStatus = 'active';
    user.subscriptionStartDate = new Date();
    
    // Calculate new end date
    let endDate = new Date();
    switch(subscriptionPlan) {
      case '7-day-trial':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    user.subscriptionEndDate = endDate;
    
    await user.save();
    
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
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profilePicture: user.profilePicture,
      name: user.name,
      mobileNumber: user.mobileNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update user profile picture
 * @route   PUT /api/auth/profile-picture
 * @access  Private
 */
const updateProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    // Allow null to remove profile picture
    if (profilePicture === undefined) {
      return res.status(400).json({ message: 'Profile picture data is required' });
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
      message: profilePicture ? 'Profile picture updated successfully' : 'Profile picture removed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Logout user and clear authentication cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
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

/**
 * @desc    Verify JWT token validity
 * @route   GET /api/auth/verify
 * @access  Private
 */
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
      companyName: user.companyName,
      contactPersonName: user.contactPersonName,
      country: user.country,
      state: user.state,
      city: user.city,
      pincode: user.pincode,
      email: user.email,
      phone: user.phone,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profilePicture: user.profilePicture,
      // Legacy fields for backward compatibility
      name: user.name,
      mobileNumber: user.mobileNumber
    });
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
  logout,
  upgradeSubscription,
  updateProfilePicture
};