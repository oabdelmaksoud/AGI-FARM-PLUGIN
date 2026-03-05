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
import { getFeatureFlags } from './services/feature-flags.js';
import { AuditService } from './services/audit.js';
import { JobsService } from './services/jobs.js';
import { SkillsService } from './services/skills.js';
import { MemoryService } from './services/memory.js';
import { PolicyService } from './services/policy.js';
import { MeteringService } from './services/metering.js';
import { WorkerService } from './services/worker.js';
import { UpdateChecker } from './updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WATCHED_EXTENSIONS = ['.json', '.md'];
const DEBOUNCE_MS = 250;
const KEEPALIVE_MS = 25000;
const FALLBACK_MS = 60000;

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
        proc.on('close', (code) => resolve(code === 0 ? parseAgentsJson(stdout) : {}));
        proc.on('error', () => resolve({}));
      } catch {
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
        proc.on('close', (code) => resolve(code === 0 ? parseCronList(stdout) : {}));
        proc.on('error', () => resolve({}));
      } catch {
        resolve({});
      }
    });
  }

  async refresh() {
    try {
      const [agents, crons] = await Promise.allSettled([this.fetchAgents(), this.fetchCrons()]);
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
    } catch {
      // ignore
    }
  }
  return 999;
}

function countInbox(workspace, agentId) {
  try {
    const content = fs.readFileSync(path.join(workspace, 'comms', 'inboxes', `${agentId}.md`), 'utf-8');
    return content.split('\n').filter((l) => l.startsWith('##')).length;
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

function requireCsrf(req, res, next) {
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

function toggleCronEnabled(id) {
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
}

function buildWorkspaceSnapshot(cache, services) {
  const tasks = asArray(readJson(path.join(WORKSPACE, 'TASKS.json')));
  const agentStatus = asObject(readJson(path.join(WORKSPACE, 'AGENT_STATUS.json')));
  const agentPerf = asObject(readJson(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json')));
  const budget = asObject(readJson(path.join(WORKSPACE, 'BUDGET.json')));
  const velocity = asObject(readJson(path.join(WORKSPACE, 'VELOCITY.json')));
  const okrs = asObject(readJson(path.join(WORKSPACE, 'OKRs.json')));
  const broadcast = readMd(path.join(WORKSPACE, 'comms', 'broadcast.md'));
  const experiments = asObject(readJson(path.join(WORKSPACE, 'EXPERIMENTS.json')));
  const improvementBacklog = asObject(readJson(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json')));
  const sharedKnowledge = asArray(readJson(path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json')));
  const memory = readMd(path.join(WORKSPACE, 'MEMORY.md'));
  const alerts = asArray(readJson(path.join(WORKSPACE, 'ALERTS.json')));
  const projects = asArray(readJson(path.join(WORKSPACE, 'PROJECTS.json')));
  const flags = getFeatureFlags();

  const crons = loadCrons();
  const cachedAgents = cache.getAgentStatuses();
  const cronStatuses = cache.getCronStatuses();

  const comms = {};
  Object.keys(agentStatus).forEach((id) => {
    comms[id] = {
      inbox: readMd(path.join(WORKSPACE, 'comms', 'inboxes', `${id}.md`)),
      outbox: readMd(path.join(WORKSPACE, 'comms', 'outboxes', `${id}.md`)),
    };
  });

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
      avg_quality: perf.quality_score || 0,
      credibility: perf.credibility || 1.0,
      cache_age_seconds: Math.floor(cache.ageSeconds()),
      heartbeat_age_minutes: getHeartbeatAge(WORKSPACE, cached.workspace || ''),
    };
  });

  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    complete: tasks.filter((t) => t.status === 'complete').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    hitl: tasks.filter((t) => t.status === 'needs_human_decision').length,
    needs_human_decision: tasks.filter((t) => t.status === 'needs_human_decision').length,
  };

  const hitlTasks = tasks.filter((t) => t.status === 'needs_human_decision');
  const slaAtRisk = tasks.filter((t) => t.status !== 'complete' && t.sla?.deadline && new Date(t.sla.deadline) < new Date(Date.now() + 3600000));

  const jobs = flags.jobs ? services.jobs.list({}).slice(0, 100) : [];
  const approvals = flags.approvals ? services.policy.listApprovals() : [];
  const usage = flags.metering ? services.metering.getUsage() : { records: [], perAgent: {}, perModel: {}, totals: {} };

  return {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    tasks,
    task_counts: taskCounts,
    hitl_tasks: hitlTasks,
    sla_at_risk: slaAtRisk,
    agents,
    budget,
    velocity,
    okrs,
    broadcast,
    experiments,
    improvement_backlog: improvementBacklog,
    shared_knowledge: sharedKnowledge,
    knowledge: sharedKnowledge,
    knowledge_count: sharedKnowledge.length,
    memory_lines: memory.split('\n').length,
    crons,
    alerts,
    projects,
    comms,
    jobs,
    approvals,
    usage,
    featureFlags: flags,
    gateway_online: true,
    cache_age_seconds: Math.floor(cache.ageSeconds()),
    update_info: updateChecker.getStatus(),
  };
}

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
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

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

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function validateId(req, res, next) {
  const { id } = req.params;
  if (id && !ID_PATTERN.test(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }
  next();
}

function validateAction(req, res, next) {
  const { action } = req.params;
  if (action && !ID_PATTERN.test(action)) {
    res.status(400).json({ error: 'invalid_action' });
    return;
  }
  next();
}

function requireFeature(name) {
  return (req, res, next) => {
    const flags = getFeatureFlags();
    if (!flags[name]) {
      res.status(503).json({ error: `feature_disabled:${name}` });
      return;
    }
    next();
  };
}

function createPolicyGate(services, actionFactory) {
  return (req, res, next) => {
    const flags = getFeatureFlags();
    if (!flags.policy) {
      next();
      return;
    }
    const action = actionFactory(req);
    const agentId = String(req.body?.agentId || 'main');
    const evalRes = services.policy.evaluate({ action, agentId });
    if (evalRes.denied || !evalRes.allowed) {
      services.audit.log('policy_denied_api', { action, agentId, reason: evalRes.reason, rule: evalRes.rule?.id || null });
      res.status(403).json({ error: 'policy_denied', reason: evalRes.reason || 'denied' });
      return;
    }
    if (evalRes.requiresApproval && getFeatureFlags().approvals) {
      const approval = services.policy.createApproval({
        jobId: req.params?.id || null,
        action,
        payload: { path: req.path, method: req.method, body: req.body || {} },
        reason: evalRes.reason || 'approval_required',
      });
      services.audit.log('policy_approval_requested_api', { action, approvalId: approval.id, rule: evalRes.rule?.id || null });
      res.status(409).json({ error: 'approval_required', approvalId: approval.id });
      return;
    }
    next();
  };
}

async function main() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  const apiLimiter = createRateLimiter(60000, 120);
  const actionLimiter = createRateLimiter(60000, 30);
  app.use('/api', apiLimiter);

  const cache = new SlowDataCache();
  const updateChecker = new UpdateChecker();
  const broadcaster = new Broadcaster();

  const services = {
    audit: new AuditService(WORKSPACE),
    jobs: null,
    skills: null,
    memory: null,
    policy: null,
    metering: null,
    worker: null,
  };

  services.jobs = new JobsService(WORKSPACE, services.audit);
  services.skills = new SkillsService(WORKSPACE);
  services.memory = new MemoryService(WORKSPACE);
  services.policy = new PolicyService(WORKSPACE);
  services.metering = new MeteringService(WORKSPACE);

  services.worker = new WorkerService({
    jobs: services.jobs,
    skills: services.skills,
    memory: services.memory,
    policy: services.policy,
    metering: services.metering,
    audit: services.audit,
    onUpdate: () => {
      const snapshot = buildWorkspaceSnapshot(cache, services);
      broadcaster.broadcast(snapshot);
    },
    concurrency: 2,
  });
  services.worker.start();

  app.get('/api/session', (req, res) => {
    res.json({ csrfToken: CSRF_TOKEN });
  });

  const reactDist = path.join(__dirname, '..', 'dashboard-react', 'dist');
  const fallbackDist = path.join(__dirname, '..', 'dashboard-dist');

  if (fs.existsSync(reactDist)) {
    app.use(express.static(reactDist));
    console.log(`[dashboard] Serving React build from ${reactDist}`);
  } else if (fs.existsSync(fallbackDist)) {
    app.use(express.static(fallbackDist));
    console.log(`[dashboard] Serving React build from ${fallbackDist}`);
  } else {
    console.log('[dashboard] React build not found, serving API only');
  }

  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    broadcaster.addClient(res);
    res.write(`data: ${JSON.stringify(buildWorkspaceSnapshot(cache, services))}\n\n`);

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

  app.get('/api/data', (req, res) => {
    res.json(buildWorkspaceSnapshot(cache, services));
  });

  // Existing cron and HITL endpoints
  app.post('/api/cron/:id/trigger', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `cron:trigger:${req.params.id}`), async (req, res) => {
    const { id } = req.params;
    try {
      const result = await runOpenclaw(['cron', 'run', id]);
      if (result.ok) {
        services.audit.log('cron_triggered', { id });
        res.json({ ok: true });
        return;
      }
      res.status(500).json({ ok: false, code: result.code, error: result.stderr || 'cron_run_failed' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cron/:id/toggle', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `cron:toggle:${req.params.id}`), async (req, res) => {
    const { id } = req.params;
    try {
      const result = toggleCronEnabled(id);
      if (!result.ok) {
        res.status(result.status || 500).json({ ok: false, error: result.error || 'toggle_failed' });
        return;
      }
      services.audit.log('cron_toggled', { id, enabled: result.enabled });
      res.json({ ok: true, enabled: result.enabled });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/hitl/:id/:action', actionLimiter, validateId, validateAction, requireCsrf, createPolicyGate(services, (req) => `hitl:${req.params.action}:${req.params.id}`), async (req, res) => {
    const { id, action } = req.params;
    const note = typeof req.body.note === 'string' ? req.body.note.slice(0, 1000) : '';
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ ok: false, error: 'invalid_action' });
      return;
    }
    try {
      const status = action === 'approve' ? 'pending' : 'blocked';
      const args = ['tasks', 'update', id, '--status', status];
      if (note) args.push('--comment', note);
      const result = await runOpenclaw(args);
      if (result.ok) {
        services.audit.log('hitl_action', { id, action });
        res.json({ ok: true });
        return;
      }
      res.status(500).json({ ok: false, code: result.code, error: result.stderr || 'task_update_failed' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // New jobs APIs
  app.post('/api/jobs', actionLimiter, requireCsrf, requireFeature('jobs'), (req, res) => {
    const body = asObject(req.body);
    const intent = String(body.intent || '').trim();
    if (!intent) {
      res.status(400).json({ error: 'intent_required' });
      return;
    }
    const job = services.jobs.create({
      title: body.title || null,
      intent,
      priority: body.priority || 'P2',
      requestedBy: body.requestedBy || 'human',
      tags: asArray(body.tags).slice(0, 12),
      rootTaskId: body.rootTaskId || null,
    });
    services.audit.log('api_job_created', { jobId: job.id });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, jobId: job.id, job });
  });

  app.get('/api/jobs', requireFeature('jobs'), (req, res) => {
    const { status, agent, created_after: createdAfter } = req.query;
    const jobs = services.jobs.list({ status, agent, createdAfter });
    res.json({ jobs });
  });

  app.get('/api/jobs/:id', validateId, requireFeature('jobs'), (req, res) => {
    const job = services.jobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'job_not_found' });
      return;
    }
    res.json({ job });
  });

  app.post('/api/jobs/:id/cancel', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `job:cancel:${req.params.id}`), requireFeature('jobs'), (req, res) => {
    const result = services.jobs.cancel(req.params.id);
    if (!result.ok) {
      res.status(404).json(result);
      return;
    }
    services.audit.log('api_job_cancelled', { jobId: req.params.id });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json(result);
  });

  app.post('/api/jobs/:id/retry', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `job:retry:${req.params.id}`), requireFeature('jobs'), (req, res) => {
    const result = services.jobs.retry(req.params.id);
    if (!result.ok) {
      res.status(404).json(result);
      return;
    }
    services.audit.log('api_job_retried', { jobId: req.params.id });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json(result);
  });

  app.get('/api/skills', requireFeature('skills'), (req, res) => {
    res.json({ skills: services.skills.list() });
  });

  app.post('/api/skills/:id/enable', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `skills:enable:${req.params.id}`), requireFeature('skills'), (req, res) => {
    const out = services.skills.setEnabled(req.params.id, true);
    if (!out.ok) {
      res.status(404).json(out);
      return;
    }
    services.audit.log('skill_enabled', { id: req.params.id });
    res.json(out);
  });

  app.post('/api/skills/:id/disable', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `skills:disable:${req.params.id}`), requireFeature('skills'), (req, res) => {
    const out = services.skills.setEnabled(req.params.id, false);
    if (!out.ok) {
      res.status(404).json(out);
      return;
    }
    services.audit.log('skill_disabled', { id: req.params.id });
    res.json(out);
  });

  app.get('/api/memory/search', requireFeature('memory'), (req, res) => {
    const q = String(req.query.q || '');
    const tags = String(req.query.tags || '').split(',').map((v) => v.trim()).filter(Boolean);
    const entries = services.memory.search({ q, tags });
    res.json({ entries });
  });

  app.get('/api/policies', requireFeature('policy'), (req, res) => {
    res.json(services.policy.getPolicies());
  });

  app.get('/api/approvals', requireFeature('approvals'), (req, res) => {
    res.json({ approvals: services.policy.listApprovals() });
  });

  app.post('/api/approvals/:id/approve', actionLimiter, validateId, requireCsrf, requireFeature('approvals'), (req, res) => {
    const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 300) : '';
    const out = services.policy.resolveApproval(req.params.id, 'approved', 'human', note);
    if (!out.ok) {
      res.status(400).json(out);
      return;
    }
    services.audit.log('approval_approved', { id: req.params.id });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json(out);
  });

  app.post('/api/approvals/:id/reject', actionLimiter, validateId, requireCsrf, requireFeature('approvals'), (req, res) => {
    const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 300) : '';
    const out = services.policy.resolveApproval(req.params.id, 'rejected', 'human', note);
    if (!out.ok) {
      res.status(400).json(out);
      return;
    }
    services.audit.log('approval_rejected', { id: req.params.id });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json(out);
  });

  app.get('/api/usage', requireFeature('metering'), (req, res) => {
    res.json(services.metering.getUsage());
  });

  // ── Update Check Endpoints ─────────────────────────────────────────────────
  app.get('/api/update-check', requireCsrf, async (req, res) => {
    try {
      const status = await updateChecker.check();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: 'update_check_failed' });
    }
  });

  app.post('/api/update-install', requireCsrf, actionLimiter, async (req, res) => {
    try {
      const result = await updateChecker.performUpdate();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
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
      pollInterval: 50,
    },
  });

  watcher.on('all', (event, filePath) => {
    const ext = path.extname(filePath);
    if (!WATCHED_EXTENSIONS.includes(ext)) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[dashboard] File changed: ${filePath} (${event})`);
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    }, DEBOUNCE_MS);
  });

  setInterval(() => {
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
  }, FALLBACK_MS);

  app.listen(PORT, HOST, () => {
    console.log(`[dashboard] AGI Farm Dashboard running at http://${HOST}:${PORT}`);
    console.log(`[dashboard] Workspace: ${WORKSPACE}`);
    console.log(`[dashboard] SSE endpoint: http://${HOST}:${PORT}/api/stream`);

    if (!NO_BROWSER) {
      open(`http://${HOST}:${PORT}`).catch(() => {});
    }

    // Non-blocking update check on startup
    updateChecker.check().catch(() => {});
  });
}

main().catch((err) => {
  console.error('[dashboard] Error:', err);
  process.exit(1);
});
