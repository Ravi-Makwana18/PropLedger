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

const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const createApp = require('./app');

// Load environment variables from root directory (must be first)
dotenv.config({ path: path.join(__dirname, '../.env') });

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  const message = 'JWT_SECRET must be at least 32 characters for secure production use.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(`⚠️  WARNING: ${message}`);
}

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required in production for strict CORS allowlisting.');
}

// Initialize database connection
connectDB();

// Initialize Express application
const app = createApp();

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

process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
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
