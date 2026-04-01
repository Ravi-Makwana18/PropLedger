/**
 * ============================================
 * PropLedger - Express Server Configuration
 * ============================================
 * Main server file for the PropLedger land deal management system
 * Handles API routing, middleware setup, and database connection
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize database connection
connectDB();

// Initialize Express application
const app = express();

// ============================================
// Middleware Configuration
// ============================================

// Cookie parser - enables reading cookies from requests
app.use(cookieParser());

// Body parser - parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS Configuration
 * Allows cross-origin requests from specified domains
 * Supports credentials (cookies) for authentication
 */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://prop-ledger-opal.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ============================================
// API Routes
// ============================================

/**
 * Authentication Routes
 * Handles user registration, login, OTP verification
 * Cache disabled for auth endpoints to prevent stale data
 */
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, require('./routes/authRoutes'));

// Deal Management Routes
app.use('/api/deals', require('./routes/dealRoutes'));

// Payment Tracking Routes
app.use('/api/payments', require('./routes/paymentRoutes'));

// Customer Enquiry Routes
app.use('/api/enquiry', require('./routes/enquiryRoutes'));

// Subscription Payment Routes
app.use('/api/subscription-payment', require('./routes/subscriptionPaymentRoutes'));

// ============================================
// Health Check & Info Endpoints
// ============================================

/**
 * Health Check Endpoint
 * Returns server status and basic information
 * Used for monitoring and uptime checks
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Root Endpoint
 * Provides API information and available endpoints
 */
app.get('/', (req, res) => {
  res.json({
    message: 'PropLedger API - Land Deal Management System',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      deals: '/api/deals',
      payments: '/api/payments',
      enquiry: '/api/enquiry'
    }
  });
});

// ============================================
// Production Configuration
// ============================================

/**
 * Trust proxy setting
 * Required for correct cookie handling behind reverse proxies
 * (Vercel, Render, Heroku, etc.)
 */
app.set("trust proxy", 1);

// Global error handler - must be last middleware
app.use(errorHandler);

// ============================================
// Server Initialization
// ============================================

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`
========================================
🚀 PropLedger Server
========================================
📡 Port        : ${PORT}
🌍 Environment : ${process.env.NODE_ENV || 'development'}
🗄️  Database    : ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}
⏰ Started     : ${new Date().toLocaleString('en-IN')}
========================================
  `);
});

// ============================================
// Error Handling
// ============================================

/**
 * Handle unhandled promise rejections
 * Gracefully shuts down server on critical errors
 */
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});
