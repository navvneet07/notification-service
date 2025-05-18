const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.put('/preferences', protect, updatePreferences);

module.exports = router;
