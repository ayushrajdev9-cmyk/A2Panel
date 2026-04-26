// ─────────────────────────────────────────────────────────────
// Server Routes
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const ctrl = require('../controllers/serverController');

const router = Router();

// Create a new server from a template
router.post('/create', ctrl.createServer);

// Start a server
router.post('/start', ctrl.startServer);

// Stop a server
router.post('/stop', ctrl.stopServer);

// List all servers
router.get('/', ctrl.getAllServers);

// Get a single server
router.get('/:id', ctrl.getServer);

// Get server logs
router.get('/:id/logs', ctrl.getServerLogs);

// Delete a server
router.delete('/:id', ctrl.deleteServer);

module.exports = router;
