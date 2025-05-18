const request = require('supertest');
const app = require('../server');
const User = require('../models/userModel');

describe('Authentication Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /auth/preferences', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Create a user and get token
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      userId = user._id;

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      token = res.body.token;
    });

    it('should update notification preferences', async () => {
      const res = await request(app)
        .put('/auth/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: false,
          sms: true,
          inApp: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.notificationPreferences).toEqual({
        email: false,
        sms: true,
        inApp: true
      });
    });

    it('should not update preferences without token', async () => {
      const res = await request(app)
        .put('/auth/preferences')
        .send({
          email: false,
          sms: true,
          inApp: true
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
