#!/usr/bin/env node
/**
 * AGI Farm Auto-Dispatcher
 *
 * Reads TASKS.json and fires openclaw agent sessions for pending tasks.
 * Pure Node.js — no Python dependency required.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');
const TASKS_FILE = path.join(WORKSPACE, 'TASKS.json');
const LOG_DIR = path.join(WORKSPACE, 'logs');
const STALE_MINUTES = 30;
const MAX_CONCURRENT = 3;

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const dryRun = !execute;
const verbose = args.includes('--verbose');

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, 'auto-dispatch.log'), line + '\n');
  } catch { /* log write failure is non-fatal */ }
}

function getAgentStatus() {
  return readJson(path.join(WORKSPACE, 'AGENT_STATUS.json'), {});
}

function getBusyAgents() {
  const result = spawnSync('openclaw', ['agents', 'list', '--json'], {
    encoding: 'utf-8', timeout: 10000,
  });
  if (result.status !== 0) return new Set();
  try {
    const agents = JSON.parse(result.stdout);
    return new Set(agents.filter(a => a.sessionCount > 0).map(a => a.id));
  } catch { return new Set(); }
}

function isStale(task) {
  if (!task.updated_at && !task.started_at) return false;
  const ref = task.updated_at || task.started_at;
  const ageMs = Date.now() - new Date(ref).getTime();
  return ageMs > STALE_MINUTES * 60 * 1000;
}

function dependenciesMet(task, allTasks) {
  if (!task.depends_on || task.depends_on.length === 0) return true;
  const byId = Object.fromEntries(allTasks.map(t => [t.id, t]));
  return task.depends_on.every(dep => byId[dep]?.status === 'complete');
}

function dispatchTask(task, agentId) {
  const cmd = [
    'sessions', 'start',
    '--agent', agentId,
    '--message', `[AUTO-DISPATCH] Task assigned: ${task.id}\nTitle: ${task.title || '(untitled)'}\n${task.description || ''}`.trim(),
    '--non-interactive',
  ];
  if (verbose) log(`  → openclaw ${cmd.join(' ')}`);
  return spawnSync('openclaw', cmd, { encoding: 'utf-8', timeout: 15000 });
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(chalk.cyan.bold('\n⚡ AGI Farm — Auto-Dispatcher\n'));

if (dryRun) {
  console.log(chalk.yellow('Dry-run mode (preview only). Use --execute to run.\n'));
}

// Check for team.json
const team = readJson(path.join(BUNDLE_DIR, 'team.json'));
if (!team) {
  console.error(chalk.red('Error: No team bundle found. Run agi-farm setup first.'));
  process.exit(1);
}

// Load tasks
const tasks = readJson(TASKS_FILE, []);
if (!Array.isArray(tasks)) {
  console.error(chalk.red('Error: TASKS.json is invalid or missing.'));
  process.exit(1);
}

const agentStatus = getAgentStatus();
const busyAgents = execute ? getBusyAgents() : new Set();

// Eligible agents (non-main, non-busy, available)
const eligibleAgents = team.agents
  .filter(a => a.id !== 'main')
  .filter(a => !busyAgents.has(a.id))
  .filter(a => {
    const s = agentStatus[a.id];
    return !s || s.status === 'available' || s.status === undefined;
  });

// Pending tasks with no blocking dependencies
const pending = tasks
  .filter(t => t.status === 'pending')
  .filter(t => dependenciesMet(t, tasks));

// Stale in-progress tasks (reset to pending)
const staleInProgress = tasks.filter(t => t.status === 'in-progress' && isStale(t));

console.log(`📋 Tasks: ${tasks.length} total · ${pending.length} pending · ${staleInProgress.length} stale`);
console.log(`🤖 Agents: ${eligibleAgents.length} available\n`);

// Reset stale tasks
if (staleInProgress.length > 0) {
  log(`Resetting ${staleInProgress.length} stale in-progress task(s)...`);
  if (execute) {
    for (const t of staleInProgress) {
      t.status = 'pending';
      t.stale_reset_at = new Date().toISOString();
    }
    writeJson(TASKS_FILE, tasks);
  } else {
    for (const t of staleInProgress) {
      console.log(chalk.dim(`  Would reset stale task: ${t.id} "${t.title || ''}"`));
    }
  }
}

// HITL notification
const hitl = tasks.filter(t => t.status === 'needs_human_decision');
if (hitl.length > 0) {
  console.log(chalk.yellow(`⚠  ${hitl.length} task(s) need human decision:`));
  for (const t of hitl.slice(0, 5)) {
    console.log(chalk.yellow(`   • [${t.id}] ${t.title || '(untitled)'}`));
  }
  console.log();
}

if (pending.length === 0) {
  console.log(chalk.dim('No pending tasks to dispatch.\n'));
  process.exit(0);
}

// Dispatch up to MAX_CONCURRENT tasks
let dispatched = 0;
const agentQueue = [...eligibleAgents];

for (const task of pending) {
  if (dispatched >= MAX_CONCURRENT || agentQueue.length === 0) break;

  const assignedAgent = task.assigned_to
    ? agentQueue.find(a => a.id === task.assigned_to) || agentQueue[0]
    : agentQueue[0];

  if (dryRun) {
    console.log(chalk.blue(`  [DRY-RUN] Would dispatch task "${task.id}" → agent "${assignedAgent.id}"`));
  } else {
    log(`Dispatching task "${task.id}" → agent "${assignedAgent.id}"`);
    const result = dispatchTask(task, assignedAgent.id);
    if (result.status === 0) {
      // Mark as in-progress
      task.status = 'in-progress';
      task.started_at = new Date().toISOString();
      task.assigned_to = assignedAgent.id;
      log(`  ✅ Dispatched: ${task.id}`);
    } else {
      log(`  ⚠ Dispatch failed for ${task.id}: ${result.stderr?.trim()}`);
    }
    agentQueue.shift(); // each agent takes one task
  }
  dispatched++;
}

if (execute && dispatched > 0) {
  writeJson(TASKS_FILE, tasks);
}

console.log(
  execute
    ? chalk.green(`\n✅ Dispatched ${dispatched} task(s).\n`)
    : chalk.dim(`\n(Dry-run complete. ${dispatched} task(s) would be dispatched.)\n`)
);
