const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const jwt = require('jsonwebtoken');

let mongoServer;
let userToken;
let chefId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Create a dummy chef user
  const chef = await User.create({
    username: 'testchef',
    email: 'chef@example.com',
    password: 'Password123!',
    role: 'Chef'
  });
  chefId = chef._id;
  userToken = jwt.sign({ id: chef._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });

  // Create a dummy recipe
  await Recipe.create({
    title: 'Test Recipe',
    ingredients: ['1 cup flour', '2 eggs'],
    instructions: 'Mix and bake',
    chef: chefId,
    category: 'Dessert',
    difficulty: 'Easy',
    prepTime: 30
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Recipe API Tests', () => {
  it('should fetch all recipes successfully', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe('Test Recipe');
  });

  it('should fetch a single recipe by ID', async () => {
    const recipe = await Recipe.findOne({ title: 'Test Recipe' });
    const res = await request(app).get(`/api/recipes/${recipe._id}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toBe('Test Recipe');
    expect(res.body.chef.username).toBe('testchef');
  });

  it('should allow a Chef to create a new recipe', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'New Pancake',
        ingredients: 'Flour, Milk, Eggs',
        instructions: 'Cook on pan',
        category: 'Breakfast',
        difficulty: 'Easy',
        prepTime: 15
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toBe('New Pancake');
  });

  it('should fail to create recipe without authentication', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({
        title: 'Unauthorized Recipe',
        ingredients: 'Air',
        instructions: 'Nothing'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Access denied. Authentication token missing.');
  });
});
