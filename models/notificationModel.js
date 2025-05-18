const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'in-app']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'sent', 'failed']
  },
  retryCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);