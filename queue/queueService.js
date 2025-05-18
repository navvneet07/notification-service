const amqp = require('amqplib');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const inAppService = require('../services/inAppService');

let channel, connection;
const QUEUE_NAME = 'notifications';
const MAX_RETRIES = 3;

// Initialize RabbitMQ connection
const init = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    
    console.log('RabbitMQ connection established');
    
    // Start consuming messages
    channel.consume(QUEUE_NAME, processNotification, { noAck: false });
    console.log('Notification queue processor started');
  } catch (error) {
    console.error('RabbitMQ connection error:', error.message);
    // Retry connection after delay
    setTimeout(init, 5000);
  }
};

// Add notification to queue
const addToQueue = async (notification) => {
  try {
    if (!channel) {
      console.log('RabbitMQ channel not ready, initializing connection...');
      await init();
    }
    
    const message = JSON.stringify({
      notificationId: notification._id.toString()
    });
    
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
      persistent: true
    });
    
    console.log(`Notification ${notification._id} added to queue`);
    return true;
  } catch (error) {
    console.error('Error adding to queue:', error.message);
    return false;
  }
};

// Process notification from queue
const processNotification = async (msg) => {
  try {
    const content = JSON.parse(msg.content.toString());
    const notificationId = content.notificationId;
    
    console.log(`Processing notification ${notificationId}`);
    
    // Get notification from database
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      console.log(`Notification ${notificationId} not found`);
      channel.ack(msg);
      return;
    }
    
    // Get user
    const user = await User.findById(notification.userId);
    if (!user) {
      console.log(`User ${notification.userId} not found`);
      notification.status = 'failed';
      notification.metadata.error = 'User not found';
      await notification.save();
      channel.ack(msg);
      return;
    }
    
    let result;
    
    // Send notification based on type
    switch (notification.type) {
      case 'email':
        result = await emailService.sendEmail(user, notification);
        break;
      case 'sms':
        result = await smsService.sendSMS(user, notification);
        break;
      case 'in-app':
        result = await inAppService.sendInAppNotification(user, notification);
        break;
      default:
        result = { success: false, error: 'Unknown notification type' };
    }
    
    if (result.success) {
      notification.status = 'sent';
      await notification.save();
      channel.ack(msg);
    } else {
      // Handle failed notification (retry logic)
      notification.retryCount += 1;
      
      if (notification.retryCount >= MAX_RETRIES) {
        notification.status = 'failed';
        notification.metadata.error = result.error;
        await notification.save();
        channel.ack(msg);
      } else {
        // Save the updated retry count
        await notification.save();
        
        // Requeue with exponential backoff
        const delay = 1000 * Math.pow(2, notification.retryCount);
        setTimeout(() => {
          addToQueue(notification);
        }, delay);
        
        channel.ack(msg);
      }
    }
  } catch (error) {
    console.error('Error processing notification:', error.message);
    // Negative acknowledgment, message will be requeued
    channel.nack(msg);
  }
};

module.exports = {
  init,
  addToQueue
};