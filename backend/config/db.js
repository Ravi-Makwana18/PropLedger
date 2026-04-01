/**
 * ============================================
 * PropLedger - Database Configuration
 * ============================================
 * Handles MongoDB connection with optimized settings
 * Supports both local MongoDB and MongoDB Atlas
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 * Uses connection pooling and timeout settings for optimal performance
 * 
 * @async
 * @throws {Error} If connection fails
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,              // Maximum 10 concurrent connections
      serverSelectionTimeoutMS: 5000,  // Fail fast if server unreachable
      socketTimeoutMS: 45000,       // Close idle sockets after 45 seconds
      connectTimeoutMS: 10000,      // Connection timeout: 10 seconds
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
