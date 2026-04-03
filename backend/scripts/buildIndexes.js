/**
 * Build Database Indexes Script
 * Run this once to create indexes for better performance
 * Usage: node backend/scripts/buildIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const User = require('../models/User');

const buildIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Building indexes...');
    
    // Build Deal indexes
    console.log('Building Deal indexes...');
    await Deal.createIndexes();
    console.log('✅ Deal indexes created');

    // Build User indexes
    console.log('Building User indexes...');
    await User.createIndexes();
    console.log('✅ User indexes created');

    console.log('\n✅ All indexes built successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error building indexes:', error);
    process.exit(1);
  }
};

buildIndexes();
