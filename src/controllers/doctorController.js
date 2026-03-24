const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get All Doctors
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
};

// Get Single Doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await User.findById(id);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctor', error: error.message });
    }
};

// Create a New Doctor
const createDoctor = async (req, res) => {
    try {
        console.log('Create Doctor Request Received');
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { name, specialization, username, password } = req.body;

        if (!name || !specialization || !username || !password) {
            return res.status(400).json({ message: 'Name, specialization, username, and password are required' });
        }

        const doctorData = { ...req.body };
        if (req.file) {
            doctorData.profilePic = req.file.path; // Cloudinary URL
        }

        doctorData.role = 'Doctor';
        
        // Hash the provided password
        const salt = await bcrypt.genSalt(10);
        doctorData.password = await bcrypt.hash(password, salt);

        const newDoctor = new User(doctorData);
        await newDoctor.save();
        
        res.status(201).json({ message: 'Doctor created successfully', doctor: newDoctor });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Error creating doctor', error: error.message });
    }
};

// Update an Existing Doctor
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        
        const updateData = { ...req.body };
        if (req.file) {
            updateData.profilePic = req.file.path; // Cloudinary URL
        }

        if (updateData.password) {
             const salt = await bcrypt.genSalt(10);
             updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
             delete updateData.password; // Don't override if not provided
        }

        const updatedDoctor = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: 'Doctor updated successfully', doctor: updatedDoctor });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Error updating doctor', error: error.message });
    }
};

// Delete a Doctor
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDoctor = await User.findByIdAndDelete(id);

        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting doctor', error: error.message });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor
};
