#!/usr/bin/env node
/**
 * AGI Farm Status - Show team health
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');

// ANSI color codes
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

console.log(`\n${cyan}${bold}🚜 AGI Farm — Team Status${reset}\n`);

// ── Agents ────────────────────────────────────────────────────────────────────
console.log(`${bold}Agents:${reset}`);
try {
  const result = spawnSync('openclaw', ['agents', 'list', '--json'], {
    encoding: 'utf-8',
    timeout: 10000,
  });

  if (result.status === 0) {
    const agents = JSON.parse(result.stdout);
    for (const a of agents) {
      const emoji = a.identityEmoji || '🤖';
      const name = a.identityName || a.id;
      const model = a.model || '?';
      console.log(`  ${emoji} ${name}: ${dim}${model}${reset}`);
    }
    console.log();
  } else {
    console.log(`${yellow}  Could not fetch agents${reset}\n`);
  }
} catch (err) {
  console.log(`${yellow}  Could not fetch agents${reset}\n`);
}

// ── Tasks ──────────────────────────────────────────────────────────────────────
console.log(`${bold}Tasks:${reset}`);
try {
  const tasksPath = path.join(WORKSPACE, 'TASKS.json');
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const hitl = tasks.filter(t => t.status === 'needs_human_decision').length;
    console.log(`  Total: ${tasks.length} · Pending: ${pending} · In Progress: ${inProgress} · HITL: ${yellow}${hitl}${reset}\n`);
  } else {
    console.log(`${yellow}  No TASKS.json found${reset}\n`);
  }
} catch {
  console.log(`${yellow}  Could not read tasks${reset}\n`);
}

// ── Crons ──────────────────────────────────────────────────────────────────────
console.log(`${bold}Recent Cron Jobs:${reset}`);
try {
  const result = spawnSync('openclaw', ['cron', 'list'], {
    encoding: 'utf-8',
    timeout: 10000,
  });

  if (result.status === 0) {
    const lines = result.stdout.split('\n').slice(0, 10);
    for (const line of lines) {
      console.log(`${dim}  ${line}${reset}`);
    }
    console.log();
  } else {
    console.log(`${yellow}  Could not fetch crons${reset}\n`);
  }
} catch {
  console.log(`${yellow}  Could not fetch crons${reset}\n`);
}

console.log(`${dim}Run /agi-farm dashboard for live ops room${reset}\n`);
