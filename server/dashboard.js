#!/usr/bin/env node
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import os from 'os';
import open from 'open';
import { parseAgentsJson, parseCronList } from './utils.js';

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

// ── Slow Data Cache ───────────────────────────────────────────────────────────
class SlowDataCache {
  constructor() {
    this.agentStatuses = {};
    this.cronStatuses = {};
    this.lastRefresh = 0;
    this.REFRESH_MS = 30000;

    this.refresh();
    setInterval(() => this.refresh(), this.REFRESH_MS);
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
    const cronFile = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json');
    const raw = readJson(cronFile);
    const jobs = raw.jobs || [];
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

// ── Build Workspace Snapshot ──────────────────────────────────────────────────
function buildWorkspaceSnapshot(cache) {
  const tasks = readJson(path.join(WORKSPACE, 'TASKS.json')) || [];
  const agentStatus = readJson(path.join(WORKSPACE, 'AGENT_STATUS.json')) || {};
  const agentPerf = readJson(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json')) || {};
  const budget = readJson(path.join(WORKSPACE, 'BUDGET.json')) || {};
  const velocity = readJson(path.join(WORKSPACE, 'VELOCITY.json')) || {};
  const okrs = readJson(path.join(WORKSPACE, 'OKRs.json')) || {};
  const broadcast = readMd(path.join(WORKSPACE, 'comms', 'broadcast.md'));
  const experiments = readJson(path.join(WORKSPACE, 'EXPERIMENTS.json')) || {};
  const improvementBacklog = readJson(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json')) || {};
  const sharedKnowledge = readJson(path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json')) || [];
  const memory = readMd(path.join(WORKSPACE, 'MEMORY.md'));
  const alerts = readJson(path.join(WORKSPACE, 'ALERTS.json')) || [];
  const projects = readJson(path.join(WORKSPACE, 'PROJECTS.json')) || [];

  const crons = loadCrons();
  const cachedAgents = cache.getAgentStatuses();
  const cronStatuses = cache.getCronStatuses();

  // Enriched Comms (for Comms.jsx)
  const comms = {};
  Object.keys(agentStatus).forEach(id => {
    comms[id] = {
      inbox: readMd(path.join(WORKSPACE, 'comms', 'inboxes', `${id}.md`)),
      outbox: readMd(path.join(WORKSPACE, 'comms', 'outboxes', `${id}.md`))
    };
  });

  // Enrich agents
  const agents = Object.entries(agentStatus).map(([id, data]) => {
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
    improvement_backlog: improvementBacklog,
    shared_knowledge: sharedKnowledge,
    knowledge: sharedKnowledge, // Alias for frontend
    knowledge_count: sharedKnowledge.length,
    memory_lines: memory.split('\n').length,
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

// ── Main Server ───────────────────────────────────────────────────────────────
async function main() {
  const app = express();
  app.use(express.json());

  // Add CORS header
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
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

  // SSE endpoint
  app.get('/api/stream', (req, res) => {
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

  // REST endpoint for one-shot data fetch
  app.get('/api/data', (req, res) => {
    const snapshot = buildWorkspaceSnapshot(cache);
    res.json(snapshot);
  });

  // ── Cron Actions ────────────────────────────────────────────────────────────
  app.post('/api/cron/:id/trigger', async (req, res) => {
    const { id } = req.params;
    console.log(`[dashboard] Triggering cron: ${id}`);
    try {
      spawn('openclaw', ['cron', 'run', id], { stdio: 'inherit' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cron/:id/toggle', async (req, res) => {
    const { id } = req.params;
    console.log(`[dashboard] Toggling cron: ${id}`);
    try {
      // Note: Generic toggle or enable/disable logic based on state
      res.json({ ok: true, enabled: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── HITL Actions ────────────────────────────────────────────────────────────
  app.post('/api/hitl/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    const { note } = req.body;
    console.log(`[dashboard] HITL ${action} for task ${id}${note ? `: ${note}` : ''}`);
    try {
      const status = action === 'approve' ? 'pending' : 'blocked';
      const args = ['tasks', 'update', id, '--status', status];
      if (note) args.push('--comment', note);

      spawn('openclaw', args, { stdio: 'inherit' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
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
    const ext = path.extname(filePath);
    if (!WATCHED_EXTENSIONS.includes(ext)) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[dashboard] File changed: ${filePath} (${event})`);
      const snapshot = buildWorkspaceSnapshot(cache);
      broadcaster.broadcast(snapshot);
    }, DEBOUNCE_MS);
  });

  // Fallback: periodic full refresh
  setInterval(() => {
    const snapshot = buildWorkspaceSnapshot(cache);
    broadcaster.broadcast(snapshot);
  }, FALLBACK_MS);

  // ── Start Server ───────────────────────────────────────────────────────────
  app.listen(PORT, HOST, () => {
    console.log(`[dashboard] AGI Farm Dashboard running at http://${HOST}:${PORT}`);
    console.log(`[dashboard] Workspace: ${WORKSPACE}`);
    console.log(`[dashboard] SSE endpoint: http://${HOST}:${PORT}/api/stream`);

    if (!NO_BROWSER) {
      open(`http://${HOST}:${PORT}`).catch(() => { });
    }
  });
}

main().catch(err => {
  console.error('[dashboard] Error:', err);
  process.exit(1);
});
