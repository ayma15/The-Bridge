const { logError } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err.stack || err.message);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'AUTHENTICATION_FAILED'
    });
  }

  // Handle rate limit exceeded
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? 'SERVER_ERROR' : err.stack
  });
};

module.exports = errorHandler;
