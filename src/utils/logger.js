// ─────────────────────────────────────────────────────────────
// Logger Utility
// ─────────────────────────────────────────────────────────────
// Provides structured, timestamped log output with log levels.
// Drop-in replacement for console.log with production-grade
// formatting. Easily swappable for Winston/Pino later.
// ─────────────────────────────────────────────────────────────

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Formats a log message with a timestamp and level prefix.
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - The message to log
 * @returns {string} Formatted log string
 */
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

const logger = {
  /**
   * Log an informational message.
   * @param {string} message
   */
  info(message) {
    console.log(formatMessage(LOG_LEVELS.INFO, message));
  },

  /**
   * Log a warning message.
   * @param {string} message
   */
  warn(message) {
    console.warn(formatMessage(LOG_LEVELS.WARN, message));
  },

  /**
   * Log an error message.
   * @param {string} message
   */
  error(message) {
    console.error(formatMessage(LOG_LEVELS.ERROR, message));
  },

  /**
   * Log a debug message (only in non-production environments).
   * @param {string} message
   */
  debug(message) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage(LOG_LEVELS.DEBUG, message));
    }
  },
};

module.exports = logger;
