// ─────────────────────────────────────────────────────────────
// Template Service
// ─────────────────────────────────────────────────────────────
// Loads, caches, and queries template JSON files from the
// /templates directory. Templates are read once at startup
// and served from memory for speed.
// ─────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// In-memory template cache  —  Map<templateId, templateObject>
const templateCache = new Map();

/**
 * Scans the /templates directory and loads every .json file
 * into the cache. Called once at module load time.
 */
function loadTemplates() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      const template = JSON.parse(raw);

      if (!template.id) {
        logger.warn(`Template file "${file}" is missing an "id" field — skipped.`);
        continue;
      }

      templateCache.set(template.id, template);
      logger.info(`📦 Loaded template: ${template.name} (${template.id})`);
    } catch (err) {
      logger.error(`Failed to load template "${file}": ${err.message}`);
    }
  }

  logger.info(`✅ ${templateCache.size} template(s) loaded.`);
}

// ── Public API ───────────────────────────────────────────────

/**
 * Returns all loaded templates as an array.
 * @returns {object[]}
 */
function getAll() {
  return Array.from(templateCache.values());
}

/**
 * Returns a single template by its ID.
 * @param {string} templateId
 * @returns {object}
 * @throws {ApiError} 404 if the template doesn't exist
 */
function getById(templateId) {
  const template = templateCache.get(templateId);
  if (!template) {
    throw new ApiError(404, `Template "${templateId}" not found.`);
  }
  return template;
}

/**
 * Reloads all templates from disk (useful after adding new JSON files at runtime).
 */
function reload() {
  templateCache.clear();
  loadTemplates();
}

// Load on first require
loadTemplates();

module.exports = { getAll, getById, reload };
