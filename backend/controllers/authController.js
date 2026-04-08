/**
 * ============================================
 * PropLedger - Authentication Controller
 * ============================================
 * Handles user authentication, registration, and profile management
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');


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
    subscriptionPlan 
  } = req.body;
  
  // Normalize email to lowercase
  const normalizedEmail = email ? email.toLowerCase().trim() : email;
  
  // Check if user already exists
  const userExists = await User.findOne({ email: normalizedEmail });
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
  
  // Set secure HTTP-only cookie — align with JWT expiry (1 hour)
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
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
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide email' });
  }

  // Normalize email to lowercase for case-insensitive login
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Enforce email verification (Issue #9)
  if (!user.isVerified) {
    return res.status(403).json({ message: 'Account not verified. Please contact support.' });
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Set secure HTTP-only cookie — align with JWT expiry (1 hour)
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
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
    token
  });
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
 * @desc    Create a managed user (manager) under an admin account
 * @route   POST /api/auth/managed-users
 * @access  Private (admin / superadmin)
 */
const createManagedUser = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'Name, phone, email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const trimmedName = name.trim();
    const trimmedPhone = String(phone).trim();
    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const managedUserPayload = {
      email: normalizedEmail,
      password,
      role: 'manager',
      createdByAdmin: req.user._id,
      isVerified: true
    };

    const managedUser = new User(managedUserPayload);

    managedUser.companyName = req.user.companyName || 'PropLedger';
    managedUser.contactPersonName = trimmedName;
    managedUser.country = req.user.country || 'India';
    managedUser.state = req.user.state || 'Unknown';
    managedUser.city = req.user.city || 'Unknown';
    managedUser.pincode = String(req.user.pincode || '000000');
    managedUser.phone = trimmedPhone;
    managedUser.name = trimmedName;
    managedUser.mobileNumber = trimmedPhone;
    managedUser.subscriptionPlan = 'monthly';
    managedUser.subscriptionStatus = 'active';
    managedUser.subscriptionStartDate = new Date();

    console.log('Creating managed user with payload:', {
      email: managedUser.email,
      role: managedUser.role,
      createdByAdmin: managedUser.createdByAdmin
    });

    const validationError = managedUser.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: Object.values(validationError.errors).map((err) => err.message).join(', ')
      });
    }

    await managedUser.save();

    res.status(201).json({
      _id: managedUser._id,
      email: managedUser.email,
      role: managedUser.role,
      createdByAdmin: managedUser.createdByAdmin,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Create managed user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors).map((err) => err.message).join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: error.message });
  }
};

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

/**
 * @desc    Get all users managed by this admin (or all for superadmin)
 * @route   GET /api/auth/users
 * @access  Private (admin / superadmin)
 */
const getAllUsers = async (req, res) => {
  try {
    let users;
    if (req.user.role === 'superadmin') {
      // Superadmin sees everyone except other superadmins
      users = await User.find({ role: { $ne: 'superadmin' } }).select('-password -otp -otpExpiry');
    } else {
      // Admin sees only the users they created
      users = await User.find({ createdByAdmin: req.user._id }).select('-password -otp -otpExpiry');
    }
    res.json({ count: users.length, users });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a managed user by ID
 * @route   DELETE /api/auth/users/:id
 * @access  Private (admin / superadmin)
 */
const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Admin can only delete users they created
    if (req.user.role === 'admin') {
      if (!targetUser.createdByAdmin || targetUser.createdByAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this user' });
      }
    }

    // Superadmin cannot delete another superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete a super admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
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
  deleteUser
};
