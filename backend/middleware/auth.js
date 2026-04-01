/**
 * ============================================
 * PropLedger - Authentication Middleware
 * ============================================
 * Protects routes and enforces role-based access control
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Middleware
 * Verifies JWT token and attaches user to request
 * Supports both Bearer token (header) and cookie-based authentication
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header (Bearer token) - works on all platforms
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to cookie (for backward compatibility)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // No token found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Admin Middleware
 * Ensures user has admin role
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

/**
 * Super Admin Middleware
 * Ensures user has superadmin role
 */
const superadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as super admin' });
  }
};

/**
 * Require Premium Middleware
 * Ensures user has active subscription (including active trial)
 */
const requirePremium = (req, res, next) => {
  const user = req.user;
  
  // Check if subscription is active and not expired
  const isActive =
    user.subscriptionStatus === 'active' &&
    user.subscriptionEndDate &&
    new Date(user.subscriptionEndDate) > new Date();

  if (isActive) {
    return next();
  }
  
  // Return appropriate error message
  res.status(403).json({ 
    message: 'Premium subscription required',
    subscriptionExpired: true
  });
};

module.exports = { protect, admin, superadmin, requirePremium };
