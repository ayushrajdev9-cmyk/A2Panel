// ═══════════════════════════════════════════════════════════
//  A2Panel — Dashboard Script
//  /public/script.js
// ═══════════════════════════════════════════════════════════

const API = '';   // same origin
let cachedTemplates = [];
let cachedServers   = [];
let currentView = 'dashboard';
let currentLogServerId = null;
let logInterval = null;
let activityLog = [];

// ── Runtime metadata ────────────────────────────────────────
const RUNTIME_META = {
  node:   { cls: 'node',   emoji: '🟢', badge: 'badge-node',   label: 'Node.js',   type: 'type-node' },
  python: { cls: 'python', emoji: '🐍', badge: 'badge-python', label: 'Python',    type: 'type-python' },
  java:   { cls: 'java',   emoji: '☕', badge: 'badge-java',   label: 'Java',      type: 'type-java' },
  web:    { cls: 'web',    emoji: '🌐', badge: 'badge-web',    label: 'Web',       type: 'type-web' },
};

function getMeta(runtime, id) {
  if (id && id.startsWith('minecraft'))
    return { cls: 'mc', emoji: '⛏️', badge: 'badge-mc', label: 'Minecraft', type: 'type-mc' };
  return RUNTIME_META[runtime] || { cls: 'web', emoji: '🌐', badge: 'badge-web', label: runtime || 'App', type: 'type-web' };
}

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refreshAll();
});

async function refreshAll() {
  const btn  = document.getElementById('refresh-btn');
  const icon = document.getElementById('refresh-icon');
  if (btn)  btn.disabled = true;
  if (icon) { icon.style.animation = 'spinOnce .6s linear'; setTimeout(() => { icon.style.animation = ''; }, 650); }
  await Promise.all([loadTemplates(), loadServers()]);
  if (btn)  btn.disabled = false;
}

// ── View routing ─────────────────────────────────────────────
const VIEW_LABELS = { dashboard: 'Dashboard', servers: 'Servers', templates: 'Templates' };

function setView(name) {
  if (!VIEW_LABELS[name]) return;
  currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('nav-'  + name).classList.add('active');
  document.getElementById('topbar-breadcrumb').textContent = VIEW_LABELS[name];
}

// ── Sidebar toggle ───────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── Toast ────────────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  pushActivity(message, type);
  setTimeout(() => {
    el.style.transition = 'opacity .3s ease, transform .3s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(20px)';
    setTimeout(() => el.remove(), 320);
  }, 3800);
}

// ── Activity feed ────────────────────────────────────────────
function pushActivity(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
  activityLog.unshift({ msg, type, icon: icons[type] || '•', time: new Date() });
  if (activityLog.length > 30) activityLog.pop();
  renderActivity();
}

function renderActivity() {
  const el = document.getElementById('dash-activity');
  if (!el) return;
  if (!activityLog.length) {
    el.innerHTML = '<div class="dash-empty">Activity will appear here as you use the panel.</div>';
    return;
  }
  el.innerHTML = activityLog.map(a => `
    <div class="activity-item">
      <span class="activity-icon">${a.icon}</span>
      <span class="activity-msg">${esc(a.msg)}</span>
      <span class="activity-time">${a.time.toLocaleTimeString()}</span>
    </div>
  `).join('');
}

