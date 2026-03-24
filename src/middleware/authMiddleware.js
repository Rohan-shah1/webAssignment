const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Usually "Bearer TOKEN"
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
