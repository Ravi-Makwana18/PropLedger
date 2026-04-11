/**
 * ============================================
 * PropLedger - User Model
 * ============================================
 * Defines the user schema with authentication features
 * Includes password hashing and role-based access
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
  role: {
    type: String,
    enum: ['admin', 'manager'],
    default: 'admin'
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Compatibility fields retained for existing records
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

// Index for resolving manager lookup on every authenticated admin request
userSchema.index({ createdByAdmin: 1 });

module.exports = mongoose.model('User', userSchema);