const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/apply', verifyToken, leaveController.applyLeave);
router.get('/my-leaves', verifyToken, leaveController.getMyLeaves);
router.get('/all', verifyToken, leaveController.getAllLeaves);
router.put('/:id/status', verifyToken, leaveController.updateLeaveStatus);

module.exports = router;
