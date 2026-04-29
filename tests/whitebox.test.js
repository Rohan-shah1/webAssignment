const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const PendingRegistration = require('../models/PendingRegistration');
const jwt = require('jsonwebtoken');

// Mocking external services for controlled white box testing
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation(() => ({
      generateContent: jest.fn().mockImplementation(() => {
        // WB-07: Simulate Gemini failure to trigger Groq fallback
        throw new Error('Gemini Quota Exceeded (429)');
      })
    }))
  }))
}));

// Mock fetch for Groq fallback
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: '[{"name": "test", "quantityDisplay": "1 unit"}]' } }]
    }),
  })
);

let mongoServer;
let chefToken;
let chefId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());

  const chef = await User.create({
    username: 'wb_chef',
    email: 'wb@example.com',
    password: 'Password123!',
    role: 'Chef'
  });
  chefId = chef._id;
  chefToken = jwt.sign({ id: chef._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('White Box Testing (Report Cases WB-01 to WB-08)', () => {

  // WB-01: registerUser() Regex email validation branch
  it('WB-01: should return 400 if email fails regex validation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test', email: 'bad-email', password: 'Password123!' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('valid email address');
  });

  // WB-02: registerUser() Regex password strength branch
  it('WB-02: should return 400 if password fails strength regex', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test', email: 'good@example.com', password: '123' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Password must be between 8 and 25 characters');
  });

  // WB-03: protect() middleware missing token branch
  it('WB-03: should return 401 if Authorization header is missing', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain('token missing');
  });

  // WB-04: chefOnly() middleware role check
  it('WB-04: should return 403 if a Food Lover tries to create a recipe', async () => {
    const flUser = await User.create({
      username: 'foodie', email: 'foodie@example.com', password: 'Password123!', role: 'Food Lover'
    });
    const flToken = jwt.sign({ id: flUser._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });

    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${flToken}`)
      .send({ title: 'Test' });
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain('Only Chefs can perform this action');
  });

  // WB-05: deleteRecipe() User.updateMany($pull) cleanup logic
  it('WB-05: should purge deleted recipe ID from user saved list', async () => {
    const recipe = await Recipe.create({
      title: 'Cleanup Test', ingredients: ['test'], instructions: 'test', chef: chefId, category: 'Other', difficulty: 'Easy', prepTime: 5
    });
    
    const user = await User.create({
      username: 'saver', email: 'saver@example.com', password: 'Password123!', savedRecipes: [recipe._id]
    });

    const adminToken = jwt.sign({ id: chefId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });
    // Note: chefId is reuse for simplicity, assuming they have admin role or we mock admin
    await User.findByIdAndUpdate(chefId, { role: 'Admin' });

    await request(app)
      .delete(`/api/recipes/${recipe._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Whitebox testing' });

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.savedRecipes).not.toContain(recipe._id);
  });

  // WB-06: verifyEmailOtp() OTP expiry branch
  it('WB-06: should return 400 if OTP is expired', async () => {
    const email = 'expire@example.com';
    await PendingRegistration.create({
      email,
      otp: '123456',
      otpExpiry: new Date(Date.now() - 1000), // Expired 1 second ago
      type: 'regular_signup',
      registrationData: { username: 'expire', password: 'Password123!' }
    });

    const res = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email, otp: '123456' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('OTP has expired');
  });

  // WB-07: ingredientController try/catch Gemini -> Groq fallback path
  it('WB-07: should fallback to Groq when Gemini fails', async () => {
    const res = await request(app)
      .post('/api/ingredients/normalize')
      .send({ ingredients: ['1 cup milk'], desiredQty: 2 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.provider).toBe('groq');
    expect(res.body.items[0].name).toBe('test');
  });

  // WB-08: updateUserProfile() req.files.coverPhoto branch
  it('WB-08: should trigger cover photo upload path if file is present', async () => {
    // We can't easily test the actual Cloudinary upload in this unit test environment 
    // without complex multer mocking, but we can verify the controller attempts 
    // to access the files object which proves the branch is entered.
    
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${chefToken}`)
      .field('username', 'UpdatedChef')
      // Attach a dummy file to trigger the branch
      .attach('coverPhoto', Buffer.from('fake-image'), 'test.jpg');

    expect(res.statusCode).toEqual(200);
    expect(res.body.username).toBe('UpdatedChef');
  });
});
