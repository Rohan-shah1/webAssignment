const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const jwt = require('jsonwebtoken');

let mongoServer;
let chefToken;
let foodLoverToken;
let adminToken;
let chefId;
let recipeId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());

  // Create chef, food lover, and admin for RBAC testing
  const chef = await User.create({
    username: 'rbacchef', email: 'rbacchef@example.com',
    password: 'Password123!', role: 'Chef'
  });
  const foodLover = await User.create({
    username: 'rbacfoodlover', email: 'rbacfoodlover@example.com',
    password: 'Password123!', role: 'Food Lover'
  });
  const admin = await User.create({
    username: 'rbacadmin', email: 'rbacadmin@example.com',
    password: 'Password123!', role: 'Admin'
  });

  chefId = chef._id;
  const secret = process.env.JWT_SECRET || 'testsecret';
  chefToken = jwt.sign({ id: chef._id }, secret, { expiresIn: '1d' });
  foodLoverToken = jwt.sign({ id: foodLover._id }, secret, { expiresIn: '1d' });
  adminToken = jwt.sign({ id: admin._id }, secret, { expiresIn: '1d' });

  // Create a recipe by the chef for deletion tests
  const recipe = await Recipe.create({
    title: 'Chef Special', ingredients: ['Sugar'], instructions: 'Mix', chef: chefId,
    category: 'Dessert', difficulty: 'Easy', prepTime: 10
  });
  recipeId = recipe._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Profile API Tests', () => {
  it('should return the user profile for an authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${chefToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.username).toBe('rbacchef');
    expect(res.body.role).toBe('Chef');
  });

  it('should deny profile access without a token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toEqual(401);
  });
});

describe('Role-Based Access Control (RBAC) Tests', () => {
  it('should allow a Food Lover to view recipes (public route)', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.statusCode).toEqual(200);
  });

  it('should prevent a Food Lover from creating a recipe', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${foodLoverToken}`)
      .send({
        title: 'Food Lover Recipe Attempt',
        ingredients: 'Air',
        instructions: 'Breathe',
        category: 'Other',
        difficulty: 'Easy',
        prepTime: 1
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe('Permission denied. Only Chefs can perform this action.');
  });

  it('should allow an Admin to delete a recipe', async () => {
    const res = await request(app)
      .delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Testing admin deletion capability' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('Data Integrity Tests', () => {
  it('should return 404 for a non-existent recipe ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/recipes/${fakeId}`);
    expect(res.statusCode).toEqual(404);
  });

  it('should reject a weak password on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'weakuser', email: 'weak@example.com', password: '123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Password must be at least 8 characters');
  });
});
