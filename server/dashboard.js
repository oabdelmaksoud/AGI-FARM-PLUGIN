#!/usr/bin/env node
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawn, spawnSync } from 'child_process';
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
import { ProjectService } from './services/projects.js';
import { TaskService } from './services/tasks.js';
import { IntakeService } from './services/intake.js';
import { TimelineService } from './services/timeline.js';
import { SkillsService } from './services/skills.js';
import { MemoryService } from './services/memory.js';
import { PolicyService } from './services/policy.js';
import { MeteringService } from './services/metering.js';
import { WorkerService } from './services/worker.js';
import { safeWriteJson, withFileLockSync } from './services/storage.js';
import { SecurityService } from './services/security.js';
import { UpdateChecker } from './updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const PKG_VERSION = (() => {
  try {
    return require('../package.json')?.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

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

let _gatewayCache = { result: true, checkedAt: 0 };
const GATEWAY_TTL_MS = 30_000;
function probeGateway() {
  const now = Date.now();
  if (now - _gatewayCache.checkedAt < GATEWAY_TTL_MS) return _gatewayCache.result;
  try {
    const r = spawnSync('openclaw', ['--version'], { timeout: 3000 });
    _gatewayCache = { result: r.status === 0, checkedAt: now };
  } catch {
    _gatewayCache = { result: false, checkedAt: now };
  }
  return _gatewayCache.result;
}
// ── CSRF Token with periodic rotation ────────────────────────────────────
const CSRF_ROTATE_MS = 24 * 60 * 60 * 1000; // 24 hours
const _csrfState = {
  current: process.env.AGI_FARM_DASHBOARD_TOKEN || crypto.randomBytes(24).toString('hex'),
  previous: null,
  rotatedAt: Date.now(),
};

function getCsrfToken() {
  return _csrfState.current;
}

function rotateCsrfToken() {
  if (process.env.AGI_FARM_DASHBOARD_TOKEN) return; // static token from env — don't rotate
  _csrfState.previous = _csrfState.current;
  _csrfState.current = crypto.randomBytes(24).toString('hex');
  _csrfState.rotatedAt = Date.now();
}

function isValidCsrfToken(token) {
  if (constantTimeEquals(token, _csrfState.current)) return true;
  // Accept the previous token for a 5-minute grace period after rotation
  if (_csrfState.previous && (Date.now() - _csrfState.rotatedAt) < 5 * 60 * 1000) {
    return constantTimeEquals(token, _csrfState.previous);
  }
  return false;
}

// Rotate token periodically
setInterval(rotateCsrfToken, CSRF_ROTATE_MS);
const CRON_FILE = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json');
const SETTINGS_FILE = path.join(WORKSPACE, 'SETTINGS.json');
const CHANNEL_ADAPTER_STATE_FILE = path.join(WORKSPACE, 'CHANNEL_ADAPTER_STATE.json');

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
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[dashboard] readJson failed: ${filePath} — ${err.message}`);
    return {};
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asString(value, fallback = '') {
  if (value == null) return fallback;
  return String(value);
}

function asIsoOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function readMd(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[dashboard] readMd failed: ${filePath} — ${err.message}`);
    return '';
  }
}

function writeJsonIfMissing(filePath, value) {
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  return true;
}

function ensureOperationalFiles() {
  const created = [];

  if (writeJsonIfMissing(path.join(WORKSPACE, 'TASKS.json'), [])) created.push('TASKS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'AGENT_STATUS.json'), {})) created.push('AGENT_STATUS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), {})) created.push('AGENT_PERFORMANCE.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'BUDGET.json'), {
    period: 'monthly',
    currency: 'USD',
    limit: 0,
    spent: 0,
    threshold_warn: 0.8,
  })) created.push('BUDGET.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'VELOCITY.json'), {
    daily: [],
    weekly: [],
    by_agent: {},
    by_type: {},
  })) created.push('VELOCITY.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'OKRs.json'), { objectives: [] })) created.push('OKRs.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'EXPERIMENTS.json'), { experiments: [] })) created.push('EXPERIMENTS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json'), { items: [] })) created.push('IMPROVEMENT_BACKLOG.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json'), [])) created.push('SHARED_KNOWLEDGE.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'ALERTS.json'), [])) created.push('ALERTS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'PROJECTS.json'), {
    version: 1,
    defaults: {
      auto_project_channel: true,
      execution_path: 'agi-farm-first',
    },
    projects: [],
  })) created.push('PROJECTS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'PROJECT_EVENTS.json'), { events: [] })) created.push('PROJECT_EVENTS.json');
  if (writeJsonIfMissing(path.join(WORKSPACE, 'SETTINGS.json'), {
    budget_daily: null,
    budget_weekly: null,
    budget_monthly: null,
    hitl_enabled: true,
    auto_resume: false,
  })) created.push('SETTINGS.json');
  if (writeJsonIfMissing(CHANNEL_ADAPTER_STATE_FILE, { version: 1, seeded: false, files: {} })) created.push('CHANNEL_ADAPTER_STATE.json');

  if (created.length > 0) {
    console.log(`[dashboard] Seeded missing workspace files: ${created.join(', ')}`);
  }
}

function sanitizeSettingsPatch(body) {
  const patch = asObject(body);
  const toMoney = (value) => {
    if (value === '' || value == null) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
  };
  const out = {
    budget_daily: toMoney(patch.budget_daily),
    budget_weekly: toMoney(patch.budget_weekly),
    budget_monthly: toMoney(patch.budget_monthly),
    hitl_enabled: patch.hitl_enabled !== false,
    auto_resume: patch.auto_resume === true,
  };
  return out;
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

function readProjectsStore() {
  const raw = readJson(path.join(WORKSPACE, 'PROJECTS.json'));

  if (Array.isArray(raw)) {
    return {
      defaults: {
        auto_project_channel: true,
        execution_path: 'agi-farm-first',
      },
      projects: raw,
    };
  }

  const obj = asObject(raw);
  return {
    defaults: {
      auto_project_channel: obj?.defaults?.auto_project_channel !== false,
      execution_path: obj?.defaults?.execution_path || 'agi-farm-first',
    },
    projects: Array.isArray(obj.projects)
      ? obj.projects
      : (Array.isArray(obj.items) ? obj.items : []),
  };
}

function resolveOpenclawHome() {
  const parent = path.dirname(WORKSPACE);
  if (path.basename(WORKSPACE) === 'workspace' && path.basename(parent) === '.openclaw') {
    return parent;
  }
  return path.join(os.homedir(), '.openclaw');
}

function listSessionJsonlFiles() {
  const root = path.join(resolveOpenclawHome(), 'agents');
  const files = [];
  try {
    const agentDirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const agentDir of agentDirs) {
      const sessionsDir = path.join(root, agentDir.name, 'sessions');
      if (!fs.existsSync(sessionsDir)) continue;
      const sessionFiles = fs.readdirSync(sessionsDir, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith('.jsonl') && !d.name.endsWith('.lock'))
        .map((d) => path.join(sessionsDir, d.name));
      files.push(...sessionFiles);
    }
  } catch (err) {
    console.warn(`[dashboard] session file listing failed: ${err.message}`);
  }
  return files;
}

