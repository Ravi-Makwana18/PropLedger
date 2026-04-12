/**
 * ============================================
 * PropLedger - Database Configuration
 * ============================================
 * Handles MongoDB connection with optimized settings
 * Supports both local MongoDB and MongoDB Atlas
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Deal = require('../models/Deal');
const Payment = require('../models/Payment');
const DealAdditionalExpenses = require('../models/DealAdditionalExpenses');
const DealScheduleEntry = require('../models/DealScheduleEntry');

mongoose.set('strictQuery', true);

const transactionalModels = [
  User,
  Deal,
  Payment,
  DealAdditionalExpenses,
  DealScheduleEntry,
];

const ensureCollectionsExist = async () => {
  await Promise.all(
    transactionalModels.map(async (model) => {
      try {
        await model.createCollection();
      } catch (error) {
        if (error.codeName !== 'NamespaceExists') {
          throw error;
        }
      }

      await model.init();
    })
  );
};

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

    await ensureCollectionsExist();

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.ensureCollectionsExist = ensureCollectionsExist;
