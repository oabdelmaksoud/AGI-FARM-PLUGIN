#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');

const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

console.log(`\n${chalk.cyan.bold('🚜 AGI Farm — Team Status')}\n`);

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
    console.log(`${chalk.yellow('  Could not fetch agents')}\n`);
  }
} catch (err) {
  console.log(`${chalk.yellow('  Could not fetch agents')}\n`);
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
    console.log(`  Total: ${tasks.length} · Pending: ${pending} · In Progress: ${inProgress} · HITL: ${chalk.yellow(hitl)}${reset}\n`);
  } else {
    console.log(`${chalk.yellow('  No TASKS.json found')}\n`);
  }
} catch {
  console.log(`${chalk.yellow('  Could not read tasks')}\n`);
}

// ── Crons ──────────────────────────────────────────────────────────────────────
console.log(`${bold}Recent Cron Jobs:${reset}`);
try {
  const result = spawnSync('openclaw', ['cron', 'list'], {
    encoding: 'utf-8',
    timeout: 10000,
  });

  if (result.status === 0) {
    const lines = result.stdout.split('\n').filter(l => l.trim()).slice(0, 10);
    for (const line of lines) {
      console.log(`${dim}  ${line}${reset}`);
    }
    console.log();
  } else {
    console.log(`${chalk.yellow('  Could not fetch crons')}\n`);
  }
} catch {
  console.log(`${chalk.yellow('  Could not fetch crons')}\n`);
}

console.log(`${chalk.dim('Run /agi-farm dashboard for live ops room')}\n`);
