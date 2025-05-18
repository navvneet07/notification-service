const express = require('express');
const router = express.Router();
const { sendNotification, getUserNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// POST /notifications - Send a notification
router.post('/', protect, sendNotification);

// GET /users/:id/notifications - Get user notifications
router.get('/users/:id/notifications', protect, getUserNotifications);

module.exports = router;