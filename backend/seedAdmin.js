/**
 * ============================================
 * PropLedger - Admin User Seeder
 * ============================================
 * Creates an initial admin user for the system
 * 
 * Usage: node backend/seedAdmin.js
 * 
 * Environment Variables Required:
 * - ADMIN_NAME: Admin user's full name
 * - ADMIN_MOBILE: Admin's 10-digit mobile number
 * - ADMIN_PASSWORD: Admin's password (min 6 characters)
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');

/**
 * Admin user configuration from environment variables
 * Falls back to defaults for development only
 */
const ADMIN = {
  name: process.env.ADMIN_NAME || 'Admin',
  mobileNumber: process.env.ADMIN_MOBILE || '9999999999',
  password: process.env.ADMIN_PASSWORD || 'admin@123',
  role: 'admin',
  isVerified: true
};

/**
 * Seeds the database with an admin user
 * Checks for existing admin before creating
 */
const seed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ mobileNumber: ADMIN.mobileNumber });
    if (existing) {
      console.log('⚠️  Admin user already exists. Skipping creation.');
      console.log(`   Mobile: ${ADMIN.mobileNumber}`);
      process.exit(0);
    }

    // Create new admin user
    await User.create(ADMIN);
    console.log('🎉 Admin user created successfully!');
    console.log('─────────────────────────────────');
    console.log(`   Name          : ${ADMIN.name}`);
    console.log(`   Mobile Number : ${ADMIN.mobileNumber}`);
    console.log(`   Password      : ${ADMIN.password}`);
    console.log(`   Role          : ${ADMIN.role}`);
    console.log('─────────────────────────────────');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

// Execute seeder
seed();
