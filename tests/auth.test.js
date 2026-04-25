const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // We need to export app from server.js
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect(); // Disconnect from real DB
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication API Tests', () => {
  it('should register a new user pending verification', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'OTP sent to email');
    
    const pending = await PendingRegistration.findOne({ email: 'test@example.com' });
    expect(pending).not.toBeNull();
    expect(pending.registrationData.username).toBe('testuser');
  });

  it('should fail registration with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!'
      });
    
    expect(res.statusCode).toEqual(400);
  });

  it('should login an existing user', async () => {
    // Create a dummy user
    const user = await User.create({
      username: 'loginuser',
      email: 'login@example.com',
      password: 'Password123!',
      role: 'Food Lover'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('loginuser');
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'WrongPassword!'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('should fail registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test2@example.com'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Please provide valid username, email, and password');
  });
});
