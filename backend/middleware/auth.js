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
const mongoose = require('mongoose');

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
 * Admin or Manager Middleware
 * Allows both admin and manager roles to perform deal/payment operations
 */
const adminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized' });
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
 * For manager users, checks the admin's subscription instead of their own
 */
const requirePremium = async (req, res, next) => {
  try {
    const user = req.user;
    let checkUser = user;

    // Managers inherit their admin's subscription
    if (user.role === 'manager' && user.createdByAdmin) {
      const adminUser = await User.findById(user.createdByAdmin).select('subscriptionStatus subscriptionEndDate');
      if (adminUser) {
        checkUser = adminUser;
      }
    }

    // Check if subscription is active and not expired
    const isActive =
      checkUser.subscriptionStatus === 'active' &&
      checkUser.subscriptionEndDate &&
      new Date(checkUser.subscriptionEndDate) > new Date();

    if (isActive) {
      return next();
    }

    // Return appropriate error message
    res.status(403).json({ 
      message: 'Premium subscription required',
      subscriptionExpired: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in premium check' });
  }
};

module.exports = { protect, admin, adminOrManager, superadmin, requirePremium };
