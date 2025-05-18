const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const queueService = require('../queue/queueService');
const asyncHandler = require('express-async-handler');

// @desc    Send a notification
// @route   POST /notifications
// @access  Public (in production, this would be protected)
const sendNotification = asyncHandler(async (req, res) => {
  const { userId, type, title, content, metadata } = req.body;

  if (!userId || !type || !title || !content) {
    res.status(400);
    throw new Error('Please provide all required fields: userId, type, title, content');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user has enabled this notification type
  if (!user.notificationPreferences[type === 'in-app' ? 'inApp' : type]) {
    res.status(400);
    throw new Error(`User has disabled ${type} notifications`);
  }

  // Create notification in database
  const notification = await Notification.create({
    userId,
    type,
    title,
    content,
    status: 'pending',
    metadata: metadata || {}
  });

  // Add to queue for processing
  await queueService.addToQueue(notification);

  res.status(201).json(notification);
});

// @desc    Get user notifications
// @route   GET /users/:id/notifications
// @access  Public (in production, this would be protected)
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Optional query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const type = req.query.type;

  // Build query
  const query = { userId };
  if (status) query.status = status;
  if (type) query.type = type;
  
  // Execute query with pagination
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Notification.countDocuments(query);

  res.status(200).json({
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  sendNotification,
  getUserNotifications
};