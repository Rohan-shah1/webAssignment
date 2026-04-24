const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Defines the structure for all users (Chefs, Food Lovers, and Admins).
 * Includes support for traditional email/password and Google OAuth.
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'], // Custom error message for validation
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Prevent duplicate accounts
  },
  password: {
    type: String,
    required: false, // Optional for Google users
    default: null,
  },
  role: {
    type: String,
    enum: ['Food Lover', 'Chef', 'Admin'],
    default: 'Food Lover',
  },
  profilePicture: {
    type: String,
    default: '', // Placeholder or Cloudinary URL
  },
  bio: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  // Relationship: Array of Recipe IDs that this user has bookmarked
  savedRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  // Relationship: Array of User IDs (Chefs) that this user follows
  followedChefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Google Auth specific fields
  googleId: {
    type: String,
    default: null,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  // Password Reset fields
  resetPasswordOtp: {
    type: String,
    default: null,
  },
  resetPasswordOtpExpiry: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

/**
 * Password Hashing Hook
 * Before saving a user document, we hash the password if it's new or modified.
 * This ensures we NEVER store plain-text passwords in the database.
 */
userSchema.pre('save', async function() {
  // If it's a Google user without a password, or the password hasn't changed, skip hashing
  if (!this.password || !this.isModified('password')) {
    return;
  }
  
  // Use a salt factor of 10 for a good balance between security and speed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Password Verification Method
 * Compares an entered plain-text password with the stored hash.
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
