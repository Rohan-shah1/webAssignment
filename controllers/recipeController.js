const Recipe = require('../models/Recipe');

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({}).populate('chef', 'username profilePicture');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('chef', 'username profilePicture bio');
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a recipe
// @route   POST /api/recipes
// @access  Private (Chef Admin)
const createRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image } = req.body;

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      image,
      chef: req.user._id,
    });

    const createdRecipe = await recipe.save();
    res.status(201).json(createdRecipe);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a recipe
// @route   PUT /api/recipes/:id
// @access  Private (Chef)
const updateRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image } = req.body;

    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      // Check if user is the owner
      if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to update this recipe' });
      }

      recipe.title = title || recipe.title;
      recipe.ingredients = ingredients || recipe.ingredients;
      recipe.instructions = instructions || recipe.instructions;
      recipe.image = image || recipe.image;

      const updatedRecipe = await recipe.save();
      res.json(updatedRecipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private (Chef)
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to delete this recipe' });
      }

      await recipe.deleteOne();
      res.json({ message: 'Recipe removed' });
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Like a recipe
// @route   PUT /api/recipes/:id/like
// @access  Private
const likeRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      if (recipe.likes.includes(req.user._id)) {
        // Unlike
        recipe.likes = recipe.likes.filter(id => id.toString() !== req.user._id.toString());
      } else {
        // Like
        recipe.likes.push(req.user._id);
      }

      await recipe.save();
      res.json(recipe.likes);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add comment to recipe
// @route   POST /api/recipes/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      const comment = {
        user: req.user._id,
        username: req.user.username,
        text,
      };

      recipe.comments.push(comment);
      await recipe.save();
      res.status(201).json(recipe.comments);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  addComment,
};
