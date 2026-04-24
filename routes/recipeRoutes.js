const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  addComment,
  reactToComment,
  replyToComment,
} = require('../controllers/recipeController');
const { protect, chefOnly, chefOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: List of recipes
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, ingredients, instructions]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               ingredients: { type: string, description: "JSON stringified array" }
 *               instructions: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Recipe created
 */
router.route('/')
  .get(getRecipes)
  .post(protect, chefOnly, upload.single('image'), createRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recipe details
 *   put:
 *     summary: Update recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Recipe updated
 *   delete:
 *     summary: Delete recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recipe deleted
 */
router.route('/:id')
  .get(getRecipeById)
  .put(protect, chefOrAdmin, upload.single('image'), updateRecipe)
  .delete(protect, chefOrAdmin, deleteRecipe);

router.put('/:id/like', protect, likeRecipe);
router.post('/:id/comment', protect, addComment);
router.put('/:id/comment/:commentId/react', protect, reactToComment);
router.post('/:id/comment/:commentId/reply', protect, replyToComment);

module.exports = router;
