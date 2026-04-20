const User = require('../models/User');
const Recipe = require('../models/Recipe');

// @desc    Get all chefs
// @route   GET /api/users/chefs
// @access  Public
const getChefs = async (req, res) => {
  try {
    const chefs = await User.find({ role: 'Chef' }).select('-password');
    res.json(chefs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get chef by ID (Profile)
// @route   GET /api/users/chefs/:id
// @access  Public
const getChefById = async (req, res) => {
  try {
    const chef = await User.findById(req.params.id).select('-password');

    if (!chef) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (chef.role !== 'Chef') {
      return res.status(404).json({ message: 'User is not a chef' });
    }

    const recipes = await Recipe.find({ chef: chef._id });
    const followersCount = await User.countDocuments({ followedChefs: chef._id });
    res.json({ chef, recipes, followersCount });
  } catch (error) {
    console.error('Get Chef Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle saving a recipe
// @route   PUT /api/users/saved-recipes/:id
// @access  Private
const toggleSavedRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if already saved
    const isSaved = user.savedRecipes.includes(recipeId);

    if (isSaved) {
      // Remove from saved recipes
      user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
    } else {
      // Add to saved recipes
      user.savedRecipes.push(recipeId);
    }

    await user.save();
    res.json(user.savedRecipes);
  } catch (error) {
    console.error('Toggle Saved Recipe Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all saved recipes for a user
// @route   GET /api/users/saved-recipes
// @access  Private
const getSavedRecipes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedRecipes');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.savedRecipes);
  } catch (error) {
    console.error('Get Saved Recipes Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle follow/unfollow a chef
// @route   PUT /api/users/followed-chefs/:id
// @access  Private
const toggleFollowChef = async (req, res) => {
  try {
    const chefId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === chefId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const chef = await User.findById(chefId);
    if (!chef || chef.role !== 'Chef') {
      return res.status(404).json({ message: 'Chef not found' });
    }

    const isFollowing = user.followedChefs.some((id) => id.toString() === chefId);
    if (isFollowing) {
      user.followedChefs = user.followedChefs.filter((id) => id.toString() !== chefId);
    } else {
      user.followedChefs.push(chefId);
    }

    await user.save();
    const followersCount = await User.countDocuments({ followedChefs: chefId });
    res.json({
      followedChefs: user.followedChefs,
      isFollowing: !isFollowing,
      followersCount,
    });
  } catch (error) {
    console.error('Toggle Follow Chef Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get followed chefs for logged in user
// @route   GET /api/users/followed-chefs
// @access  Private
const getFollowedChefs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'followedChefs',
      select: 'username bio profilePicture role',
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.followedChefs.filter((c) => c.role === 'Chef'));
  } catch (error) {
    console.error('Get Followed Chefs Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getChefs,
  getChefById,
  toggleSavedRecipe,
  getSavedRecipes,
  toggleFollowChef,
  getFollowedChefs,
};