// ── API helper ───────────────────────────────────────────────
async function api(method, url, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(API + url, opts);
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || data.error || 'Unknown error');
    return data;
  } catch (err) {
    toast(err.message, 'error');
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════════════
async function loadTemplates() {
  try {
    const { data } = await api('GET', '/templates');
    cachedTemplates = data;
    renderTemplates(data);
    renderQuickTemplates(data);
    populateTemplateSelect(data);
    animateStat('stat-templates', data.length);
    const el = document.getElementById('nav-count-templates');
    if (el) el.textContent = data.length;
  } catch { /* toast shown */ }
}

function renderTemplates(templates) {
  const grid = document.getElementById('templates-grid');
  if (!grid) return;
  if (!templates.length) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🧩</span><p>No templates found.</p></div>`;
    return;
  }
  grid.innerHTML = templates.map((t, i) => {
    const m    = getMeta(t.runtime, t.id);
    const isMC = t.id && t.id.startsWith('minecraft');
    return `
      <div class="template-card ${m.type}" onclick="openCreateModal('${t.id}')"
           role="button" tabindex="0" style="animation-delay:${i * 55}ms">
        <span class="card-badge ${m.badge}">${m.label}</span>
        <div class="template-icon-wrap ${m.cls}">${m.emoji}</div>
        <div class="template-name">
          ${esc(t.name)}
          ${isMC ? '<span class="version-chip">1.21.4</span>' : ''}
        </div>
        <div class="template-desc">${esc(t.description)}</div>
        <div class="template-meta">
          <span class="template-meta-cmd" title="${esc(t.startCommand)}">⚙ ${esc(t.startCommand)}</span>
          <span class="template-meta-ver">v${esc(t.version)}</span>
        </div>
        <div class="card-deploy-hint">→ Click to deploy</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

function renderQuickTemplates(templates) {
  const el = document.getElementById('dash-quick-templates');
  if (!el) return;
  if (!templates.length) { el.innerHTML = '<div class="dash-empty">No templates.</div>'; return; }
  el.innerHTML = templates.map(t => {
    const m = getMeta(t.runtime, t.id);
    return `
      <div class="quick-template" onclick="openCreateModal('${t.id}')">
        <span class="quick-template-icon">${m.emoji}</span>
        <span class="quick-template-name">${esc(t.name)}</span>
        <span class="quick-template-arrow">→</span>
      </div>
    `;
  }).join('');
}

function populateTemplateSelect(templates) {
  const sel = document.getElementById('template-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select a template…</option>' +
    templates.map(t => {
      const m = getMeta(t.runtime, t.id);
      return `<option value="${t.id}">${m.emoji} ${esc(t.name)} (${t.runtime || 'app'})</option>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
//  SERVERS
// ═══════════════════════════════════════════════════════════
async function loadServers() {
  try {
    const { data } = await api('GET', '/servers');
    cachedServers = data;
    renderServerCards(data);
    renderDashServerList(data);
    updateStats(data);
    const el = document.getElementById('nav-count-servers');
    if (el) el.textContent = data.length;
  } catch { /* toast shown */ }
}

// Stats
function updateStats(servers) {
  animateStat('stat-total',   servers.length);
  animateStat('stat-running', servers.filter(s => s.status === 'running').length);
  animateStat('stat-stopped', servers.filter(s => s.status !== 'running').length);
}

function animateStat(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const prev = parseInt(el.textContent) || 0;
  if (prev === value && el.textContent !== '—') { el.textContent = value; return; }
  let start = null;
  requestAnimationFrame(function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / 450, 1);
    el.textContent = Math.round(prev + (value - prev) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  });
}

// ── Server Cards (Servers page) ──────────────────────────────
function renderServerCards(servers) {
  const container = document.getElementById('servers-container');
  if (!container) return;

  if (!servers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🖥️</span>
        <p>No servers yet. Click <strong>Create Server</strong> to deploy your first one!</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="server-cards-grid" id="server-cards-grid">
    ${servers.map(s => serverCardHTML(s)).join('')}
  </div>`;
}

function serverCardHTML(s) {
  const isRunning  = s.status === 'running';
  const isStopped  = s.status === 'stopped';
  const statusCls  = `status-${s.status}`;

  return `
    <div class="server-card ${isRunning ? 'server-card-running' : ''}" id="scard-${s.id}">
      <div class="server-card-header">
        <div class="server-card-title">
          <span class="server-card-name">${esc(s.name)}</span>
          <span class="server-card-id">${s.id.slice(0, 14)}…</span>
        </div>
        <span class="status-badge ${statusCls}">${s.status}</span>
      </div>

      <div class="server-card-meta">
        <div class="server-card-meta-item">
          <span class="server-card-meta-label">Template</span>
          <span class="server-card-meta-value">${esc(s.templateName || '—')}</span>
        </div>
        <div class="server-card-meta-item">
          <span class="server-card-meta-label">Created</span>
          <span class="server-card-meta-value">${timeAgo(s.createdAt)}</span>
        </div>
      </div>

      <div class="server-card-actions">
        ${isRunning
          ? `<button class="btn btn-danger btn-sm" onclick="stopServer('${s.id}')">⏹ Stop</button>`
          : `<button class="btn btn-success btn-sm" onclick="startServer('${s.id}')">▶ Start</button>`
        }
        <button class="btn btn-ghost btn-sm" onclick="viewLogs('${s.id}', '${esc(s.name)}')">📋 View Logs</button>
        ${isStopped
          ? `<button class="btn btn-ghost btn-sm btn-icon" title="Delete" style="color:var(--danger)" onclick="deleteServer('${s.id}')">🗑</button>`
          : ''
        }
      </div>
    </div>
  `;
}

// ── Dashboard quick server list ──────────────────────────────
function renderDashServerList(servers) {
  const el = document.getElementById('dash-server-list');
  if (!el) return;
  if (!servers.length) {
    el.innerHTML = '<div class="dash-empty">No servers yet. Deploy one from Quick Deploy ↓</div>';
    return;
  }
  el.innerHTML = servers.slice(0, 6).map(s => `
    <div class="dash-server-row">
      <div class="dash-server-info">
        <span class="dash-server-name">${esc(s.name)}</span>
        <span class="dash-server-template">${esc(s.templateName || '—')}</span>
      </div>
      <div class="dash-server-actions">
        <span class="status-badge status-${s.status}">${s.status}</span>
        ${s.status === 'running'
          ? `<button class="btn btn-danger  btn-sm btn-tight" onclick="stopServer('${s.id}')">⏹</button>`
          : `<button class="btn btn-success btn-sm btn-tight" onclick="startServer('${s.id}')">▶</button>`
        }
        <button class="btn btn-ghost btn-sm btn-tight" onclick="viewLogs('${s.id}','${esc(s.name)}')">📋</button>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
//  SERVER ACTIONS
// ═══════════════════════════════════════════════════════════
async function startServer(id) {
  try {
    await api('POST', '/servers/start', { serverId: id });
    toast('Server starting… ▶', 'success');
    await loadServers();
    setTimeout(loadServers, 2500);
  } catch { /* shown */ }
}

async function stopServer(id) {
  try {
    await api('POST', '/servers/stop', { serverId: id });
    toast('Server stopping…', 'info');
    await loadServers();
    setTimeout(loadServers, 3000);
  } catch { /* shown */ }
}

async function deleteServer(id) {
  if (!confirm('Delete this server? This action cannot be undone.')) return;
  try {
    await api('DELETE', `/servers/${id}`);
    toast('Server deleted.', 'success');
    await loadServers();
  } catch { /* shown */ }
}

// ═══════════════════════════════════════════════════════════
//  CREATE SERVER MODAL
// ═══════════════════════════════════════════════════════════
function openCreateModal(templateId = '') {
  document.getElementById('create-modal').classList.add('active');
  if (templateId) document.getElementById('template-select').value = templateId;
  document.getElementById('server-name').value = '';
  updateMCNotice();
}

function closeCreateModal() {
  document.getElementById('create-modal').classList.remove('active');
}

function updateMCNotice() {
  const val = document.getElementById('template-select').value;
  document.getElementById('mc-notice').style.display =
    val && val.startsWith('minecraft') ? 'block' : 'none';
}

document.getElementById('template-select').addEventListener('change', updateMCNotice);

document.getElementById('create-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCreateModal();
});

async function handleCreate(e) {
  e.preventDefault();
  const templateId = document.getElementById('template-select').value;
  const name       = document.getElementById('server-name').value.trim();
  if (!templateId) { toast('Please select a template.', 'error'); return; }

  const btn = document.getElementById('deploy-btn');
  btn.disabled = true;
  btn.textContent = '⌛ Deploying…';

  try {
    const body = { templateId };
    if (name) body.name = name;
    await api('POST', '/servers/create', body);
    toast('Server deployed! 🚀', 'success');
    closeCreateModal();
    await loadServers();
  } catch { /* shown */ }
  finally {
    btn.disabled    = false;
    btn.textContent = '⚡ Deploy Server';
  }
}

// ═══════════════════════════════════════════════════════════
//  LOG VIEWER
// ═══════════════════════════════════════════════════════════
async function viewLogs(serverId, serverName) {
  currentLogServerId = serverId;
  document.getElementById('log-viewer-title').textContent = `Logs — ${serverName}`;
  document.getElementById('log-overlay').classList.add('active');
  await refreshLogs();
  if (logInterval) clearInterval(logInterval);
  logInterval = setInterval(refreshLogs, 2000);
}

async function refreshLogs() {
  if (!currentLogServerId) return;
  try {
    const { data } = await api('GET', `/servers/${currentLogServerId}/logs?limit=200`);
    renderLogs(data);
  } catch { /* shown */ }
}

function renderLogs(logs) {
  const content = document.getElementById('log-content');
  const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 10;

  if (!logs.length) {
    content.innerHTML = '<div class="log-empty">No logs yet. Start the server to see output.</div>';
    return;
  }

  content.innerHTML = logs.map(l => `
    <div class="log-line">
      <span class="log-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
      <span class="log-stream ${l.stream}">${l.stream}</span>
      <span class="log-message">${esc(l.message)}</span>
    </div>
  `).join('');

  // Auto-scroll only if was already at bottom
  if (atBottom) content.scrollTop = content.scrollHeight;
}

function closeLogs() {
  document.getElementById('log-overlay').classList.remove('active');
  currentLogServerId = null;
  if (logInterval) { clearInterval(logInterval); logInterval = null; }
}

document.getElementById('log-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeLogs();
});

// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCreateModal(); closeLogs(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') { e.preventDefault(); refreshAll(); }
});
