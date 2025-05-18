const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    res.json({ error: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    notificationPreferences: {
      email: true,
      sms: phoneNumber ? true : false,
      inApp: true
    }
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      notificationPreferences: user.notificationPreferences,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      notificationPreferences: user.notificationPreferences,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    res.json({ error: 'Invalid email or password' });
  }
});

// @desc    Update user notification preferences
// @route   PUT /auth/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      notificationPreferences: updatedUser.notificationPreferences
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUser,
  loginUser,
  updatePreferences
};
