// ─────────────────────────────────────────────────────────────
// Template Routes
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const ctrl = require('../controllers/templateController');

const router = Router();

// List all templates
router.get('/', ctrl.getAllTemplates);

// Get a single template by ID
router.get('/:id', ctrl.getTemplate);

// Reload templates from disk
router.post('/reload', ctrl.reloadTemplates);

module.exports = router;
