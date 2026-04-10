/**
 * ============================================
 * PropLedger - Express Server Configuration
 * ============================================
 * Main server file for the PropLedger land deal management system.
 * Handles API routing, middleware setup, and database connection.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from root directory (must be first)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize database connection
connectDB();

// Startup security assertion: warn if JWT_SECRET is too short
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is missing or too short (< 32 chars). Use a strong random secret in production.');
}

// Initialize Express application
const app = express();

// ============================================
// Core App Settings (must come before routes/middleware)
// ============================================

/**
 * Trust proxy setting
 * Required for correct IP, cookie, and secure-flag handling behind
 * reverse proxies (Vercel, Render, Heroku, etc.)
 * MUST be set before any middleware that reads req.ip or req.secure.
 */
app.set('trust proxy', 1);

// ============================================
// Middleware Configuration
// ============================================

// Cookie parser — enables reading cookies from requests
app.use(cookieParser());

// Body parser — parse JSON and URL-encoded request bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/**
 * Security Headers
 * Adds essential HTTP security headers without requiring helmet.
 * These protect against clickjacking, MIME-sniffing, and XSS.
 */
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/**
 * CORS Configuration
 * Allows cross-origin requests from specified domains.
 * Supports credentials (cookies) for authentication.
 */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================
// API Routes
// ============================================

/**
 * Authentication Routes
 * Cache disabled for auth endpoints to prevent stale data.
 */
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, require('./routes/authRoutes'));

// Deal Management Routes
app.use('/api/deals', require('./routes/dealRoutes'));

// Payment Tracking Routes
app.use('/api/payments', require('./routes/paymentRoutes'));

// ============================================
// Health Check & Info Endpoints
// ============================================

/**
 * Health Check Endpoint
 * Returns server status and basic information.
 * Used for monitoring and uptime checks (UptimeRobot).
 */
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  res.json({
    status: 'ok',
    message: 'PropLedger API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
});

/**
 * Root Endpoint
 * Provides API information and available endpoints.
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
    },
  });
});

// ============================================
// Production Configuration
// ============================================

/**
 * Serve React Frontend in Production
 * Serves static files from the frontend build directory
 * and falls back to index.html for client-side routing.
 */
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Global error handler — must be the last middleware
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
🗄️  Database    : ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}
⏰ Started     : ${new Date().toLocaleString('en-IN')}
========================================
  `);
});

// ============================================
// Process Error Handling
// ============================================

/**
 * Handle unhandled promise rejections.
 * Gracefully shuts down the server on critical async errors.
 */
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

/**
 * Handle SIGTERM signal.
 * Sent by Render/Heroku/Docker before terminating the process.
 * Allows in-flight requests to complete before exiting.
 */
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});
