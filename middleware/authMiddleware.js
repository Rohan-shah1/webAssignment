const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Guard
 * This middleware intercepts requests and validates the JWT in the Authorization header.
 * If valid, it attaches the User object to the request so downstream controllers
 * know exactly who is making the call.
 */
const protect = async (req, res, next) => {
  let token;

  // Most modern clients use the 'Bearer <token>' format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split 'Bearer' from the actual token string
      token = req.headers.authorization.split(' ')[1];

      // Decrypt the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user data from DB, but EXCLUDE the hashed password for security.
      // We don't want the password hash floating around in our request objects.
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Access denied. Authentication token missing.' });
  }
};

/**
 * Role-Based Access Control (RBAC) - Chef Guard
 * Ensures that the authenticated user has the 'Chef' role.
 * Used for recipe creation and management routes.
 */
const chefOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Chef') {
    next();
  } else {
    res.status(403).json({ message: 'Permission denied. Only Chefs can perform this action.' });
  }
};

/**
 * RBAC - Admin Guard
 * Strict gatekeeper for sensitive platform-wide operations (user deletion, etc.)
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Permission denied. Restricted to Administrators.' });
  }
};

/**
 * RBAC - Chef or Admin Guard
 * Allows both Chefs and Administrators to proceed.
 */
const chefOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Chef' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Permission denied. Restricted to Chefs or Administrators.' });
  }
};

module.exports = { protect, chefOnly, adminOnly, chefOrAdmin };
