// ─────────────────────────────────────────────────────────────
// Server Service
// ─────────────────────────────────────────────────────────────
// Business logic for creating, starting, stopping, and
// querying managed servers. Orchestrates the template service,
// process manager, and file system operations.
// ─────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const templateService = require('./templateService');
const processManager = require('../processManager/processManager');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

// In-memory server registry — Map<serverId, serverRecord>
const servers = new Map();

// Base directory where server working directories are created
const SERVERS_DIR = path.join(process.cwd(), 'servers');

// Ensure the servers directory exists
if (!fs.existsSync(SERVERS_DIR)) {
  fs.mkdirSync(SERVERS_DIR, { recursive: true });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Creates a new server from a template.
 *
 * 1. Validates that the template exists
 * 2. Generates a unique ID and working directory
 * 3. Writes the template's default files to disk
 * 4. Registers the server in the in-memory store
 *
 * @param {string} templateId - ID of the template to use
 * @param {string} [name]     - Optional human-friendly name
 * @returns {object}          - The created server record
 */
function createServer(templateId, name) {
  const template = templateService.getById(templateId);

  const serverId = uuidv4();
  const serverName = name || `${template.name} — ${serverId.slice(0, 8)}`;
  const serverDir = path.join(SERVERS_DIR, serverId);

  // Create the working directory
  fs.mkdirSync(serverDir, { recursive: true });

  // Write default files from the template
  if (template.defaultFiles) {
    for (const [filePath, content] of Object.entries(template.defaultFiles)) {
      const fullPath = path.join(serverDir, filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }

  const record = {
    id: serverId,
    name: serverName,
    templateId: template.id,
    templateName: template.name,
    runtime: template.runtime,
    startCommand: template.startCommand,
    allowedCommands: template.allowedCommands,
    environment: template.environment || {},
    directory: serverDir,
    status: 'stopped',
    createdAt: new Date().toISOString(),
  };

  servers.set(serverId, record);
  logger.info(`🆕 Server created: ${serverName} (${serverId}) using template "${template.id}"`);

  return record;
}

/**
 * Starts a stopped server.
 *
 * @param {string} serverId
 * @returns {object} Updated server record
 */
function startServer(serverId) {
  const server = getServerOrThrow(serverId);

  if (server.status === 'running') {
    throw new ApiError(409, `Server "${serverId}" is already running.`);
  }

  const { pid } = processManager.startProcess(
    serverId,
    server.startCommand,
    server.directory,
    server.environment
  );

  server.status = 'running';
  server.pid = pid;
  server.startedAt = new Date().toISOString();

  logger.info(`▶️  Server started: ${server.name} (PID ${pid})`);
  return server;
}

/**
 * Stops a running server.
 *
 * @param {string} serverId
 * @returns {object} Updated server record
 */
function stopServer(serverId) {
  const server = getServerOrThrow(serverId);

  if (server.status !== 'running') {
    throw new ApiError(409, `Server "${serverId}" is not running.`);
  }

  processManager.stopProcess(serverId);

  server.status = 'stopping';
  server.stoppedAt = new Date().toISOString();

  // Poll for actual stop
  setTimeout(() => {
    const processStatus = processManager.getStatus(serverId);
    if (processStatus && processStatus.status === 'stopped') {
      server.status = 'stopped';
    }
  }, 6000);

  logger.info(`⏹️  Server stopping: ${server.name}`);
  return server;
}

/**
 * Deletes a server (must be stopped first).
 *
 * @param {string} serverId
 * @returns {object} Deleted server record
 */
function deleteServer(serverId) {
  const server = getServerOrThrow(serverId);

  if (server.status === 'running') {
    throw new ApiError(409, `Cannot delete server "${serverId}" while it is running. Stop it first.`);
  }

  // Clean up the working directory
  if (fs.existsSync(server.directory)) {
    fs.rmSync(server.directory, { recursive: true, force: true });
  }

  processManager.removeProcess(serverId);
  servers.delete(serverId);

  logger.info(`🗑️  Server deleted: ${server.name} (${serverId})`);
  return server;
}

/**
 * Returns all servers as an array.
 * @returns {object[]}
 */
function getAllServers() {
  const result = [];
  for (const [id, server] of servers) {
    // Sync the status from the process manager
    const ps = processManager.getStatus(id);
    if (ps) {
      server.status = ps.status;
      server.pid = ps.pid;
    }
    result.push(server);
  }
  return result;
}

/**
 * Returns a single server by ID.
 * @param {string} serverId
 * @returns {object}
 */
function getServer(serverId) {
  const server = getServerOrThrow(serverId);

  // Sync status
  const ps = processManager.getStatus(serverId);
  if (ps) {
    server.status = ps.status;
    server.pid = ps.pid;
  }

  return server;
}

/**
 * Returns captured logs for a server.
 *
 * @param {string} serverId
 * @param {number} [limit=100]
 * @returns {object[]}
 */
function getServerLogs(serverId, limit = 100) {
  getServerOrThrow(serverId); // ensure it exists
  return processManager.getLogs(serverId, limit);
}

// ── Internal Helpers ─────────────────────────────────────────

function getServerOrThrow(serverId) {
  const server = servers.get(serverId);
  if (!server) {
    throw new ApiError(404, `Server "${serverId}" not found.`);
  }
  return server;
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
