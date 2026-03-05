#!/usr/bin/env node
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import os from 'os';
import open from 'open';
import crypto from 'crypto';
import {
  parseAgentsJson, parseCronList,
  extractExperiments, extractBacklogItems, extractProcesses,
  enrichProjects,
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Constants ─────────────────────────────────────────────────────────────────
const WATCHED_EXTENSIONS = ['.json', '.md'];
const DEBOUNCE_MS = 250;
const KEEPALIVE_MS = 25000;
const FALLBACK_MS = 60000;

// ── Configuration ─────────────────────────────────────────────────────────────
const PORT = parseInt(
  process.env.AGI_FARM_DASHBOARD_PORT ||
  (process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : '8080'),
  10
);

if (isNaN(PORT) || PORT < 1024 || PORT > 65535) {
  console.error('[dashboard] Invalid port');
  process.exit(1);
}

const HOST = process.env.AGI_FARM_DASHBOARD_HOST || '127.0.0.1';

const WORKSPACE = process.env.AGI_FARM_WORKSPACE ||
  (process.argv.includes('--workspace')
    ? process.argv[process.argv.indexOf('--workspace') + 1]
    : path.join(os.homedir(), '.openclaw', 'workspace'));

const NO_BROWSER = process.argv.includes('--no-browser');
const CSRF_TOKEN = process.env.AGI_FARM_DASHBOARD_TOKEN || crypto.randomBytes(24).toString('hex');
const CRON_FILE = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json');

// ── Slow Data Cache ───────────────────────────────────────────────────────────
class SlowDataCache {
  constructor() {
    this.agentStatuses = {};
    this.cronStatuses = {};
    this.lastRefresh = 0;
    this.REFRESH_MS = 30000;

    this.refresh();
    this._interval = setInterval(() => this.refresh(), this.REFRESH_MS);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
  }

  async fetchAgents() {
    return new Promise((resolve) => {
      try {
        const proc = spawn('openclaw', ['agents', 'list', '--json'], { timeout: 10000 });
        let stdout = '';
        proc.stdout.on('data', (data) => stdout += data);
        proc.on('close', (code) => {
          if (code === 0) {
            resolve(parseAgentsJson(stdout));
          } else {
            resolve({});
          }
        });
        proc.on('error', () => resolve({}));
      } catch (err) {
        resolve({});
      }
    });
  }

  async fetchCrons() {
    return new Promise((resolve) => {
      try {
        const proc = spawn('openclaw', ['cron', 'list'], { timeout: 10000 });
        let stdout = '';
        proc.stdout.on('data', (data) => stdout += data);
        proc.on('close', (code) => {
          if (code === 0) {
            resolve(parseCronList(stdout));
          } else {
            resolve({});
          }
        });
        proc.on('error', () => resolve({}));
      } catch (err) {
        resolve({});
      }
    });
  }

  async refresh() {
    try {
      const [agents, crons] = await Promise.allSettled([
        this.fetchAgents(),
        this.fetchCrons()
      ]);
      if (agents.status === 'fulfilled') this.agentStatuses = agents.value;
      if (crons.status === 'fulfilled') this.cronStatuses = crons.value;
      this.lastRefresh = Date.now();
    } catch (err) {
      console.error('[dashboard] Refresh failed:', err);
    }
  }

  getAgentStatuses() {
    return { ...this.agentStatuses };
  }

  getCronStatuses() {
    return { ...this.cronStatuses };
  }

  ageSeconds() {
    return this.lastRefresh ? (Date.now() - this.lastRefresh) / 1000 : 999;
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readMd(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function getHeartbeatAge(workspace, wsDir = '') {
  const paths = [];
  if (wsDir) paths.push(path.join(workspace, 'agents-workspaces', wsDir, 'HEARTBEAT.md'));
  paths.push(path.join(workspace, 'HEARTBEAT.md'));

  for (const p of paths) {
    try {
      const content = fs.readFileSync(p, 'utf-8');
      const matches = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g);
      if (matches) {
        const lastTs = new Date(matches[matches.length - 1]);
        return Math.floor((Date.now() - lastTs.getTime()) / 60000);
      }
    } catch { }
  }
  return 999;
}

function countInbox(workspace, agentId) {
  try {
    const content = fs.readFileSync(path.join(workspace, 'comms', 'inboxes', `${agentId}.md`), 'utf-8');
    return content.split('\n').filter(l => l.startsWith('##')).length;
  } catch {
    return 0;
  }
}

function loadCrons() {
  try {
    const raw = readJson(CRON_FILE);
    const jobs = asArray(raw.jobs);
    const nowMs = Date.now();
    for (const j of jobs) {
      const state = j.state || {};
      const nxt = state.nextRunAtMs;
      const lst = state.lastRunAtMs;
      j._next_run_sec = nxt ? Math.round((nxt - nowMs) / 1000) : null;
      j._last_run_sec = lst ? Math.round((nowMs - lst) / 1000) : null;
      j._status = state.lastStatus || 'idle';
      j._consecutive_errors = state.consecutiveErrors || 0;
      j._last_error = state.lastError || '';
      j._duration_ms = state.lastDurationMs;
    }
    return jobs;
  } catch {
    return [];
  }
}

function constantTimeEquals(a, b) {
  const aBuf = Buffer.from(a || '', 'utf8');
  const bBuf = Buffer.from(b || '', 'utf8');
  const len = Math.max(aBuf.length, bBuf.length);
  const aPad = Buffer.alloc(len);
  const bPad = Buffer.alloc(len);
  aBuf.copy(aPad);
  bBuf.copy(bPad);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aPad, bPad);
}

const ALLOWED_ORIGINS = new Set([
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
  `http://[::1]:${PORT}`,
]);

function requireOrigin(req, res, next) {
  // Validate Referer/Origin to ensure request comes from the served dashboard page
  const origin = req.header('origin');
  const referer = req.header('referer');
  if (origin) {
    if (!ALLOWED_ORIGINS.has(origin)) {
      res.status(403).json({ error: 'forbidden_origin' });
      return;
    }
  } else if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!ALLOWED_ORIGINS.has(refOrigin)) {
        res.status(403).json({ error: 'forbidden_origin' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'forbidden_origin' });
      return;
    }
  } else {
    // No origin or referer — reject (prevents cross-origin SSE/fetch)
    res.status(403).json({ error: 'forbidden_origin' });
    return;
  }
  next();
}

