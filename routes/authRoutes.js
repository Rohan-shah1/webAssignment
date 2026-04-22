const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser, getUserProfile, updateUserProfile,
  googleAuth, verifyGoogleOtp,
  verifyEmailOtp, resendOtp,
  forgotPassword, verifyResetOtp, resetPassword, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('profilePicture'), updateUserProfile);

router.put('/change-password', protect, changePassword);

// Google OAuth routes
router.post('/google', googleAuth);
router.post('/google/verify-otp', verifyGoogleOtp);

// Forgot / Reset password routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
