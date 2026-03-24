const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt: user="${username}"`);

        // Check for Admin Hardcoded credentials First (Fallback / Master Admin)
        if (username === process.env.ADMIN_USER) {
            const isMatch = (password === process.env.ADMIN_PASS);
            if (isMatch) {
                const token = jwt.sign({ username: process.env.ADMIN_USER, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
                return res.json({ token, role: 'Admin', message: 'Admin login successful' });
            }
        }

        // If not hardcoded admin, check MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role, roomNumber: user.roomNumber },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.role, id: user._id, message: 'Login successful' });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { login };
