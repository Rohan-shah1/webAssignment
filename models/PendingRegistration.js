const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpiry: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['regular_signup', 'google_signup', 'google_link'],
    required: true,
  },
  registrationData: {
    type: Object, // Will store { username, password, role } OR { googleId, name, picture, role }
    required: true,
  },
}, {
  timestamps: true
});

// TTL index to automatically delete documents 15 minutes after their creation
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
