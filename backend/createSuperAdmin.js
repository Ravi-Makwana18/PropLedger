/**
 * ============================================
 * PropLedger - Super Admin Creator Script
 * ============================================
 * Creates a super admin account for system administration
 * 
 * Usage: node backend/createSuperAdmin.js
 * 
 * Environment Variables Required:
 * - SUPERADMIN_EMAIL: Super admin email address
 * - SUPERADMIN_PASSWORD: Super admin password
 * - SUPERADMIN_NAME: Super admin full name
 * - SUPERADMIN_COMPANY: Company name
 * - SUPERADMIN_PHONE: Contact phone number
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

/**
 * Creates or updates super admin account
 */
const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Super admin configuration from environment variables
    const superAdminData = {
      email: process.env.SUPERADMIN_EMAIL || 'admin@propledger.com',
      password: process.env.SUPERADMIN_PASSWORD || 'ChangeMe@123',
      companyName: process.env.SUPERADMIN_COMPANY || 'PropLedger',
      contactPersonName: process.env.SUPERADMIN_NAME || 'Super Admin',
      country: 'India',
      state: 'Gujarat',
      city: 'Ahmedabad',
      pincode: '380001',
      phone: process.env.SUPERADMIN_PHONE || '9999999999',
      role: 'superadmin',
      subscriptionPlan: 'yearly',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isVerified: true
    };

    // Check if super admin already exists
    const existing = await User.findOne({ email: superAdminData.email });
    if (existing) {
      console.log('\n⚠️  User already exists. Updating to super admin...');
      existing.role = 'superadmin';
      existing.subscriptionStatus = 'active';
      existing.subscriptionEndDate = superAdminData.subscriptionEndDate;
      await existing.save();
      console.log('✅ Updated to Super Admin!\n');
      process.exit(0);
    }

    // Create new super admin
    const superAdmin = await User.create(superAdminData);

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${superAdminData.password}`);
    console.log(`👤 Name: ${superAdmin.contactPersonName}`);
    console.log(`🏢 Company: ${superAdmin.companyName}`);
    console.log(`⭐ Role: ${superAdmin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 IMPORTANT: Change your password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
