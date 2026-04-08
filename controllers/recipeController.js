const Recipe = require('../models/Recipe');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// GET /api/recipes - Fetch all recipes with optional filters (search, category, difficulty)
const getRecipes = async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;

    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const recipes = await Recipe.find(query).populate('chef', 'username profilePicture');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/recipes/:id - Fetch a single recipe by ID
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

// POST /api/recipes - Create a new recipe (Requires Chef or Admin role)
const createRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image, category, difficulty, prepTime } = req.body;

    let imageUrl = image;

    // Process image file attachment if provided by the client
    if (req.file) {
      // Cloudinary stream upload wrapped in a Promise to return the secure URL.
      // A raw memory buffer pipeline is constructed to transfer data to the cloud.
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'recipes' }, (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          Readable.from(req.file.buffer).pipe(stream);
        });
      };
      const result = await streamUpload(req);
      imageUrl = result.secure_url;
    }

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      image: imageUrl,
      category,
      difficulty,
      prepTime,
      chef: req.user._id,
    });

    const createdRecipe = await recipe.save();
    res.status(201).json(createdRecipe);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/recipes/:id - Update an existing recipe (Requires Chef Owner or Admin)
const updateRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image, category, difficulty, prepTime } = req.body;

    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      // Check if user is the owner
      if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to update this recipe' });
      }

      let imageUrl = recipe.image;
      
      if (req.file) {
        const streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'recipes' }, (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            });
            Readable.from(req.file.buffer).pipe(stream);
          });
        };
        const result = await streamUpload(req);
        imageUrl = result.secure_url;
      } else if (image !== undefined) {
        imageUrl = image;
      }

      recipe.title = title || recipe.title;
      recipe.ingredients = ingredients || recipe.ingredients;
      recipe.instructions = instructions || recipe.instructions;
      recipe.image = imageUrl;
      recipe.category = category || recipe.category;
      recipe.difficulty = difficulty || recipe.difficulty;
      recipe.prepTime = prepTime !== undefined ? prepTime : recipe.prepTime;

      const updatedRecipe = await recipe.save();
      res.json(updatedRecipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/recipes/:id - Delete a recipe (Requires Chef Owner or Admin)
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

// PUT /api/recipes/:id/like - Toggle like on a recipe (Requires Authentication)
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

// POST /api/recipes/:id/comment - Add a comment to a recipe (Requires Authentication)
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
