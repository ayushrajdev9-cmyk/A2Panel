// ─────────────────────────────────────────────────────────────
// Panel Backend — Application Entry Point
// ─────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const serverRoutes = require('./routes/servers');
const templateRoutes = require('./routes/templates');
const { errorHandler, notFoundHandler } = require('./utils/errors');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend dashboard
app.use(express.static(path.join(__dirname, '..', 'public')));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/servers', serverRoutes);
app.use('/templates', templateRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Graceful Shutdown ────────────────────────────────────────
const processManager = require('./processManager/processManager');

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  processManager.stopAll();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Panel Backend running on http://localhost:${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🖥️  Dashboard: http://localhost:${PORT}`);
});

module.exports = app;
