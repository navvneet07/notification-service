const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./utils/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/auth', authRoutes);
app.use('/notifications', notificationRoutes);
app.get('/', (req, res) => {
  res.send('Notification Service API is running');
});

// Error Handler
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

module.exports = app;