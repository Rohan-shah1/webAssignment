const Recipe = require('../models/Recipe');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const normalizeIngredients = (ingredients) => {
  if (Array.isArray(ingredients)) {
    return ingredients
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof ingredients === 'string') {
    return ingredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
};

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
    const { title, ingredients, instructions, image, category, difficulty, prepTime, baseQty, baseUnit } = req.body;

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
      ingredients: normalizeIngredients(ingredients),
      instructions,
      image: imageUrl,
      category,
      difficulty,
      prepTime,
      baseQty: baseQty ? Number(baseQty) : 1,
      baseUnit: baseUnit || 'kg',
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
    const { title, ingredients, instructions, image, category, difficulty, prepTime, baseQty, baseUnit } = req.body;

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
      if (ingredients !== undefined) {
        const normalized = normalizeIngredients(ingredients);
        recipe.ingredients = normalized.length ? normalized : recipe.ingredients;
      }
      recipe.instructions = instructions || recipe.instructions;
      recipe.image = imageUrl;
      recipe.category = category || recipe.category;
      recipe.difficulty = difficulty || recipe.difficulty;
      recipe.prepTime = prepTime !== undefined ? prepTime : recipe.prepTime;
      recipe.baseQty = baseQty !== undefined ? Number(baseQty) : recipe.baseQty;
      recipe.baseUnit = baseUnit !== undefined ? baseUnit : recipe.baseUnit;

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

      const { reason } = req.body;
      if (req.user.role === 'Admin' && reason) {
        console.log(`[ADMIN ACTION] Recipe "${recipe.title}" deleted by Admin ${req.user.username}. Reason: ${reason}`);
        // Here you could also send an email to the chef or save to a log model
      }

      await recipe.deleteOne();
      res.json({ message: 'Recipe removed successfully' });
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
        profilePicture: req.user.profilePicture || '',
        text,
        reactions: [],
        replies: [],
      };

      recipe.comments.push(comment);
      await recipe.save();

      // Return the updated recipe for full state sync
      const updatedRecipe = await Recipe.findById(req.params.id).populate('chef', 'username profilePicture bio');
      
      // Emit real-time update to everyone in this recipe room
      const io = req.app.get('io');
      io.to(req.params.id).emit('recipe_updated', updatedRecipe);

      res.status(201).json(updatedRecipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/recipes/:id/comment/:commentId/react - Toggle emoji reaction on a comment
const reactToComment = async (req, res) => {
  try {
    const { emoji } = req.body;
    const ALLOWED = ['❤️', '😂', '😮', '😢', '👏', '🔥'];
    if (!ALLOWED.includes(emoji)) return res.status(400).json({ message: 'Invalid emoji' });

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();
    const existing = comment.reactions.find(r => r.user.toString() === userId);

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji — remove reaction (toggle off)
        comment.reactions = comment.reactions.filter(r => r.user.toString() !== userId);
      } else {
        // Different emoji — switch reaction
        existing.emoji = emoji;
      }
    } else {
      comment.reactions.push({ user: req.user._id, emoji });
    }

    await recipe.save();
    const updatedRecipe = await Recipe.findById(req.params.id).populate('chef', 'username profilePicture bio');

    // Real-time sync for reactions
    const io = req.app.get('io');
    io.to(req.params.id).emit('recipe_updated', updatedRecipe);

    res.json(updatedRecipe);
  } catch (error) {
    console.error('ReactToComment Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/recipes/:id/comment/:commentId/reply - Chef replies to a comment
const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Only the chef who owns the recipe (or Admin) can reply
    if (
      recipe.chef.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Only the chef can reply to comments' });
    }

    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({
      user: req.user._id,
      username: req.user.username,
      profilePicture: req.user.profilePicture || '',
      text,
    });

    await recipe.save();
    const updatedRecipe = await Recipe.findById(req.params.id).populate('chef', 'username profilePicture bio');

    // Real-time sync for chef replies
    const io = req.app.get('io');
    io.to(req.params.id).emit('recipe_updated', updatedRecipe);

    res.status(201).json(updatedRecipe);
  } catch (error) {
    console.error('ReplyToComment Error:', error);
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
  reactToComment,
  replyToComment,
};
