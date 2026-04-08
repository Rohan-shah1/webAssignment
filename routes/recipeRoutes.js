const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  addComment
} = require('../controllers/recipeController');
const { protect, chefOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getRecipes)
  .post(protect, chefOnly, upload.single('image'), createRecipe);

router.route('/:id')
  .get(getRecipeById)
  .put(protect, chefOnly, upload.single('image'), updateRecipe)
  .delete(protect, chefOnly, deleteRecipe);

router.put('/:id/like', protect, likeRecipe);
router.post('/:id/comment', protect, addComment);

module.exports = router;