function readLines(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return text.split('\n').filter((line) => line.trim().length > 0);
  } catch {
    return [];
  }
}

function extractAgentIdFromSessionPath(filePath) {
  const m = filePath.match(/[\/\\]agents[\/\\]([^\/\\]+)[\/\\]sessions[\/\\]/);
  return (m?.[1] || 'main').toLowerCase();
}

function extractMessageText(content) {
  if (typeof content === 'string') return sanitizeText(content, 8000).trim();
  if (!Array.isArray(content)) return '';
  const parts = content
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      if (item.type === 'text' && typeof item.text === 'string') return item.text;
      if (item.type === 'input_text' && typeof item.text === 'string') return item.text;
      return '';
    })
    .filter(Boolean);
  return sanitizeText(parts.join('\n\n'), 8000).trim();
}

function ensureCommsHeader(filePath, agentId, kind) {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const name = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  const header = kind === 'inbox' ? `# ${name}'s Inbox\n\nNo messages yet.\n` : `# ${name}'s Outbox\n\nNo messages yet.\n`;
  fs.writeFileSync(filePath, header, 'utf-8');
}

function appendInboundComms(agentId, timestamp, text) {
  const target = path.join(WORKSPACE, 'comms', 'inboxes', `${agentId}.md`);
  ensureCommsHeader(target, agentId, 'inbox');
  const ts = asIsoOrNull(timestamp) || new Date().toISOString();
  const entry = `\n## [HUMAN → ${agentId.toUpperCase()}] ${ts}\n${text}\n`;
  fs.appendFileSync(target, entry, 'utf-8');
}

function appendOutboundComms(agentId, timestamp, text) {
  const target = path.join(WORKSPACE, 'comms', 'outboxes', `${agentId}.md`);
  ensureCommsHeader(target, agentId, 'outbox');
  const ts = asIsoOrNull(timestamp) || new Date().toISOString();
  const entry = `\n## [${agentId.toUpperCase()} → HUMAN] ${ts}\n${text}\n`;
  fs.appendFileSync(target, entry, 'utf-8');
}

function isCronPrompt(text) {
  return /^\s*\[cron:[^\]]+\]/i.test(text || '');
}

function buildBaselineAdapterState(sessionFiles) {
  const files = {};
  for (const filePath of sessionFiles) {
    const lines = readLines(filePath);
    let hadHumanUser = false;
    for (const line of lines) {
      try {
        const row = JSON.parse(line);
        const msg = row?.message;
        if (row?.type === 'message' && msg?.role === 'user') {
          const text = extractMessageText(msg.content);
          if (text && !isCronPrompt(text)) {
            hadHumanUser = true;
            break;
          }
        }
      } catch {
        // ignore malformed lines in baseline scan
      }
    }
    files[filePath] = { lineCount: lines.length, hadHumanUser };
  }
  return { version: 1, seeded: true, files };
}

function syncChannelSessionsToComms() {
  const sessionFiles = listSessionJsonlFiles();
  if (sessionFiles.length === 0) return;

  let state = readJson(CHANNEL_ADAPTER_STATE_FILE);
  if (!state || state.seeded !== true || !state.files || typeof state.files !== 'object') {
    state = buildBaselineAdapterState(sessionFiles);
    safeWriteJson(CHANNEL_ADAPTER_STATE_FILE, state);
    return;
  }

  let changed = false;
  let stateDirty = false;
  for (const filePath of sessionFiles) {
    const prev = asObject(state.files[filePath]);
    const prevLineCount = Number(prev.lineCount || 0);
    let hadHumanUser = prev.hadHumanUser === true;
    const lines = readLines(filePath);
    const startAt = (prevLineCount <= lines.length) ? prevLineCount : 0;

    for (let i = startAt; i < lines.length; i += 1) {
      let row = null;
      try {
        row = JSON.parse(lines[i]);
      } catch {
        continue;
      }
      if (row?.type !== 'message') continue;

      const msg = row?.message || {};
      const role = asString(msg.role).toLowerCase();
      const text = extractMessageText(msg.content);
      if (!text) continue;

      const agentId = extractAgentIdFromSessionPath(filePath);
      const ts = row?.timestamp || msg?.timestamp || new Date().toISOString();

      if (role === 'user') {
        if (isCronPrompt(text)) continue;
        appendInboundComms(agentId, ts, text);
        hadHumanUser = true;
        changed = true;
      } else if (role === 'assistant') {
        const model = asString(msg.model).toLowerCase();
        if (!hadHumanUser && model !== 'delivery-mirror') continue;
        appendOutboundComms(agentId, ts, text);
        changed = true;
      }
    }

    const nextFileState = {
      lineCount: lines.length,
      hadHumanUser,
    };
    const prevState = asObject(state.files[filePath]);
    if (Number(prevState.lineCount || 0) !== nextFileState.lineCount || (prevState.hadHumanUser === true) !== nextFileState.hadHumanUser) {
      stateDirty = true;
    }
    state.files[filePath] = nextFileState;
  }

  // Garbage-collect removed session files from adapter state.
  const live = new Set(sessionFiles);
  for (const tracked of Object.keys(state.files)) {
    if (!live.has(tracked)) {
      delete state.files[tracked];
      stateDirty = true;
    }
  }

  if (changed || stateDirty) {
    safeWriteJson(CHANNEL_ADAPTER_STATE_FILE, state);
  }
}

