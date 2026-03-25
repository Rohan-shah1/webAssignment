const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  // Admin role cannot be assigned via registration

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Prevent Admin role from being assigned via registration
    const allowedRoles = ['Chef', 'Food Lover'];
    const safeRole = allowedRoles.includes(role) ? role : 'Food Lover';

    const user = await User.create({
      username,
      email,
      password,
      role: safeRole,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePicture: user.profilePicture,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // req.user is already populated by the 'protect' middleware
    if (req.user) {
      res.json({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

      if (req.body.password) {
        user.password = req.body.password;
      }

      // 1. Run validation BEFORE Cloudinary upload
      try {
        await user.validate();
      } catch (validationError) {
        console.error('Validation Error before upload:', validationError);
        return res.status(400).json({
          message: 'Validation failed',
          error: validationError.message
        });
      }

      // 2. Handle file upload to Cloudinary ONLY if validation passed
      if (req.file) {
        try {
          const streamUpload = (req) => {
            return new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream({ folder: 'profile_picture' }, (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              });
              Readable.from(req.file.buffer).pipe(stream);
            });
          };

          const result = await streamUpload(req);
          user.profilePicture = result.secure_url;
        } catch (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ message: 'Error uploading image to Cloudinary', error: error.message });
        }
      } else if (req.body.profilePicture) {
        user.profilePicture = req.body.profilePicture;
      }

      // 3. Final save
      try {
        const updatedUser = await user.save();
        console.log('User saved successfully:', updatedUser._id);
        console.log('New profilePicture in DB:', updatedUser.profilePicture);

        res.json({
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          bio: updatedUser.bio,
          profilePicture: updatedUser.profilePicture,
          token: generateToken(updatedUser._id),
        });
      } catch (saveError) {
        res.status(500).json({
          message: 'Error saving profile',
          error: saveError.message,
          stack: saveError.stack
        });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Server error updating profile',
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
