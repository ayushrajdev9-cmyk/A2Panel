// ─────────────────────────────────────────────────────────────
// Server Controller
// ─────────────────────────────────────────────────────────────
// Thin HTTP layer — validates input, delegates to the service,
// and sends JSON responses. No business logic lives here.
// ─────────────────────────────────────────────────────────────

const serverService = require('../services/serverService');
const { requireString } = require('../utils/validator');

/**
 * POST /servers/create
 * Body: { templateId: string, name?: string }
 */
async function createServer(req, res, next) {
  try {
    const { templateId, name } = req.body;
    requireString(templateId, 'templateId');

    const server = serverService.createServer(templateId, name);

    res.status(201).json({
      success: true,
      message: `Server created using template "${server.templateName}".`,
      data: server,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /servers/start
 * Body: { serverId: string }
 */
async function startServer(req, res, next) {
  try {
    const { serverId } = req.body;
    requireString(serverId, 'serverId');

    const server = serverService.startServer(serverId);

    res.json({
      success: true,
      message: `Server "${server.name}" started.`,
      data: server,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /servers/stop
 * Body: { serverId: string }
 */
async function stopServer(req, res, next) {
  try {
    const { serverId } = req.body;
    requireString(serverId, 'serverId');

    const server = serverService.stopServer(serverId);

    res.json({
      success: true,
      message: `Server "${server.name}" is stopping.`,
      data: server,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /servers/:id
 */
async function deleteServer(req, res, next) {
  try {
    const { id } = req.params;
    const server = serverService.deleteServer(id);

    res.json({
      success: true,
      message: `Server "${server.name}" deleted.`,
      data: { id: server.id },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /servers
 */
async function getAllServers(_req, res, next) {
  try {
    const servers = serverService.getAllServers();

    res.json({
      success: true,
      data: servers,
      count: servers.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /servers/:id
 */
async function getServer(req, res, next) {
  try {
    const { id } = req.params;
    const server = serverService.getServer(id);

    res.json({
      success: true,
      data: server,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /servers/:id/logs?limit=100
 */
async function getServerLogs(req, res, next) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = serverService.getServerLogs(id, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createServer,
  startServer,
  stopServer,
  deleteServer,
  getAllServers,
  getServer,
  getServerLogs,
};
