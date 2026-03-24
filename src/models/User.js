const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'Doctor', 'Nurse'],
        default: 'Doctor'
    },
    specialization: {
        type: String,
    },
    department: {
        type: String,
    },
    schedule: {
        type: String,
    },
    availability: {
        type: String,
        enum: ['Available', 'Busy', 'On Leave'],
        default: 'Available'
    },
    roomNumber: {
        type: String,
    },
    profilePic: {
        type: String, // Cloudinary URL
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
