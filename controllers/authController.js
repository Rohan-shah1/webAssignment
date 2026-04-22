const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const cloudinary = require('../config/cloudinary');
const { sendOtpEmail } = require('../config/mailer');
const { Readable } = require('stream');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        otp,
        otpExpiry,
        type: 'regular_signup',
        registrationData: { username, password }
      },
      { upsert: true, new: true }
    );

    try {
      await sendOtpEmail(email, otp, 'Verify your RecipeNest account', 'Email verification');
      res.status(200).json({ requiresOtp: true, email, message: 'OTP sent to email' });
    } catch (emailError) {
      console.error('SendGrid Email Error:', emailError.message);
      res.status(500).json({ message: 'OTP email failed to send.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP for regular email registration
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOtp = async (req, res) => {
  const { email, otp, role } = req.body;
  try {
    const pendingData = await PendingRegistration.findOne({ email, type: 'regular_signup' });
    
    if (!pendingData) return res.status(400).json({ message: 'No pending registration found for this email' });
    if (Date.now() > pendingData.otpExpiry.getTime()) return res.status(400).json({ message: 'OTP has expired' });
    if (pendingData.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // OTP matches, create the user
    const { username, password } = pendingData.registrationData;
    
    const allowedRoles = ['Chef', 'Food Lover'];
    const safeRole = allowedRoles.includes(role) ? role : 'Food Lover';

    // User model will hash plain text password in pre('save')
    const user = await User.create({ username, email, password, role: safeRole });

    // Clean up
    await PendingRegistration.deleteOne({ _id: pendingData._id });

    if (user) {
      res.status(201).json({
        _id: user._id, 
        username: user.username, 
        email: user.email,
        role: user.role, 
        bio: user.bio,
        address: user.address,
        profilePicture: user.profilePicture,
        isGoogleUser: user.isGoogleUser,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Verify Email OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const newOtp = generateOtp();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // First check if it's a pending registration
    let pending = await PendingRegistration.findOne({ email });
    if (pending) {
      pending.otp = newOtp;
      pending.otpExpiry = newExpiry;
      await pending.save();
      await sendOtpEmail(email, newOtp, 'Your new verification code', 'Verification');
      return res.json({ message: 'OTP resent successfully' });
    }

    // Next check if it's a password reset request inside User model
    let user = await User.findOne({ email, resetPasswordOtp: { $ne: null } });
    if (user) {
      user.resetPasswordOtp = newOtp;
      user.resetPasswordOtpExpiry = newExpiry;
      await user.save();
      await sendOtpEmail(email, newOtp, 'Your new reset code', 'Password reset');
      return res.json({ message: 'Password reset OTP resent successfully' });
    }

    res.status(400).json({ message: 'No active OTP request found for this email' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, username: user.username, email: user.email,
        role: user.role, bio: user.bio, address: user.address, profilePicture: user.profilePicture,
        isGoogleUser: user.isGoogleUser, token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Google OAuth — sign in or start OTP flow for new user
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  const { idToken } = req.body; // this is actually the access_token from @react-oauth/google
  try {
    // Fetch user info from Google using the access token
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists (by googleId OR email)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user && (user.googleId === googleId || user.isGoogleUser)) {
      // Existing Google user — log in directly, no OTP needed
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
      return res.json({
        _id: user._id, username: user.username, email: user.email,
        role: user.role, bio: user.bio, address: user.address, profilePicture: user.profilePicture,
        isGoogleUser: true, token: generateToken(user._id),
      });
    }

    // New Google user — send OTP and ask for role
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const isLink = !!(await User.findOne({ email }));
    const type = isLink ? 'google_link' : 'google_signup';

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        otp,
        otpExpiry,
        type,
        registrationData: { googleId, name, picture }
      },
      { upsert: true, new: true }
    );

    try {
      await sendOtpEmail(
        email,
        otp,
        'Verify your RecipeNest account',
        'Google sign-up verification'
      );
    } catch (emailError) {
      console.error('SendGrid Email Error:', emailError.message);
      return res.status(500).json({
        message: 'Account pending but OTP email failed to send.',
        sendgridError: emailError.message
      });
    }

    return res.json({ requiresOtp: true, email, name });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

// @desc    Verify OTP for Google new user + set role
// @route   POST /api/auth/google/verify-otp
// @access  Public
const verifyGoogleOtp = async (req, res) => {
  const { email, otp, role } = req.body;
  try {
    const pendingData = await PendingRegistration.findOne({ 
      email, 
      type: { $in: ['google_signup', 'google_link'] } 
    });

    if (!pendingData) return res.status(400).json({ message: 'No OTP request found' });
    if (Date.now() > pendingData.otpExpiry.getTime()) return res.status(400).json({ message: 'OTP has expired' });
    if (pendingData.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const allowedRoles = ['Chef', 'Food Lover'];
    const safeRole = allowedRoles.includes(role) ? role : 'Food Lover';

    let user;

    if (pendingData.type === 'google_link') {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.googleId = pendingData.registrationData.googleId;
      user.isGoogleUser = true;
      if (!user.profilePicture && pendingData.registrationData.picture) {
         user.profilePicture = pendingData.registrationData.picture;
      }
      await user.save();
    } else {
      user = await User.create({
        username: pendingData.registrationData.name,
        email: email,
        role: safeRole,
        isGoogleUser: true,
        googleId: pendingData.registrationData.googleId,
        profilePicture: pendingData.registrationData.picture || '',
      });
    }

    await PendingRegistration.deleteOne({ _id: pendingData._id });

    res.json({
      _id: user._id, 
      username: user.username, 
      email: user.email,
      role: user.role, 
      bio: user.bio, 
      address: user.address, 
      profilePicture: user.profilePicture,
      isGoogleUser: true, 
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify Google OTP Error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    if (req.user) {
      res.json({
        _id: req.user._id, username: req.user.username, email: req.user.email,
        role: req.user.role, bio: req.user.bio, address: req.user.address, profilePicture: req.user.profilePicture,
        isGoogleUser: req.user.isGoogleUser,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.address = req.body.address !== undefined ? req.body.address : user.address;

    if (req.body.password && !user.isGoogleUser) {
      user.password = req.body.password;
    }

    try { await user.validate(); } catch (validationError) {
      return res.status(400).json({ message: 'Validation failed', error: validationError.message });
    }

    if (req.file) {
      try {
        const streamUpload = (req) => new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'profile_picture' }, (error, result) => {
            if (result) resolve(result); else reject(error);
          });
          Readable.from(req.file.buffer).pipe(stream);
        });
        const result = await streamUpload(req);
        user.profilePicture = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: 'Error uploading image' });
      }
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    const updatedUser = await user.save();
    
    // Return full profile so frontend state stays in sync
    res.json({
      _id: updatedUser._id, 
      username: updatedUser.username, 
      email: updatedUser.email,
      role: updatedUser.role, 
      bio: updatedUser.bio, 
      address: updatedUser.address, 
      profilePicture: updatedUser.profilePicture,
      isGoogleUser: updatedUser.isGoogleUser, 
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// @desc    Forgot password — send OTP to email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });
    if (user.isGoogleUser) return res.status(400).json({ message: 'This account uses Google Sign-In. Password reset is not available.' });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp, 'Reset your RecipeNest password', 'password reset');
    res.json({ message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp) return res.status(400).json({ message: 'No password reset request found' });
    if (user.resetPasswordOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.resetPasswordOtpExpiry.getTime()) return res.status(400).json({ message: 'OTP has expired' });

    res.json({ verified: true, email });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp) return res.status(400).json({ message: 'Invalid request' });
    if (new Date() > user.resetPasswordOtpExpiry) return res.status(400).json({ message: 'OTP has expired' });
    if (user.resetPasswordOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isGoogleUser) return res.status(400).json({ message: 'Google users cannot change password' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password' });
  }
};

module.exports = {
  registerUser, verifyEmailOtp, resendOtp, loginUser, getUserProfile, updateUserProfile,
  googleAuth, verifyGoogleOtp,
  forgotPassword, verifyResetOtp, resetPassword,
  changePassword
};
