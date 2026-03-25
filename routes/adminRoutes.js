const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getAllRecipes } = require('../controllers/adminController');
const { updateUserProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/recipes', getAllRecipes);
router.put('/profile', upload.single('profilePicture'), updateUserProfile);

module.exports = router;