function parseCommsEntries(markdown = '') {
  const entries = [];
  const text = asString(markdown, '');
  if (!text.trim()) return entries;

  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    const m = line.match(/^##\s+\[(.+?)\]\s+(.+)$/);
    if (m) {
      if (current) {
        current.body = current.body.join('\n').trim();
        entries.push(current);
      }
      const route = m[1] || '';
      const tsRaw = (m[2] || '').trim();
      const [from = '', to = ''] = route.split('→').map(s => s.trim());
      const ts = asIsoOrNull(tsRaw) || null;
      current = { from, to, ts, tsRaw, body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }

  if (current) {
    current.body = current.body.join('\n').trim();
    entries.push(current);
  }

  return entries;
}

function shortTaskTitle(text, maxLen = 80) {
  const oneLine = asString(text, '')
    .split('\n')
    .map(s => s.trim())
    .find(Boolean) || 'Chat request';
  return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen - 1)}…` : oneLine;
}

function deriveCommsTasksAndProjects(agentIds, comms, tasks, agents, projectsRaw) {
  const existingTaskIds = new Set(asArray(tasks).map(t => asString(t?.id)));
  const explicitProjectIds = new Set(asArray(projectsRaw).map(p => asString(p?.id)));
  const agentStatusMap = new Map(asArray(agents).map(a => [asString(a?.id), asString(a?.status).toLowerCase()]));

  const derivedTasks = [];
  const projectTaskMap = new Map();

  for (const agentId of agentIds) {
    const inboxEntries = parseCommsEntries(comms?.[agentId]?.inbox || '');
    const outboxEntries = parseCommsEntries(comms?.[agentId]?.outbox || '')
      .filter(e => e.ts)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const derivedProjectId = `chat-${agentId}`;
    for (const entry of inboxEntries) {
      const from = asString(entry.from).toUpperCase();
      if (!from.includes('HUMAN')) continue;

      const tsSeed = entry.ts || entry.tsRaw || `${Date.now()}`;
      const safeTs = tsSeed.replace(/[^0-9A-Za-z]/g, '').slice(0, 18);
      const taskId = `chat-${agentId}-${safeTs || Date.now()}`;
      if (existingTaskIds.has(taskId)) continue;

      const createdAt = entry.ts || new Date().toISOString();
      const agentStatus = agentStatusMap.get(agentId) || 'available';
      const response = outboxEntries.find(o => o.ts && new Date(o.ts).getTime() >= new Date(createdAt).getTime());
      const isDone = Boolean(response);
      const status = isDone ? 'complete' : (agentStatus === 'busy' || agentStatus === 'running' ? 'in-progress' : 'pending');

      derivedTasks.push({
        id: taskId,
        title: shortTaskTitle(entry.body),
        description: entry.body || '',
        status,
        assigned_to: agentId,
        project_id: derivedProjectId,
        source: 'comms',
        created_at: createdAt,
        updated_at: response?.ts || createdAt,
        completed_at: isDone ? response.ts : null,
        output: isDone ? shortTaskTitle(response.body, 140) : '',
        depends_on: [],
        chat: {
          from: entry.from,
          to: entry.to,
          responded: isDone,
          response_ts: response?.ts || null,
        },
      });
      existingTaskIds.add(taskId);

      if (!projectTaskMap.has(derivedProjectId)) projectTaskMap.set(derivedProjectId, []);
      projectTaskMap.get(derivedProjectId).push(taskId);
    }
  }

  const derivedProjects = [];
  for (const [projectId, taskIds] of projectTaskMap.entries()) {
    if (taskIds.length === 0) continue;
    if (explicitProjectIds.has(projectId)) continue;
    const owner = projectId.replace(/^chat-/, '');
    const createdAt = derivedTasks
      .filter(t => t.project_id === projectId)
      .map(t => t.created_at)
      .filter(Boolean)
      .sort()[0] || new Date().toISOString();
    const hasOpen = derivedTasks.some(t => t.project_id === projectId && t.status !== 'complete');

    derivedProjects.push({
      id: projectId,
      name: `Chat Channel: ${owner}`,
      description: `Auto-derived from HUMAN ↔ ${owner.toUpperCase()} chat messages.`,
      status: hasOpen ? 'active' : 'complete',
      owner,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      task_ids: taskIds,
      job_ids: [],
      tags: ['chat-derived'],
      auto_project_channel: true,
    });
  }

  return { derivedTasks, derivedProjects };
}

function applyProjectFilters(projects, filters = {}) {
  const q = asString(filters.search || '').trim().toLowerCase();
  const statusFilter = asString(filters.status || '').trim().toLowerCase();
  const ownerFilter = asString(filters.owner || '').trim().toLowerCase();
  const riskFilter = asString(filters.risk || '').trim().toLowerCase();
  const sort = asString(filters.sort || '').trim().toLowerCase();

  let out = asArray(projects).filter((p) => {
    if (statusFilter && asString(p.status).toLowerCase() !== statusFilter) return false;
    if (ownerFilter && asString(p.owner).toLowerCase() !== ownerFilter) return false;
    if (q) {
      const hay = `${asString(p.id)} ${asString(p.name)} ${asString(p.description)} ${(asArray(p.tags).join(' '))}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (riskFilter) {
      const unresolved = asArray(p._risks).filter((r) => !r?.resolved);
      const sev = new Set(unresolved.map((r) => asString(r?.severity).toLowerCase()));
      if (!sev.has(riskFilter)) return false;
    }
    return true;
  });

  if (sort === 'name') {
    out.sort((a, b) => asString(a.name).localeCompare(asString(b.name)));
  } else if (sort === 'progress') {
    out.sort((a, b) => Number(b?._progress_pct || 0) - Number(a?._progress_pct || 0));
  } else {
    out.sort((a, b) => new Date(b?.updated_at || b?.created_at || 0).getTime() - new Date(a?.updated_at || a?.created_at || 0).getTime());
  }

  return out;
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
  if (!token || !isValidCsrfToken(token)) {
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
  return withFileLockSync(CRON_FILE, () => {
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
    safeWriteJson(CRON_FILE, out);
    return { ok: true, enabled: next };
  });
}

