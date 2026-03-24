const Leave = require('../models/Leave');

// Apply for leave (Staff)
const applyLeave = async (req, res) => {
    try {
        const { reason, startDate, endDate } = req.body;
        const staffId = req.user.id; 

        if (!reason || !startDate || !endDate) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newLeave = new Leave({
            staffId,
            reason,
            startDate,
            endDate
        });

        await newLeave.save();
        res.status(201).json({ message: 'Leave application submitted', leave: newLeave });
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

// Get my leaves (Staff)
const getMyLeaves = async (req, res) => {
    try {
        const staffId = req.user.id;
        const leaves = await Leave.find({ staffId }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get all leaves (Admin)
const getAllLeaves = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        const leaves = await Leave.find().populate('staffId', 'name role department');
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave applications', error: error.message });
    }
};

// Update leave status (Admin)
const updateLeaveStatus = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updatedLeave = await Leave.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!updatedLeave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        res.status(200).json({ message: `Leave ${status.toLowerCase()}`, leave: updatedLeave });
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus };
