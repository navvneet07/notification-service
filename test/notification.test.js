const request = require('supertest');
const app = require('../server');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const queueService = require('../queue/queueService');

// Mock queue service
jest.mock('../queue/queueService', () => ({
  addToQueue: jest.fn().mockResolvedValue(true)
}));

describe('Notification Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Create a user and get token
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phoneNumber: '+1234567890',
      notificationPreferences: {
        email: true,
        sms: true,
        inApp: true
      }
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

  describe('POST /notifications', () => {
    it('should create an email notification', async () => {
      const res = await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: userId,
          type: 'email',
          title: 'Test Email',
          content: 'This is a test email',
          metadata: {
            html: '<p>This is a test email</p>'
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.type).toBe('email');
      expect(res.body.status).toBe('pending');
      expect(queueService.addToQueue).toHaveBeenCalled();
    });

    it('should create an SMS notification', async () => {
      const res = await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: userId,
          type: 'sms',
          title: 'Test SMS',
          content: 'This is a test SMS'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.type).toBe('sms');
      expect(res.body.status).toBe('pending');
      expect(queueService.addToQueue).toHaveBeenCalled();
    });

    it('should not create notification for disabled type', async () => {
      // Update user preferences to disable SMS
      await User.findByIdAndUpdate(userId, {
        'notificationPreferences.sms': false
      });

      const res = await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: userId,
          type: 'sms',
          title: 'Test SMS',
          content: 'This is a test SMS'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /notifications/users/:id/notifications', () => {
    beforeEach(async () => {
      // Create some test notifications
      await Notification.create([
        {
          userId,
          type: 'email',
          title: 'Test Email 1',
          content: 'Content 1',
          status: 'sent'
        },
        {
          userId,
          type: 'sms',
          title: 'Test SMS',
          content: 'Content 2',
          status: 'pending'
        },
        {
          userId,
          type: 'in-app',
          title: 'Test Push',
          content: 'Content 3',
          status: 'failed'
        }
      ]);
    });

    it('should get all user notifications', async () => {
      const res = await request(app)
        .get(`/notifications/users/${userId}/notifications`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(3);
      expect(res.body.pagination).toHaveProperty('total', 3);
    });

    it('should filter notifications by type', async () => {
      const res = await request(app)
        .get(`/notifications/users/${userId}/notifications`)
        .query({ type: 'email' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.notifications[0].type).toBe('email');
    });

    it('should filter notifications by status', async () => {
      const res = await request(app)
        .get(`/notifications/users/${userId}/notifications`)
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.notifications[0].status).toBe('pending');
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get(`/notifications/users/${userId}/notifications`)
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });
  });
});
