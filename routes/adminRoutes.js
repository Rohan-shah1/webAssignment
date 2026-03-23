const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getAllRecipes } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/recipes', getAllRecipes);

module.exports = router;
