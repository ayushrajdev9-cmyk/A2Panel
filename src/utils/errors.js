// ─────────────────────────────────────────────────────────────
// Error Handling Utilities
// ─────────────────────────────────────────────────────────────
// Custom error class for API errors and Express error-handling
// middleware. Centralises all error responses.
// ─────────────────────────────────────────────────────────────

const logger = require('./logger');

/**
 * Custom API error class with an HTTP status code.
 * Throw this from any service/controller and the global
 * error handler will format the response automatically.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - Human-readable error message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Express middleware — catches requests that don't match any route.
 */
function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.url}`));
}

/**
 * Global Express error handler.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log every error; stack trace only for unexpected (500) errors
  if (statusCode === 500) {
    logger.error(`${message}\n${err.stack}`);
  } else {
    logger.warn(`${statusCode} — ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
    },
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
