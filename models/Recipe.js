const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  ingredients: [{
    type: String,
    required: true,
  }],
  instructions: {
    type: String,
    required: true,
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  image: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Other'],
    default: 'Other',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  prepTime: {
    type: Number,
    default: 0,
  },
  baseQty: {
    type: Number,
    default: 1,
  },
  baseUnit: {
    type: String,
    default: 'kg',
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    profilePicture: { type: String, default: '' },
    text: {
      type: String,
      required: true
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String, enum: ['❤️', '😂', '😮', '😢', '👏', '🔥'] }
    }],
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      profilePicture: { type: String, default: '' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
