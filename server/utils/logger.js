const winston = require('winston');
const path = require('path');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
require('fs').existsSync(logDir) || require('fs').mkdirSync(logDir);

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to 'combined.log'
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      logFormat
    )
  }));
}

// Helper functions
const logInfo = (message, meta) => logger.info(message, meta);
const logError = (message, meta) => logger.error(message, meta);
const logWarn = (message, meta) => logger.warn(message, meta);
const logDebug = (message, meta) => logger.debug(message, meta);

module.exports = {
  logger,
  logInfo,
  logError,
  logWarn,
  logDebug
};
