// ─────────────────────────────────────────────────────────────
// Process Manager
// ─────────────────────────────────────────────────────────────
// Spawns, tracks, and terminates child processes. Every
// managed server runs as a child_process.spawn() instance.
// Logs (stdout + stderr) are captured in a ring buffer.
// ─────────────────────────────────────────────────────────────

const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

const LOG_BUFFER_SIZE = parseInt(process.env.LOG_BUFFER_SIZE, 10) || 500;

// Map<serverId, { process, logs[], status }>
const processes = new Map();

/**
 * Starts a new child process for a server.
 *
 * @param {string} serverId   - Unique server identifier
 * @param {string} command    - The command to run (e.g. "node index.js")
 * @param {string} cwd        - Working directory for the process
 * @param {object} env        - Extra environment variables
 * @returns {{ pid: number }}
 */
function startProcess(serverId, command, cwd, env = {}) {
  if (processes.has(serverId)) {
    const existing = processes.get(serverId);
    if (existing.status === 'running') {
      throw new Error(`Server ${serverId} is already running (PID ${existing.process.pid}).`);
    }
  }

  const [cmd, ...args] = command.split(' ');

  const childEnv = { ...process.env, ...env };

  const child = spawn(cmd, args, {
    cwd,
    env: childEnv,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const entry = {
    process: child,
    logs: [],
    status: 'running',
    startedAt: new Date().toISOString(),
    pid: child.pid,
  };

  // ── Capture stdout ───────────────────────────────────────
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      pushLog(entry, 'stdout', line);
    }
  });

  // ── Capture stderr ───────────────────────────────────────
  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      pushLog(entry, 'stderr', line);
    }
  });

  // ── Handle exit ──────────────────────────────────────────
  child.on('close', (code) => {
    entry.status = 'stopped';
    entry.exitCode = code;
    entry.stoppedAt = new Date().toISOString();
    pushLog(entry, 'system', `Process exited with code ${code}`);
    logger.info(`[${serverId}] Process exited (code ${code})`);
  });

  child.on('error', (err) => {
    entry.status = 'error';
    pushLog(entry, 'system', `Process error: ${err.message}`);
    logger.error(`[${serverId}] Process error: ${err.message}`);
  });

  processes.set(serverId, entry);
  logger.info(`[${serverId}] Started (PID ${child.pid}) — ${command}`);

  return { pid: child.pid };
}

/**
 * Stops a running process by server ID.
 *
 * @param {string} serverId
 * @returns {boolean} true if the process was killed
 */
function stopProcess(serverId) {
  const entry = processes.get(serverId);
  if (!entry) return false;

  if (entry.status !== 'running') {
    return false;
  }

  // Try graceful SIGTERM first
  entry.process.kill('SIGTERM');

  // Force kill after 5 seconds if still running
  setTimeout(() => {
    try {
      if (!entry.process.killed) {
        entry.process.kill('SIGKILL');
        logger.warn(`[${serverId}] Force-killed after timeout.`);
      }
    } catch {
      // Process already dead — ignore
    }
  }, 5000);

  entry.status = 'stopping';
  pushLog(entry, 'system', 'Stop signal sent (SIGTERM)');
  return true;
}

/**
 * Stops ALL running processes (used during graceful shutdown).
 */
function stopAll() {
  for (const [serverId] of processes) {
    stopProcess(serverId);
  }
}

/**
 * Returns the current status and metadata for a process.
 *
 * @param {string} serverId
 * @returns {object|null}
 */
function getStatus(serverId) {
  const entry = processes.get(serverId);
  if (!entry) return null;

  return {
    status: entry.status,
    pid: entry.pid,
    startedAt: entry.startedAt,
    stoppedAt: entry.stoppedAt || null,
    exitCode: entry.exitCode ?? null,
  };
}

/**
 * Returns the captured log lines for a server.
 *
 * @param {string} serverId
 * @param {number} [limit=100] - Max number of recent lines
 * @returns {object[]}
 */
function getLogs(serverId, limit = 100) {
  const entry = processes.get(serverId);
  if (!entry) return [];

  return entry.logs.slice(-limit);
}

/**
 * Removes a process entry entirely (only if stopped).
 *
 * @param {string} serverId
 * @returns {boolean}
 */
function removeProcess(serverId) {
  const entry = processes.get(serverId);
  if (!entry) return false;
  if (entry.status === 'running') return false;

  processes.delete(serverId);
  return true;
}

// ── Internal Helpers ─────────────────────────────────────────

/**
 * Pushes a log line into the ring buffer, trimming if needed.
 */
function pushLog(entry, stream, message) {
  entry.logs.push({
    timestamp: new Date().toISOString(),
    stream,
    message,
  });

  // Ring buffer — keep only the last N lines
  if (entry.logs.length > LOG_BUFFER_SIZE) {
    entry.logs = entry.logs.slice(-LOG_BUFFER_SIZE);
  }
}

module.exports = {
  startProcess,
  stopProcess,
  stopAll,
  getStatus,
  getLogs,
  removeProcess,
};
