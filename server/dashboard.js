#!/usr/bin/env node
/**
 * AGI Farm Dashboard Server — File-Watcher Edition (Node.js)
 *
 * Live updates via chokidar: pushes SSE events immediately on any workspace file change.
 * Fallback: full refresh every 60s + keepalive ping every 25s (proxy-safe).
 *
 * Usage: node dashboard.js [--port 8080] [--workspace /path/to/workspace] [--no-browser]
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

// ── Constants ─────────────────────────────────────────────────────────────────
const WATCHED_EXTENSIONS = ['.json', '.md'];
const DEBOUNCE_MS = 250;
const KEEPALIVE_MS = 25000;
const FALLBACK_MS = 60000;

// ── Configuration ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.AGI_FARM_DASHBOARD_PORT || process.argv.includes('--port')
  ? process.argv[process.argv.indexOf('--port') + 1]
  : 8080);

const HOST = process.env.AGI_FARM_DASHBOARD_HOST || '127.0.0.1';

const WORKSPACE = process.env.AGI_FARM_WORKSPACE ||
  process.argv.includes('--workspace')
  ? process.argv[process.argv.indexOf('--workspace') + 1]
  : path.join(process.env.HOME, '.openclaw', 'workspace');

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
      const proc = spawn('openclaw', ['agents', 'list', '--json'], { timeout: 10000 });
      let stdout = '';
      proc.stdout.on('data', (data) => stdout += data);
      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const agents = JSON.parse(stdout);
            const map = {};
            for (const a of agents) map[a.id] = a;
            resolve(map);
          } catch {
            resolve({});
          }
        } else {
          resolve({});
        }
      });
      proc.on('error', () => resolve({}));
    });
  }

  async fetchCrons() {
    return new Promise((resolve) => {
      const proc = spawn('openclaw', ['cron', 'list'], { timeout: 10000 });
      let stdout = '';
      proc.stdout.on('data', (data) => stdout += data);
      proc.on('close', (code) => {
        const statuses = {};
        if (code === 0) {
          const lines = stdout.split('\n').slice(1);
          for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length < 8) continue;
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i].toLowerCase();
              if (['running', 'ok', 'error', 'idle'].includes(part) && i + 2 < parts.length) {
                const cs = part;
                const agentId = parts[parts.length - 1].trim();
                if (cs === 'running' && !(agentId in statuses)) {
                  statuses[agentId] = 'busy';
                } else if (cs === 'error' && statuses[agentId] !== 'busy') {
                  statuses[agentId] = 'error';
                }
                break;
              }
            }
          }
        }
        resolve(statuses);
      });
      proc.on('error', () => resolve({}));
    });
  }

  async refresh() {
    const [agents, crons] = await Promise.all([
      this.fetchAgents(),
      this.fetchCrons()
    ]);
    this.agentStatuses = agents;
    this.cronStatuses = crons;
    this.lastRefresh = Date.now();
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
    } catch {}
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
    const cronFile = path.join(process.env.HOME, '.openclaw', 'cron', 'jobs.json');
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

  const crons = loadCrons();
  const cachedAgents = cache.getAgentStatuses();
  const cronStatuses = cache.getCronStatuses();

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
      inbox_count: countInbox(WORKSPACE, id),
      quality_score: perf.quality_score,
      credibility: perf.credibility,
      cache_age_seconds: Math.floor(cache.ageSeconds()),
      heartbeat_age_minutes: getHeartbeatAge(WORKSPACE, cached.workspace || ''),
    };
  });

  // Task counts
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in-progress').length,
    complete: tasks.filter(t => t.status === 'complete').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    hitl: tasks.filter(t => t.status === 'needs_human_decision').length,
  };

  return {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    tasks,
    task_counts: taskCounts,
    agents,
    budget,
    velocity,
    okrs,
    broadcast,
    experiments,
    improvement_backlog: improvementBacklog,
    shared_knowledge: sharedKnowledge,
    knowledge_count: sharedKnowledge.length,
    memory_lines: memory.split('\n').length,
    crons,
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
  const cache = new SlowDataCache();
  const broadcaster = new Broadcaster();

  // Serve React build
  const reactDist = path.join(__dirname, '..', 'dashboard-react', 'dist');
  if (fs.existsSync(reactDist)) {
    app.use(express.static(reactDist));
    console.log(`[dashboard] Serving React build from ${reactDist}`);
  } else {
    console.log(`[dashboard] React build not found at ${reactDist}, serving API only`);
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
      const open = require('open');
      open(`http://${HOST}:${PORT}`).catch(() => {});
    }
  });
}

main().catch(err => {
  console.error('[dashboard] Error:', err);
  process.exit(1);
});
