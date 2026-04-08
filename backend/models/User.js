/**
 * ============================================
 * PropLedger - User Model
 * ============================================
 * Defines the user schema with authentication features
 * Includes password hashing, OTP generation, and role-based access
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema Definition
 * Stores user credentials, profile info, and verification status
 */
const userSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: function() {
      // Required for new users, optional for migrated users
      return this.isNew;
    }
  },
  contactPersonName: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  country: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  state: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  city: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  pincode: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  email: {
    type: String,
    required: function() {
      return this.isNew;
    },
    unique: true,
    sparse: true, // Allow null for old users during migration
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    index: true  // Index for faster login queries
  },
  phone: {
    type: String,
    required: function() {
      return this.isNew;
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  subscriptionPlan: {
    type: String,
    enum: ['7-day-trial', 'monthly', 'yearly'],
    required: function() {
      return this.isNew;
    }
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'superadmin'],
    default: 'admin'
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Legacy fields for backward compatibility
  mobileNumber: {
    type: String
  },
  name: {
    type: String
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: null  // URL or base64 string of profile picture
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt fields
});

/**
 * Pre-save middleware
 * Hashes password before saving to database
 * Only runs if password is modified
 */
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Calculate subscription end date
  if (this.isNew && this.subscriptionPlan) {
    const startDate = this.subscriptionStartDate || new Date();
    let endDate = new Date(startDate);
    
    switch(this.subscriptionPlan) {
      case '7-day-trial':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    
    this.subscriptionEndDate = endDate;
  }
});

/**
 * Instance method to compare entered password with hashed password
 * 
 * @param {string} enteredPassword - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};



module.exports = mongoose.model('User', userSchema);