function requireCsrf(req, res, next) {
  // Validate Origin header to prevent cross-origin attacks
  const origin = req.header('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({ error: 'forbidden_origin' });
    return;
  }

  const token = req.header('x-agi-farm-csrf');
  if (!token || !constantTimeEquals(token, CSRF_TOKEN)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
}

function runOpenclaw(args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timeoutId = null;

    try {
      const proc = spawn('openclaw', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        proc.kill('SIGTERM');
        resolve({ ok: false, code: null, stdout, stderr: 'timed out' });
      }, timeoutMs);

      proc.stdout?.on('data', (d) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', (err) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        resolve({ ok: false, code: null, stdout, stderr: err.message });
      });
      proc.on('close', (code) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        resolve({ ok: code === 0, code, stdout, stderr });
      });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({ ok: false, code: null, stdout, stderr: err.message });
    }
  });
}

let cronFileLocked = false;

function toggleCronEnabled(id) {
  if (cronFileLocked) {
    return { ok: false, status: 409, error: 'cron_file_busy' };
  }
  cronFileLocked = true;
  try {
    const raw = readJson(CRON_FILE);
    const jobs = asArray(raw.jobs);
    const idx = jobs.findIndex((j) => j && j.id === id);
    if (idx === -1) {
      return { ok: false, status: 404, error: 'cron_not_found' };
    }
    const current = jobs[idx].enabled !== false;
    const next = !current;
    jobs[idx].enabled = next;
    const out = { ...asObject(raw), jobs };
    fs.writeFileSync(CRON_FILE, JSON.stringify(out, null, 2), 'utf-8');
    return { ok: true, enabled: next };
  } finally {
    cronFileLocked = false;
  }
}

