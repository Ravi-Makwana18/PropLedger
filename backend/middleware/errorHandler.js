const errorHandler = (err, req, res, next) => {
  // Log to console for dev
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
