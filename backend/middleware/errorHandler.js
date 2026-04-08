/**
 * ============================================
 * PropLedger - Global Error Handler
 * ============================================
 * Centralized error handling middleware
 * Formats errors consistently and hides stack traces in production
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

/**
 * Global error handler middleware
 * Catches all errors and sends formatted response
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console for debugging
  console.error('Error:', err);

  // Send formatted error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
