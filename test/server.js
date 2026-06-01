const express = require('express');
const app = express();

// Apply middleware
app.use(express.json());

// Import routes
const authRoutes = require('../server/routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Export the Express app for testing
module.exports = app;
