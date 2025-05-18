const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const inAppService = require('../services/inAppService');

// Mock environment variables
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.TWILIO_ACCOUNT_SID = 'test_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_token';
process.env.TWILIO_PHONE_NUMBER = '+15555555555';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-email-id' })
  })
}));

jest.mock('twilio', () => () => ({
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'test-sms-id' })
  }
}));

const mockSend = jest.fn().mockResolvedValue('test-fcm-id');
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn()
  },
  initializeApp: jest.fn(),
  messaging: () => ({
    send: mockSend
  })
}));

// Reset mocks before each test
beforeEach(() => {
  mockSend.mockClear();
  mockSend.mockResolvedValue('test-fcm-id');
});

describe('Notification Services', () => {
  describe('Email Service', () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const mockNotification = {
      title: 'Test Email',
      content: 'This is a test email',
      metadata: {
        html: '<p>This is a test email</p>'
      }
    };

    it('should send email successfully', async () => {
      const result = await emailService.sendEmail(mockUser, mockNotification);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });

    it('should handle email sending failure', async () => {
      const mockTransport = require('nodemailer').createTransport();
      mockTransport.sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      const result = await emailService.sendEmail(mockUser, mockNotification);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email');
    });
  });

  describe('SMS Service', () => {
    const mockUser = {
      phoneNumber: '+1234567890',
      name: 'Test User'
    };

    const mockNotification = {
      title: 'Test SMS',
      content: 'This is a test SMS'
    };

    it('should send SMS successfully', async () => {
      const result = await smsService.sendSMS(mockUser, mockNotification);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });

    it('should handle missing phone number', async () => {
      const result = await smsService.sendSMS({ name: 'Test User' }, mockNotification);
      expect(result.success).toBe(false);
      expect(result.error).toBe('User has no phone number');
    });

    it('should handle invalid phone number format', async () => {
      const mockTwilio = require('twilio')();
      mockTwilio.messages.create.mockRejectedValueOnce(new Error('Invalid phone number format'));
      
      const result = await smsService.sendSMS(
        { phoneNumber: 'invalid', name: 'Test User' },
        mockNotification
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });
  });

  describe('In-App Service', () => {
    const mockUser = {
      deviceToken: 'test-device-token',
      name: 'Test User'
    };

    const mockNotification = {
      _id: 'test-notification-id',
      title: 'Test Push',
      content: 'This is a test push notification',
      type: 'in-app'
    };

    it('should send push notification successfully', async () => {
      const result = await inAppService.sendInAppNotification(mockUser, mockNotification);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });

    it('should handle missing device token', async () => {
      const result = await inAppService.sendInAppNotification(
        { name: 'Test User' },
        mockNotification
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe('User has no device token');
    });

    it('should handle FCM sending failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('FCM error'));

      const result = await inAppService.sendInAppNotification(mockUser, mockNotification);
      expect(result.success).toBe(false);
      expect(result.error).toContain('FCM error');
    });
  });
});
