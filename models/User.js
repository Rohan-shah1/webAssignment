const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    default: null,
  },
  role: {
    type: String,
    // 'Admin' is reserved — assigned directly in MongoDB Atlas, never via the public API
    enum: ['Food Lover', 'Chef', 'Admin'],
    default: 'Food Lover',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  savedRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  followedChefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  googleId: {
    type: String,
    default: null,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  resetPasswordOtp: {
    type: String,
    default: null,
  },
  resetPasswordOtpExpiry: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
});

// Hash password before saving — skip if no password (Google users)
userSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password match
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
