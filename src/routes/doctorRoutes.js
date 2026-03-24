const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage: storage });

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', verifyToken, upload.single('profilePic'), doctorController.createDoctor);
router.put('/:id', verifyToken, upload.single('profilePic'), doctorController.updateDoctor);
router.delete('/:id', verifyToken, doctorController.deleteDoctor);

module.exports = router;
