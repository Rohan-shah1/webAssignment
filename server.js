require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./src/config/db');
const doctorRoutes = require('./src/routes/doctorRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

console.log('--- Environment Check ---');
console.log('ADMIN_USER:', process.env.ADMIN_USER);
console.log('ADMIN_PASS Loaded:', !!process.env.ADMIN_PASS);
console.log('JWT_SECRET Loaded:', !!process.env.JWT_SECRET);
console.log('MONGODB_URI Loaded:', !!process.env.MONGODB_URI);
console.log('-------------------------');

// Middleware
app.use(cors()); // Allow all origins for the assignment
app.use(express.json());

// Serve static files from 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
const leaveRoutes = require('./src/routes/leaveRoutes');
app.use('/api/leave', leaveRoutes);

// General Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
