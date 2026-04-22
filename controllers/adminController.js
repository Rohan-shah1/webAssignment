const User = require('../models/User');
const Recipe = require('../models/Recipe');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'Admin' } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.deleteOne({ _id: req.params.id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all recipes
// @route   GET /api/admin/recipes
// @access  Private/Admin
const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({}).populate('chef', 'username email');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllRecipes,
};