const updateChecker = new UpdateChecker();

function buildWorkspaceSnapshot(cache, services) {
  try {
    syncChannelSessionsToComms();
  } catch (err) {
    console.warn(`[dashboard] channel adapter sync failed: ${err.message}`);
  }

  let tasks = asArray(readJson(path.join(WORKSPACE, 'TASKS.json')));
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
  const failures = readMd(path.join(WORKSPACE, 'FAILURES.md'));
  const decisions = readMd(path.join(WORKSPACE, 'DECISIONS.md'));
  const processes = extractProcesses(readJson(path.join(WORKSPACE, 'PROCESSES.json')));
  const securityStatus = readJson(path.join(WORKSPACE, 'SECURITY_STATUS.json'));
  const benchmarks = asObject(readJson(path.join(WORKSPACE, 'BENCHMARKS.json')));
  const alerts = asArray(readJson(path.join(WORKSPACE, 'ALERTS.json')));
  const projectsStore = readProjectsStore();
  const projectsRaw = asArray(projectsStore.projects);
  const settings = asObject(readJson(SETTINGS_FILE));
  const teamInfo = asObject(readJson(path.join(WORKSPACE, 'agi-farm-bundle', 'team.json')));
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

  const jobs = flags.jobs ? services.jobs.list({}).slice(0, 100) : [];
  const approvals = flags.approvals ? services.policy.listApprovals() : [];
  const usage = flags.metering ? services.metering.getUsage() : { records: [], perAgent: {}, perModel: {}, totals: {} };

  // Auto-derive tasks from jobs that have rootTaskId
  const taskIds = new Set(tasks.map(t => t.id));
  const derivedTasks = [];
  for (const job of jobs) {
    if (job.rootTaskId && !taskIds.has(job.rootTaskId)) {
      derivedTasks.push({
        id: job.rootTaskId,
        title: job.title || `Task from job ${job.id.slice(0, 8)}`,
        description: job.intent || '',
        status: job.status === 'complete' ? 'complete' : (job.status === 'running' ? 'in-progress' : 'pending'),
        assigned_to: job.assignedAgent || job.requestedBy || 'system',
        project_id: job.projectId || null,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
        depends_on: [],
      });
      taskIds.add(job.rootTaskId);
    }
  }
  // Derive tasks/projects from chat channels (HUMAN inbox messages + agent outbox responses).
  const { derivedTasks: commsDerivedTasks, derivedProjects: commsDerivedProjects } =
    deriveCommsTasksAndProjects(Object.keys(agentStatus), comms, tasks, agents, projectsRaw);

  // Merge explicit tasks + auto-derived from jobs + comms-derived tasks
  const allTasks = [...tasks, ...derivedTasks, ...commsDerivedTasks];
  const taskCounts = {
    total: allTasks.length,
    pending: allTasks.filter((t) => t.status === 'pending').length,
    'in-progress': allTasks.filter((t) => t.status === 'in-progress').length,
    complete: allTasks.filter((t) => t.status === 'complete').length,
    failed: allTasks.filter((t) => t.status === 'failed').length,
    blocked: allTasks.filter((t) => t.status === 'blocked').length,
    hitl: allTasks.filter((t) => t.status === 'needs_human_decision').length,
    needs_human_decision: allTasks.filter((t) => t.status === 'needs_human_decision').length,
  };

  const hitlTasks = allTasks.filter((t) => t.status === 'needs_human_decision');
  const slaAtRisk = allTasks.filter((t) => t.status !== 'complete' && t.sla?.deadline && new Date(t.sla.deadline) < new Date(Date.now() + 3600000));

  // Auto-derive projects from jobs that have projectId
  const jobProjects = {};
  for (const job of jobs) {
    if (job.projectId && !jobProjects[job.projectId]) {
      jobProjects[job.projectId] = {
        id: job.projectId,
        name: job.title || job.projectId,
        description: job.intent || '',
        status: job.status === 'complete' ? 'complete' : 'active',
        owner: job.requestedBy || 'system',
        created_at: job.createdAt,
        updated_at: job.updatedAt,
        task_ids: job.rootTaskId ? [job.rootTaskId] : [],
        job_ids: [job.id],
      };
    } else if (job.projectId && jobProjects[job.projectId]) {
      jobProjects[job.projectId].job_ids.push(job.id);
      if (job.rootTaskId && !jobProjects[job.projectId].task_ids.includes(job.rootTaskId)) {
        jobProjects[job.projectId].task_ids.push(job.rootTaskId);
      }
    }
  }

  // Merge: explicit projects + auto-derived from jobs + chat-derived projects
  const allProjectsRaw = [...projectsRaw, ...Object.values(jobProjects), ...commsDerivedProjects];
  const projects = enrichProjects(allProjectsRaw, allTasks, agentPerf);
  const projectEvents = services.timeline ? services.timeline.list(null, { limit: 120 }) : [];

  return {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    workspace_meta: {
      path: WORKSPACE,
      team_name: asString(teamInfo.team_name || ''),
      orchestrator_name: asString(teamInfo.orchestrator_name || ''),
      version: PKG_VERSION,
      pid: process.pid,
    },
    version: PKG_VERSION,
    tasks: allTasks,
    task_counts: taskCounts,
    hitl_tasks: hitlTasks,
    sla_at_risk: slaAtRisk,
    agents,
    budget,
    velocity,
    okrs,
    broadcast,
    experiments: asArray(experiments.experiments || experiments),
    benchmarks,
    backlog: asArray(improvementBacklog.items || improvementBacklog),
    improvement_backlog: improvementBacklog,
    shared_knowledge: sharedKnowledge,
    knowledge: sharedKnowledge,
    knowledge_count: sharedKnowledge.length,
    memory,
    memory_lines: memory.trim() ? memory.split('\n').length : 0,
    failures,
    decisions,
    processes,
    security_status: securityStatus,
    crons,
    alerts,
    projects,
    project_defaults: projectsStore.defaults,
    project_events: projectEvents,
    settings,
    comms,
    jobs,
    approvals,
    usage,
    featureFlags: flags,
    gateway_online: probeGateway(),
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
    const failed = [];
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        failed.push(client);
      }
    }
    for (const client of failed) {
      this.clients.delete(client);
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

function sanitizeNote(note) {
  if (typeof note !== 'string') return '';
  let cleaned = note.slice(0, 1000).replace(/[\x00-\x1f\x7f]/g, '');
  if (cleaned.startsWith('-')) cleaned = ' ' + cleaned;
  return cleaned;
}

function sanitizeText(text, maxLen = 2000) {
  if (typeof text !== 'string') return '';
  return text.slice(0, maxLen).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
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
  ensureOperationalFiles();

  const apiLimiter = createRateLimiter(60000, 120);
  const actionLimiter = createRateLimiter(60000, 30);
  const sessionLimiter = createRateLimiter(60000, 20); // stricter limit for token endpoint
  app.use('/api', apiLimiter);

  const cache = new SlowDataCache();
  const broadcaster = new Broadcaster();

  const services = {
    audit: new AuditService(WORKSPACE),
    jobs: null,
    projects: null,
    tasks: null,
    intake: null,
    timeline: null,
    skills: null,
    memory: null,
    policy: null,
    metering: null,
    worker: null,
    security: null,
  };

  services.security = new SecurityService(WORKSPACE);
  services.jobs = new JobsService(WORKSPACE, services.audit);
  services.projects = new ProjectService(WORKSPACE);
  services.tasks = new TaskService(WORKSPACE);
  services.timeline = new TimelineService(WORKSPACE);
  services.skills = new SkillsService(WORKSPACE);
  services.memory = new MemoryService(WORKSPACE);
  services.policy = new PolicyService(WORKSPACE);
  services.metering = new MeteringService(WORKSPACE);
  services.intake = new IntakeService({
    projects: services.projects,
    tasks: services.tasks,
    jobs: services.jobs,
    timeline: services.timeline,
  });

  services.jobs.setUpdateHook((job, prev) => {
    services.tasks.syncFromJob(job);
    if (job.projectId) {
      services.projects.linkJob(job.projectId, job.id);
      if (job.rootTaskId) services.projects.linkTask(job.projectId, job.rootTaskId);
      if (!prev || prev.status !== job.status) {
        services.timeline.append({
          project_id: job.projectId,
          entity_type: 'job',
          entity_id: job.id,
          event_type: 'job_status_changed',
          summary: `${job.title || job.id}: ${prev?.status || 'new'} -> ${job.status}`,
          payload: { previous: prev?.status || null, current: job.status, jobId: job.id, rootTaskId: job.rootTaskId || null },
        });
      }
    }
  });

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

  app.get('/api/session', sessionLimiter, (req, res) => {
    res.json({ csrfToken: getCsrfToken() });
  });

  const reactDist = path.join(__dirname, '..', 'dashboard-react', 'dist');
  const fallbackDist = path.join(__dirname, '..', 'dashboard-dist');
  const staticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-store');
        return;
      }
      // Prevent stale lazy chunks after dashboard updates.
      res.setHeader('Cache-Control', 'no-store');
    },
  };

  let staticRoot = null;
  if (fs.existsSync(reactDist)) {
    staticRoot = reactDist;
    app.use(express.static(reactDist, staticOptions));
    console.log(`[dashboard] Serving React build from ${reactDist}`);
  } else if (fs.existsSync(fallbackDist)) {
    staticRoot = fallbackDist;
    app.use(express.static(fallbackDist, staticOptions));
    console.log(`[dashboard] Serving React build from ${fallbackDist}`);
  } else {
    console.log('[dashboard] React build not found, serving API only');
  }

  app.get('/api/stream', (req, res) => {
    // CSRF check — EventSource can't send headers, so accept query param
    const token = req.query.token || req.header('x-agi-farm-csrf');
    if (!token || !isValidCsrfToken(token)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
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

  app.get('/api/data', requireCsrf, (req, res) => {
    res.json(buildWorkspaceSnapshot(cache, services));
  });

  app.post('/api/intake/task', actionLimiter, requireCsrf, createPolicyGate(services, () => 'intake:task:create'), requireFeature('jobs'), (req, res) => {
    try {
      const body = asObject(req.body);
      const out = services.intake.submit({
        title: body.title,
        intent: body.intent,
        description: body.description,
        priority: body.priority,
        tags: asArray(body.tags),
        project_hint: body.project_hint || null,
        constraints: asObject(body.constraints),
      });
      services.audit.log('intake_task_created', { intakeId: out.intakeId, projectId: out.projectId, jobId: out.jobId });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json(out);
    } catch (err) {
      res.status(400).json({ error: err.message || 'intake_failed' });
    }
  });

  app.get('/api/projects', (req, res) => {
    const snapshot = buildWorkspaceSnapshot(cache, services);
    const filters = {
      status: req.query.status ? String(req.query.status) : undefined,
      owner: req.query.owner ? String(req.query.owner) : undefined,
      risk: req.query.risk ? String(req.query.risk) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      sort: req.query.sort ? String(req.query.sort) : undefined,
    };
    const projects = applyProjectFilters(snapshot.projects || [], filters);
    res.json({ projects, defaults: services.projects.getDefaults() });
  });

  app.patch('/api/projects/defaults', actionLimiter, requireCsrf, createPolicyGate(services, () => 'project:defaults:update'), (req, res) => {
    try {
      const body = asObject(req.body);
      const defaults = services.projects.setDefaults({
        auto_project_channel: body.auto_project_channel,
        execution_path: body.execution_path,
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, defaults });
    } catch (err) {
      res.status(400).json({ error: err.message || 'project_defaults_update_failed' });
    }
  });

  app.get('/api/projects/:id', validateId, (req, res) => {
    const snapshot = buildWorkspaceSnapshot(cache, services);
    const project = asArray(snapshot.projects || []).find((p) => p.id === req.params.id) || null;
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const tasks = (snapshot.tasks || []).filter((t) => t.project_id === project.id || (project.task_ids || []).includes(t.id));
    const jobs = services.jobs.list({ projectId: project.id }).slice(0, 200);
    const approvals = services.policy.listApprovals().filter((a) => jobs.some((j) => j.id === a.jobId));
    const timeline = services.timeline.list(project.id, { limit: 400 });
    res.json({ project, tasks, jobs, approvals, timeline });
  });

  app.post('/api/projects', actionLimiter, requireCsrf, createPolicyGate(services, () => 'project:create'), (req, res) => {
    try {
      const body = asObject(req.body);
      const defaults = services.projects.getDefaults();
      const created = services.projects.create({
        name: asString(body.name || body.title, 'Untitled Project'),
        description: asString(body.description || ''),
        status: asString(body.status || 'active'),
        owner: asString(body.owner || 'main'),
        team: asArray(body.team).map(String),
        objective: asString(body.objective || body.description || ''),
        target_completion: asIsoOrNull(body.target_completion),
        tags: asArray(body.tags).map(String),
        priority_weight: Number(body.priority_weight || 0),
        budget: asObject(body.budget),
        okr_refs: asObject(body.okr_refs),
        milestones: asArray(body.milestones),
        auto_project_channel: body.auto_project_channel ?? defaults.auto_project_channel,
        execution_path: body.execution_path || defaults.execution_path,
      });
      services.timeline.append({
        project_id: created.id,
        entity_type: 'project',
        entity_id: created.id,
        event_type: 'project_created',
        summary: created.name,
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, project: created });
    } catch (err) {
      res.status(400).json({ error: err.message || 'project_create_failed' });
    }
  });

  app.patch('/api/projects/:id', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:update:${req.params.id}`), (req, res) => {
    try {
      const body = asObject(req.body);
      const criticalStatus = ['cancelled', 'archived', 'blocked'].includes(String(body.status || '').toLowerCase());
      if (criticalStatus && getFeatureFlags().policy && getFeatureFlags().approvals) {
        const ap = services.policy.createApproval({
          jobId: null,
          action: `project:critical_status:${req.params.id}`,
          payload: body,
          reason: 'critical status change requires approval',
        });
        res.status(409).json({ error: 'approval_required', approvalId: ap.id });
        return;
      }
      const updated = services.projects.update(req.params.id, {
        ...body,
        target_completion: body.target_completion ? asIsoOrNull(body.target_completion) : undefined,
      });
      if (!updated) {
        res.status(404).json({ error: 'project_not_found' });
        return;
      }
      services.timeline.append({
        project_id: updated.id,
        entity_type: 'project',
        entity_id: updated.id,
        event_type: 'project_updated',
        summary: updated.name,
        payload: { patch: body },
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, project: updated });
    } catch (err) {
      res.status(400).json({ error: err.message || 'project_update_failed' });
    }
  });

  app.post('/api/projects/:id/tasks', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:task:add:${req.params.id}`), (req, res) => {
    try {
      const body = asObject(req.body);
      const project = services.projects.get(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'project_not_found' });
        return;
      }
      const task = services.tasks.create({
        id: body.id || undefined,
        title: asString(body.title || 'Untitled task'),
        description: asString(body.description || ''),
        type: asString(body.type || 'dev'),
        priority: asString(body.priority || 'P2'),
        status: asString(body.status || 'pending'),
        assigned_to: asString(body.assigned_to || project.owner || 'main'),
        depends_on: asArray(body.depends_on).map(String),
        project_id: project.id,
        sla: asObject(body.sla),
        estimate: body.estimate || null,
      });
      services.projects.linkTask(project.id, task.id);
      services.timeline.append({
        project_id: project.id,
        entity_type: 'task',
        entity_id: task.id,
        event_type: 'task_created',
        summary: task.title,
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, task });
    } catch (err) {
      res.status(400).json({ error: err.message || 'task_create_failed' });
    }
  });

  app.post('/api/tasks', actionLimiter, requireCsrf, createPolicyGate(services, () => 'task:create'), (req, res) => {
    try {
      const body = asObject(req.body);
      const task = services.tasks.create({
        id: body.id || undefined,
        title: asString(body.title || ''),
        description: asString(body.description || ''),
        type: asString(body.type || 'dev'),
        priority: asString(body.priority || 'P2'),
        status: asString(body.status || 'pending'),
        assigned_to: asString(body.assigned_to || ''),
        depends_on: asArray(body.depends_on).map(String),
        project_id: body.project_id || null,
        sla: asObject(body.sla),
        estimate: body.estimate || null,
      });
      if (task.project_id) {
        services.projects.linkTask(task.project_id, task.id);
      }
      services.timeline.append({
        project_id: task.project_id,
        entity_type: 'task',
        entity_id: task.id,
        event_type: 'task_created',
        summary: task.title,
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, task });
    } catch (err) {
      res.status(400).json({ error: err.message || 'task_create_failed' });
    }
  });

  app.patch('/api/tasks/:id', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `task:update:${req.params.id}`), (req, res) => {
    try {
      const body = asObject(req.body);
      const destructive = body.status === 'cancelled' || body.status === 'failed';
      if (destructive && getFeatureFlags().policy && getFeatureFlags().approvals) {
        const ap = services.policy.createApproval({
          jobId: null,
          action: `task:destructive_update:${req.params.id}`,
          payload: body,
          reason: 'destructive task change requires approval',
        });
        res.status(409).json({ error: 'approval_required', approvalId: ap.id });
        return;
      }
      const task = services.tasks.update(req.params.id, body);
      if (!task) {
        res.status(404).json({ error: 'task_not_found' });
        return;
      }
      services.timeline.append({
        project_id: task.project_id,
        entity_type: 'task',
        entity_id: task.id,
        event_type: 'task_updated',
        summary: task.title,
        payload: body,
      });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, task });
    } catch (err) {
      res.status(400).json({ error: err.message || 'task_update_failed' });
    }
  });

  app.post('/api/projects/:id/plan', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:plan:${req.params.id}`), (req, res) => {
    const project = services.projects.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const milestones = [
      { id: crypto.randomUUID(), title: 'Discovery', status: 'pending', due: project.target_completion || null, task_ids: [] },
      { id: crypto.randomUUID(), title: 'Execution', status: 'pending', due: project.target_completion || null, task_ids: [] },
      { id: crypto.randomUUID(), title: 'Validation', status: 'pending', due: project.target_completion || null, task_ids: [] },
    ];
    const updated = services.projects.update(project.id, { milestones });
    services.timeline.append({
      project_id: project.id,
      entity_type: 'project',
      entity_id: project.id,
      event_type: 'project_replanned',
      summary: `${project.name} replanned`,
    });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, project: updated, milestones });
  });

  app.post('/api/projects/:id/execute', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:execute:${req.params.id}`), requireFeature('jobs'), (req, res) => {
    const project = services.projects.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const body = asObject(req.body);
    const task = services.tasks.create({
      title: asString(body.title || `Execute ${project.name}`),
      description: asString(body.description || project.objective || project.description || ''),
      type: 'execution',
      priority: asString(body.priority || 'P2'),
      status: 'pending',
      assigned_to: project.owner || 'main',
      depends_on: [],
      project_id: project.id,
      sla: body.deadline ? { deadline: asIsoOrNull(body.deadline) } : null,
    });
    services.projects.linkTask(project.id, task.id);
    const job = services.jobs.create({
      title: task.title,
      intent: task.description || task.title,
      priority: task.priority,
      requestedBy: 'human',
      tags: Array.isArray(project.tags) ? project.tags : [],
      rootTaskId: task.id,
      projectId: project.id,
    });
    services.projects.linkJob(project.id, job.id);
    services.timeline.append({
      project_id: project.id,
      entity_type: 'job',
      entity_id: job.id,
      event_type: 'project_execution_started',
      summary: task.title,
      payload: { taskId: task.id, jobId: job.id },
    });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, projectId: project.id, taskId: task.id, jobId: job.id });
  });

  app.get('/api/projects/:id/timeline', validateId, (req, res) => {
    const project = services.projects.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 200, 2000));
    const timeline = services.timeline.list(project.id, { limit });
    res.json({ events: timeline });
  });

  app.post('/api/projects/:id/budget', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:budget:${req.params.id}`), (req, res) => {
    const project = services.projects.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const body = asObject(req.body);
    const nextBudget = {
      allocated_usd: Number(body.allocated_usd ?? project.budget?.allocated_usd ?? 0),
      spent_usd: Number(body.spent_usd ?? project.budget?.spent_usd ?? 0),
      forecast_usd: Number(body.forecast_usd ?? project.budget?.forecast_usd ?? 0),
      alert_threshold: Number(body.alert_threshold ?? project.budget?.alert_threshold ?? 0.8),
    };

    const overrun = nextBudget.allocated_usd > 0 && nextBudget.forecast_usd > nextBudget.allocated_usd;
    if (overrun && getFeatureFlags().policy && getFeatureFlags().approvals) {
      const ap = services.policy.createApproval({
        jobId: null,
        action: `project:budget_overrun:${project.id}`,
        payload: nextBudget,
        reason: 'budget overrun requires approval',
      });
      res.status(409).json({ error: 'approval_required', approvalId: ap.id });
      return;
    }

    const updated = services.projects.update(project.id, { budget: nextBudget });
    services.timeline.append({
      project_id: project.id,
      entity_type: 'project',
      entity_id: project.id,
      event_type: 'budget_updated',
      summary: `Budget updated for ${project.name}`,
      payload: nextBudget,
    });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, project: updated });
  });

  app.post('/api/projects/:id/okr-link', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `project:okr_link:${req.params.id}`), (req, res) => {
    const project = services.projects.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'project_not_found' });
      return;
    }
    const body = asObject(req.body);
    const updated = services.projects.update(project.id, {
      okr_refs: {
        objective_id: body.objective_id || null,
        kr_ids: asArray(body.kr_ids).map(String),
      },
    });
    services.timeline.append({
      project_id: project.id,
      entity_type: 'project',
      entity_id: project.id,
      event_type: 'okr_link_updated',
      summary: `OKR linkage updated for ${project.name}`,
      payload: updated.okr_refs,
    });
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, project: updated });
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
  // Backward-compatible aliases used by older dashboard bundles.
  app.post('/api/crons/:id/run', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `cron:trigger:${req.params.id}`), async (req, res) => {
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
  app.post('/api/crons/:id/toggle', actionLimiter, validateId, requireCsrf, createPolicyGate(services, (req) => `cron:toggle:${req.params.id}`), async (req, res) => {
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
    const note = sanitizeNote(req.body.note);
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
      projectId: body.projectId || null,
    });
    services.audit.log('api_job_created', { jobId: job.id });
    if (job.projectId) {
      services.projects.linkJob(job.projectId, job.id);
      services.timeline.append({
        project_id: job.projectId,
        entity_type: 'job',
        entity_id: job.id,
        event_type: 'job_created',
        summary: job.title || job.id,
      });
    }
    broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
    res.json({ ok: true, jobId: job.id, job });
  });

  app.get('/api/jobs', requireFeature('jobs'), (req, res) => {
    const { status, agent, created_after: createdAfter, project_id: projectId } = req.query;
    const jobs = services.jobs.list({ status, agent, createdAfter, projectId });
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
    const note = sanitizeNote(req.body?.note);
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
    const note = sanitizeNote(req.body?.note);
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

  app.post('/api/settings', actionLimiter, requireCsrf, createPolicyGate(services, () => 'settings:update'), (req, res) => {
    try {
      const next = sanitizeSettingsPatch(req.body);
      withFileLockSync(SETTINGS_FILE, () => {
        safeWriteJson(SETTINGS_FILE, next);
      });
      services.audit.log('settings_updated', { keys: Object.keys(next) });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, settings: next });
    } catch (err) {
      res.status(500).json({ error: 'settings_update_failed', message: err.message });
    }
  });

  // ── Broadcast Endpoint ─────────────────────────────────────────────────
  app.post('/api/broadcast', actionLimiter, requireCsrf, (req, res) => {
    const message = sanitizeText(req.body?.message, 2000);
    if (!message.trim()) {
      res.status(400).json({ error: 'empty_message' });
      return;
    }
    try {
      const broadcastPath = path.join(WORKSPACE, 'comms', 'broadcast.md');
      fs.mkdirSync(path.dirname(broadcastPath), { recursive: true });
      const timestamp = new Date().toISOString();
      const entry = `\n## [${timestamp}]\n${message}\n`;
      fs.appendFileSync(broadcastPath, entry, 'utf-8');
      services.audit.log('broadcast_posted', { length: message.length });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'broadcast_failed', message: err.message });
    }
  });

  // ── Knowledge Endpoints ────────────────────────────────────────────────
  app.post('/api/knowledge', actionLimiter, requireCsrf, (req, res) => {
    const { title, content, category, tags } = req.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'content_required' });
      return;
    }
    try {
      const knowledgePath = path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json');
      const entry = withFileLockSync(knowledgePath, () => {
        const existing = asArray(readJson(knowledgePath));
        const e = {
          id: `kn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: sanitizeText(title, 200),
          content: sanitizeText(content, 5000),
          category: sanitizeText(category, 50) || 'general',
          tags: Array.isArray(tags) ? tags.map(t => sanitizeText(String(t), 30)).slice(0, 10) : [],
          added_by: 'human',
          confidence: 0.95,
          created_at: new Date().toISOString(),
        };
        existing.push(e);
        safeWriteJson(knowledgePath, existing);
        return e;
      });
      services.audit.log('knowledge_created', { id: entry.id });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true, entry });
    } catch (err) {
      res.status(500).json({ error: 'knowledge_create_failed', message: err.message });
    }
  });

  app.delete('/api/knowledge/:id', actionLimiter, validateId, requireCsrf, (req, res) => {
    try {
      const knowledgePath = path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json');
      const result = withFileLockSync(knowledgePath, () => {
        const existing = asArray(readJson(knowledgePath));
        const idx = existing.findIndex(e => e.id === req.params.id);
        if (idx === -1) return { found: false };
        existing.splice(idx, 1);
        safeWriteJson(knowledgePath, existing);
        return { found: true };
      });
      if (!result.found) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      services.audit.log('knowledge_deleted', { id: req.params.id });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'knowledge_delete_failed', message: err.message });
    }
  });

  // ── Comms Send Endpoint ────────────────────────────────────────────────
  app.post('/api/comms/:id/send', actionLimiter, validateId, requireCsrf, (req, res) => {
    const agentId = req.params.id;
    const message = sanitizeText(req.body?.message, 2000);
    if (!message.trim()) {
      res.status(400).json({ error: 'empty_message' });
      return;
    }
    try {
      const inboxPath = path.join(WORKSPACE, 'comms', 'inboxes', `${agentId}.md`);
      fs.mkdirSync(path.dirname(inboxPath), { recursive: true });
      const timestamp = new Date().toISOString();
      const entry = `\n## [HUMAN → ${agentId.toUpperCase()}] ${timestamp}\n${message}\n`;
      fs.appendFileSync(inboxPath, entry, 'utf-8');
      services.audit.log('comms_sent', { agentId, length: message.length });
      broadcaster.broadcast(buildWorkspaceSnapshot(cache, services));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'comms_send_failed', message: err.message });
    }
  });

  // ── Audit Log Endpoint ─────────────────────────────────────────────────
  app.get('/api/audit', requireCsrf, (req, res) => {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    try {
      const auditPath = path.join(WORKSPACE, 'AUDIT_LOG.jsonl');
      let lines = [];
      let total = 0;
      let dropped = 0;
      try {
        // Stream the file line-by-line to avoid loading entire file into memory
        const raw = fs.readFileSync(auditPath, 'utf-8');
        const allLines = raw.split('\n');
        for (const l of allLines) {
          if (!l.trim()) continue;
          total++;
          try {
            lines.push(JSON.parse(l));
          } catch {
            dropped++;
          }
          // Keep only the last (limit + offset) entries in memory
          if (lines.length > limit + offset) {
            lines.shift();
          }
        }
      } catch { /* file doesn't exist yet */ }
      if (dropped > 0) console.warn(`[dashboard] audit log: ${dropped} malformed lines dropped`);
      // Paginate: take the last entries, skip offset from the end
      const sliced = offset > 0 ? lines.slice(-(limit + offset), -offset) : lines.slice(-limit);
      const entries = sliced.reverse();
      res.json({ entries, total, offset, limit });
    } catch (err) {
      res.status(500).json({ error: 'audit_read_failed', message: err.message });
    }
  });

  // ── Security Endpoints ───────────────────────────────────────────────────
  app.get('/api/security/status', (req, res) => {
    const status = services.security.getStatus();
    res.json(status || { grade: null, score: null, findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, status: 'NO_DATA', notes: 'No security scan has been run yet.' });
  });

  app.get('/api/security/history', (req, res) => {
    res.json({ history: services.security.getHistory() });
  });

  app.post('/api/security/scan', actionLimiter, requireCsrf, async (req, res) => {
    try {
      const result = await services.security.runScan({ fix: req.body?.fix === true });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'scan_failed', message: err.message });
    }
  });

  app.post('/api/security/fix', actionLimiter, requireCsrf, async (req, res) => {
    try {
      const result = await services.security.autoFix();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'fix_failed', message: err.message });
    }
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

  app.post('/api/update-install', actionLimiter, requireCsrf, createPolicyGate(services, () => 'update:install'), async (req, res) => {
    try {
      const result = await updateChecker.performUpdate();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SPA route fallback (supports direct links like /projects, /tasks, etc.)
  if (staticRoot) {
    app.get(/^\/(?!api\/).*/, (req, res) => {
      if (req.path.startsWith('/assets/') || path.extname(req.path)) {
        res.status(404).end();
        return;
      }
      res.sendFile(path.join(staticRoot, 'index.html'));
    });
  }

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

  // Validate workspace directory exists (create if missing)
  try {
    fs.mkdirSync(WORKSPACE, { recursive: true });
    fs.accessSync(WORKSPACE, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    console.error(`[dashboard] Workspace not accessible: ${WORKSPACE} — ${err.message}`);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[dashboard] AGI Farm Dashboard running at http://${HOST}:${PORT}`);
    console.log(`[dashboard] Workspace: ${WORKSPACE}`);
    console.log(`[dashboard] SSE endpoint: http://${HOST}:${PORT}/api/stream`);

    if (!NO_BROWSER) {
      open(`http://${HOST}:${PORT}`).catch(() => { });
    }

    // Non-blocking update check on startup
    updateChecker.check().catch(() => { });
  });
}

main().catch((err) => {
  console.error('[dashboard] Error:', err);
  process.exit(1);
});
