// ─────────────────────────────────────────────────────────────
// Template Controller
// ─────────────────────────────────────────────────────────────

const templateService = require('../services/templateService');

/**
 * GET /templates
 */
async function getAllTemplates(_req, res, next) {
  try {
    const templates = templateService.getAll();
    res.json({ success: true, data: templates, count: templates.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /templates/:id
 */
async function getTemplate(req, res, next) {
  try {
    const template = templateService.getById(req.params.id);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /templates/reload
 */
async function reloadTemplates(_req, res, next) {
  try {
    templateService.reload();
    const templates = templateService.getAll();
    res.json({
      success: true,
      message: `Reloaded ${templates.length} template(s).`,
      data: templates,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllTemplates, getTemplate, reloadTemplates };
