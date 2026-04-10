/**
 * ============================================
 * PropLedger - Global Error Handler
 * ============================================
 * Centralized error handling middleware.
 * Formats errors consistently and never leaks
 * stack traces or internal details in production.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

/**
 * Global error handler middleware.
 * Must be registered as the last app.use() in server.js.
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // In development log the full error; in production log a concise summary only
  if (isDev) {
    console.error('❌ Error:', err);
  } else {
    console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${err.message}`);
  }

  // Derive a meaningful HTTP status code from the error type
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation errors → 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(', ') || message;
  }

  // MongoDB duplicate key → 409
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  // Malformed MongoDB ObjectId → 400
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace only in development — never in production
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