// ── Build Workspace Snapshot ──────────────────────────────────────────────────
function buildWorkspaceSnapshot(cache) {
  const tasks = asArray(readJson(path.join(WORKSPACE, 'TASKS.json')));
  const agentStatus = asObject(readJson(path.join(WORKSPACE, 'AGENT_STATUS.json')));
  const agentPerf = asObject(readJson(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json')));
  const budget = asObject(readJson(path.join(WORKSPACE, 'BUDGET.json')));
  const velocity = asObject(readJson(path.join(WORKSPACE, 'VELOCITY.json')));
  const okrs = asObject(readJson(path.join(WORKSPACE, 'OKRs.json')));
  const broadcast = readMd(path.join(WORKSPACE, 'comms', 'broadcast.md'));
  const experiments = extractExperiments(readJson(path.join(WORKSPACE, 'EXPERIMENTS.json')));
  const backlog = extractBacklogItems(readJson(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json')));
  const sharedKnowledge = asArray(readJson(path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json')));
  const memory = readMd(path.join(WORKSPACE, 'MEMORY.md'));
  const alerts = asArray(readJson(path.join(WORKSPACE, 'ALERTS.json')));
  const rawProjects = asArray(readJson(path.join(WORKSPACE, 'PROJECTS.json')));
  const failures = readMd(path.join(WORKSPACE, 'FAILURES.md'));
  const decisions = readMd(path.join(WORKSPACE, 'DECISIONS.md'));
  const processes = extractProcesses(readJson(path.join(WORKSPACE, 'PROCESSES.json')));

  const crons = loadCrons();
  const cachedAgents = cache.getAgentStatuses();
  const cronStatuses = cache.getCronStatuses();

  // Enriched Comms (for Comms.jsx) — only for IDs that pass validation
  const comms = {};
  Object.keys(agentStatus).filter(isSafeId).forEach(id => {
    comms[id] = {
      inbox: readMd(path.join(WORKSPACE, 'comms', 'inboxes', `${id}.md`)),
      outbox: readMd(path.join(WORKSPACE, 'comms', 'outboxes', `${id}.md`))
    };
  });

  // Enrich agents — skip IDs that fail validation
  const agents = Object.entries(agentStatus).filter(([id]) => isSafeId(id)).map(([id, data]) => {
    const cached = cachedAgents[id] || {};
    const perf = agentPerf[id] || {};
    return {
      id,
      name: data.name || cached.identityName || id,
      emoji: cached.identityEmoji || '🤖',
      status: cronStatuses[id] || data.status || 'available',
      model: cached.model || 'unknown',
      role: data.role || 'Agent',
      specializations: data.specializations || [],
      inbox_count: countInbox(WORKSPACE, id),
      tasks_completed: perf.tasks_completed || 0,
      tasks_failed: perf.tasks_failed || 0,
      quality_score: perf.quality_score || 0,
      avg_quality: perf.quality_score || 0, // Frontend alias
      credibility: perf.credibility || 1.0,
      cache_age_seconds: Math.floor(cache.ageSeconds()),
      heartbeat_age_minutes: getHeartbeatAge(WORKSPACE, cached.workspace || ''),
    };
  });

  // Task counts
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    complete: tasks.filter(t => t.status === 'complete').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    hitl: tasks.filter(t => t.status === 'needs_human_decision').length,
    needs_human_decision: tasks.filter(t => t.status === 'needs_human_decision').length, // Alias
  };

  const hitl_tasks = tasks.filter(t => t.status === 'needs_human_decision');
  const sla_at_risk = tasks.filter(t => t.status !== 'complete' && t.sla?.deadline && new Date(t.sla.deadline) < new Date(Date.now() + 3600000));

  // Enrich projects with computed fields the frontend expects
  const projects = enrichProjects(rawProjects, tasks, agentPerf);

  return {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    tasks,
    task_counts: taskCounts,
    hitl_tasks,
    sla_at_risk,
    agents,
    budget,
    velocity,
    okrs,
    broadcast,
    experiments,
    backlog,
    shared_knowledge: sharedKnowledge,
    knowledge: sharedKnowledge, // Alias for frontend
    knowledge_count: sharedKnowledge.length,
    memory,
    memory_lines: memory.split('\n').length,
    failures,
    decisions,
    processes,
    crons,
    alerts,
    projects,
    comms,
    gateway_online: true,
    cache_age_seconds: Math.floor(cache.ageSeconds()),
  };
}

// ── SSE Broadcaster ───────────────────────────────────────────────────────────
class Broadcaster {
  constructor() {
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    console.log(`[dashboard] Client connected (${this.clients.size} total)`);
  }

  removeClient(res) {
    this.clients.delete(res);
    console.log(`[dashboard] Client disconnected (${this.clients.size} total)`);
  }

  broadcast(data) {
    const payload = JSON.stringify(data);
    const message = `data: ${payload}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (e) {
        this.clients.delete(client);
      }
    }
  }
}

// ── Rate Limiter ──────────────────────────────────────────────────────────────
function createRateLimiter(windowMs, maxRequests) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs);
  return (req, res, next) => {
    const key = req.ip;
    const count = (hits.get(key) || 0) + 1;
    hits.set(key, count);
    if (count > maxRequests) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }
    next();
  };
}

// ── Input Validation ──────────────────────────────────────────────────────────
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function isSafeId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

function validateId(req, res, next) {
  const { id } = req.params;
  if (id && !isSafeId(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }
  next();
}

function validateAction(req, res, next) {
  const { action } = req.params;
  if (action && !isSafeId(action)) {
    res.status(400).json({ error: 'invalid_action' });
    return;
  }
  next();
}

function sanitizeNote(note) {
  if (typeof note !== 'string') return '';
  // Truncate, strip control characters, and prevent CLI flag injection
  let cleaned = note.slice(0, 1000).replace(/[\x00-\x1f\x7f]/g, '');
  // Prevent interpretation as a CLI flag by prepending a space if starts with -
  if (cleaned.startsWith('-')) cleaned = ' ' + cleaned;
  return cleaned;
}

// ── Main Server ───────────────────────────────────────────────────────────────
async function main() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:;");
    next();
  });

  const apiLimiter = createRateLimiter(60000, 120);   // 120 req/min
  const actionLimiter = createRateLimiter(60000, 30);  // 30 req/min for mutations
  app.use('/api', apiLimiter);

  // Session endpoint — origin-gated so only the served dashboard page can fetch the token
  app.get('/api/session', requireOrigin, (req, res) => {
    res.json({ csrfToken: CSRF_TOKEN });
  });

  const cache = new SlowDataCache();
  const broadcaster = new Broadcaster();

  // Serve React build
  const reactDist = path.join(__dirname, '..', 'dashboard-react', 'dist');
  const fallbackDist = path.join(__dirname, '..', 'dashboard-dist');

  if (fs.existsSync(reactDist)) {
    app.use(express.static(reactDist));
    console.log(`[dashboard] Serving React build from ${reactDist}`);
  } else if (fs.existsSync(fallbackDist)) {
    app.use(express.static(fallbackDist));
    console.log(`[dashboard] Serving React build from ${fallbackDist}`);
  } else {
    console.log(`[dashboard] React build not found, serving API only`);
  }

  // SSE endpoint — requires valid CSRF token via query param (EventSource can't set headers)
  app.get('/api/stream', (req, res) => {
    const token = req.query.token;
    if (!token || !constantTimeEquals(token, CSRF_TOKEN)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    broadcaster.addClient(res);

    // Send initial snapshot
    const snapshot = buildWorkspaceSnapshot(cache);
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

    // Keepalive
    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepalive);
        broadcaster.removeClient(res);
      }
    }, KEEPALIVE_MS);

    req.on('close', () => {
      clearInterval(keepalive);
      broadcaster.removeClient(res);
    });
  });

  // REST endpoint for one-shot data fetch — requires CSRF token via header
  app.get('/api/data', (req, res) => {
    const token = req.header('x-agi-farm-csrf');
    if (!token || !constantTimeEquals(token, CSRF_TOKEN)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const snapshot = buildWorkspaceSnapshot(cache);
    res.json(snapshot);
  });

  // ── Cron Actions ────────────────────────────────────────────────────────────
  app.post('/api/cron/:id/trigger', actionLimiter, validateId, requireCsrf, async (req, res) => {
    const { id } = req.params;
    console.log(`[dashboard] Triggering cron: ${id}`);
    try {
      const result = await runOpenclaw(['cron', 'run', id]);
      if (result.ok) {
        res.json({ ok: true });
        return;
      }
      res.status(500).json({ ok: false, code: result.code, error: result.stderr || 'cron_run_failed' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cron/:id/toggle', actionLimiter, validateId, requireCsrf, async (req, res) => {
    const { id } = req.params;
    console.log(`[dashboard] Toggling cron: ${id}`);
    try {
      const result = toggleCronEnabled(id);
      if (!result.ok) {
        res.status(result.status || 500).json({ ok: false, error: result.error || 'toggle_failed' });
        return;
      }
      res.json({ ok: true, enabled: result.enabled });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── HITL Actions ────────────────────────────────────────────────────────────
  app.post('/api/hitl/:id/:action', actionLimiter, validateId, validateAction, requireCsrf, async (req, res) => {
    const { id, action } = req.params;
    const note = sanitizeNote(req.body.note);
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ ok: false, error: 'invalid_action' });
      return;
    }
    console.log(`[dashboard] HITL ${action} for task ${id}${note ? `: ${note}` : ''}`);
    try {
      const status = action === 'approve' ? 'pending' : 'blocked';
      const args = ['tasks', 'update', id, '--status', status];
      if (note) args.push('--comment', note);
      const result = await runOpenclaw(args);
      if (result.ok) {
        res.json({ ok: true });
        return;
      }
      res.status(500).json({ ok: false, code: result.code, error: result.stderr || 'task_update_failed' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  const fileLocks = new Map();

  function withFileLock(filePath, fn) {
    if (fileLocks.get(filePath)) {
      return { ok: false, status: 409, error: 'file_busy' };
    }
    fileLocks.set(filePath, true);
    try {
      return fn();
    } finally {
      fileLocks.delete(filePath);
    }
  }

  function atomicWriteJson(filePath, data) {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  }

  app.post('/api/tasks', actionLimiter, requireCsrf, (req, res) => {
    const { id, title, description, priority, assigned_to, type } = req.body;
    if (!id || !isSafeId(id)) return res.status(400).json({ error: 'invalid_id' });
    if (!title || typeof title !== 'string' || title.length > 500) return res.status(400).json({ error: 'invalid_title' });

    const tasksPath = path.join(WORKSPACE, 'TASKS.json');
    const result = withFileLock(tasksPath, () => {
      const tasks = asArray(readJson(tasksPath));
      if (tasks.some(t => t.id === id)) return { ok: false, status: 409, error: 'duplicate_id' };
      const task = {
        id,
        title: sanitizeNote(title),
        description: sanitizeNote(description || ''),
        priority: sanitizeNote(priority || 'P3'),
        assigned_to: assigned_to && isSafeId(assigned_to) ? assigned_to : undefined,
        type: sanitizeNote(type || 'task'),
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      tasks.push(task);
      atomicWriteJson(tasksPath, tasks);
      return { ok: true, task };
    });
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json(result);
  });

  app.put('/api/tasks/:id', actionLimiter, validateId, requireCsrf, (req, res) => {
    const { id } = req.params;
    const tasksPath = path.join(WORKSPACE, 'TASKS.json');
    const result = withFileLock(tasksPath, () => {
      const tasks = asArray(readJson(tasksPath));
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return { ok: false, status: 404, error: 'task_not_found' };
      const { title, description, priority, status, assigned_to } = req.body;
      if (title) tasks[idx].title = sanitizeNote(title);
      if (description !== undefined) tasks[idx].description = sanitizeNote(description);
      if (priority) tasks[idx].priority = sanitizeNote(priority);
      if (status) tasks[idx].status = sanitizeNote(status);
      if (assigned_to !== undefined) tasks[idx].assigned_to = assigned_to && isSafeId(assigned_to) ? assigned_to : undefined;
      tasks[idx].updated_at = new Date().toISOString();
      atomicWriteJson(tasksPath, tasks);
      return { ok: true, task: tasks[idx] };
    });
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json(result);
  });

  // ── Comms Send ────────────────────────────────────────────────────────────
  app.post('/api/comms/:id/send', actionLimiter, validateId, requireCsrf, (req, res) => {
    const agentId = req.params.id;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'invalid_message' });
    }
    const inboxDir = path.join(WORKSPACE, 'comms', 'inboxes');
    if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });
    const inboxPath = path.join(inboxDir, `${agentId}.md`);
    const timestamp = new Date().toISOString();
    const entry = `\n\n## Dashboard Message — ${timestamp}\n\n${sanitizeNote(message)}\n\n---\n`;
    fs.appendFileSync(inboxPath, entry, 'utf-8');
    console.log(`[dashboard] Message sent to ${agentId}`);
    res.json({ ok: true });
  });

  // ── Broadcast Post ────────────────────────────────────────────────────────
  app.post('/api/broadcast', actionLimiter, requireCsrf, (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'invalid_message' });
    }
    const broadcastDir = path.join(WORKSPACE, 'comms');
    if (!fs.existsSync(broadcastDir)) fs.mkdirSync(broadcastDir, { recursive: true });
    const broadcastPath = path.join(broadcastDir, 'broadcast.md');
    const timestamp = new Date().toISOString();
    const entry = `\n## [DASHBOARD] ${timestamp}\n${sanitizeNote(message)}\n\n---\n`;
    fs.appendFileSync(broadcastPath, entry, 'utf-8');
    console.log('[dashboard] Broadcast posted');
    res.json({ ok: true });
  });

  // ── Knowledge CRUD ────────────────────────────────────────────────────────
  app.post('/api/knowledge', actionLimiter, requireCsrf, (req, res) => {
    const { title, content, category, tags } = req.body;
    if (!content || typeof content !== 'string' || content.length > 5000) {
      return res.status(400).json({ error: 'invalid_content' });
    }
    const kPath = path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json');
    const result = withFileLock(kPath, () => {
      const knowledge = asArray(readJson(kPath));
      const entry = {
        id: `k-${Date.now()}`,
        title: sanitizeNote(title || ''),
        content: sanitizeNote(content),
        category: sanitizeNote(category || 'general'),
        tags: asArray(tags).map(t => sanitizeNote(String(t))).slice(0, 10),
        added_by: 'dashboard',
        added_at: new Date().toISOString(),
      };
      knowledge.push(entry);
      atomicWriteJson(kPath, knowledge);
      return { ok: true, entry };
    });
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json(result);
  });

  app.delete('/api/knowledge/:id', actionLimiter, validateId, requireCsrf, (req, res) => {
    const { id } = req.params;
    const kPath = path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json');
    const result = withFileLock(kPath, () => {
      const knowledge = asArray(readJson(kPath));
      const idx = knowledge.findIndex(e => e.id === id);
      if (idx === -1) return { ok: false, status: 404, error: 'entry_not_found' };
      knowledge.splice(idx, 1);
      atomicWriteJson(kPath, knowledge);
      return { ok: true };
    });
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json(result);
  });

  // ── File Watcher ───────────────────────────────────────────────────────────
  let debounceTimer = null;
  const watcher = chokidar.watch(WORKSPACE, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: DEBOUNCE_MS,
      pollInterval: 50
    }
  });

  watcher.on('all', (event, filePath) => {
    try {
      const ext = path.extname(filePath);
      if (!WATCHED_EXTENSIONS.includes(ext)) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          console.log(`[dashboard] File changed: ${filePath} (${event})`);
          const snapshot = buildWorkspaceSnapshot(cache);
          broadcaster.broadcast(snapshot);
        } catch (err) {
          console.error('[dashboard] Error building snapshot after file change:', err.message);
        }
      }, DEBOUNCE_MS);
    } catch (err) {
      console.error('[dashboard] Error in file watcher callback:', err.message);
    }
  });

  watcher.on('error', (err) => {
    console.error('[dashboard] File watcher error:', err.message);
  });

  // Fallback: periodic full refresh
  const fallbackInterval = setInterval(() => {
    try {
      const snapshot = buildWorkspaceSnapshot(cache);
      broadcaster.broadcast(snapshot);
    } catch (err) {
      console.error('[dashboard] Error in fallback refresh:', err.message);
    }
  }, FALLBACK_MS);

  // ── SPA Fallback ──────────────────────────────────────────────────────────
  const indexPath = fs.existsSync(path.join(reactDist, 'index.html'))
    ? path.join(reactDist, 'index.html')
    : fs.existsSync(path.join(fallbackDist, 'index.html'))
      ? path.join(fallbackDist, 'index.html')
      : null;

  if (indexPath) {
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  }

  // ── Start Server ───────────────────────────────────────────────────────────
  const server = app.listen(PORT, HOST, () => {
    console.log(`[dashboard] AGI Farm Dashboard running at http://${HOST}:${PORT}`);
    console.log(`[dashboard] Workspace: ${WORKSPACE}`);
    console.log(`[dashboard] SSE endpoint: http://${HOST}:${PORT}/api/stream`);

    if (!NO_BROWSER) {
      open(`http://${HOST}:${PORT}`).catch(() => { });
    }
  });

  // ── Graceful Shutdown ─────────────────────────────────────────────────────
  function shutdown(signal) {
    console.log(`[dashboard] ${signal} received, shutting down...`);
    for (const client of broadcaster.clients) {
      try { client.end(); } catch {}
    }
    broadcaster.clients.clear();
    watcher.close();
    cache.stop();
    clearInterval(fallbackInterval);
    if (debounceTimer) clearTimeout(debounceTimer);
    server.close(() => {
      console.log('[dashboard] Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
  console.error('[dashboard] Error:', err);
  process.exit(1);
});
