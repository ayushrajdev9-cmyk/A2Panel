// ─────────────────────────────────────────────────────────────
// Validator Utility
// ─────────────────────────────────────────────────────────────
// Reusable input-validation helpers used by controllers
// before passing data to services.
// ─────────────────────────────────────────────────────────────

const { ApiError } = require('./errors');

/**
 * Asserts that `value` is a non-empty string.
 * @param {*}      value     - The value to check
 * @param {string} fieldName - Name of the field (for error messages)
 * @throws {ApiError} 400 if validation fails
 */
function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError(400, `"${fieldName}" is required and must be a non-empty string.`);
  }
}

/**
 * Asserts that `value` is present (not undefined / null).
 * @param {*}      value     - The value to check
 * @param {string} fieldName - Name of the field (for error messages)
 * @throws {ApiError} 400 if validation fails
 */
function requireField(value, fieldName) {
  if (value === undefined || value === null) {
    throw new ApiError(400, `"${fieldName}" is required.`);
  }
}

/**
 * Validates that a command is allowed by the template definition.
 * Prevents arbitrary command execution — only template-whitelisted
 * commands may run.
 *
 * @param {string}   command         - The command the user wants to run
 * @param {string[]} allowedCommands - Commands the template permits
 * @throws {ApiError} 403 if the command is not allowed
 */
function validateCommand(command, allowedCommands) {
  if (!allowedCommands || !Array.isArray(allowedCommands)) {
    throw new ApiError(500, 'Template has no allowedCommands defined.');
  }

  const isAllowed = allowedCommands.some((allowed) => {
    // Match exact command or command prefix (e.g. "node" matches "node index.js")
    return command === allowed || command.startsWith(`${allowed} `);
  });

  if (!isAllowed) {
    throw new ApiError(
      403,
      `Command "${command}" is not allowed by this template. ` +
        `Allowed: [${allowedCommands.join(', ')}]`
    );
  }
}

module.exports = { requireString, requireField, validateCommand };
