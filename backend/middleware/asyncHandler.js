/**
 * ============================================
 * PropLedger - Async Handler Middleware
 * ============================================
 * Wraps async route handlers to catch errors automatically
 * Eliminates need for try-catch blocks in every route
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

/**
 * Async handler wrapper
 * Catches errors from async functions and passes to error middleware
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
