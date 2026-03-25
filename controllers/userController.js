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
    res.json({ chef, recipes });
  } catch (error) {
    console.error('Get Chef Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getChefs,
  getChefById,
};
