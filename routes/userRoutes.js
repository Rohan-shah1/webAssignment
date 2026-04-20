const express = require('express');
const router = express.Router();
const {
  getChefs,
  getChefById,
  toggleSavedRecipe,
  getSavedRecipes,
  toggleFollowChef,
  getFollowedChefs,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/chefs', getChefs);
router.get('/chefs/:id', getChefById);

// Saved recipes routes
router.get('/saved-recipes', protect, getSavedRecipes);
router.put('/saved-recipes/:id', protect, toggleSavedRecipe);

// Followed chef routes
router.get('/followed-chefs', protect, getFollowedChefs);
router.put('/followed-chefs/:id', protect, toggleFollowChef);

module.exports = router;
