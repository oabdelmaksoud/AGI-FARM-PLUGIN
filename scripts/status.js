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

console.log(`\n${chalk.cyan.bold('🚜 AGI Farm — Team Status')}\n`);

// ── Agents ────────────────────────────────────────────────────────────────────
console.log(chalk.bold('Agents:'));
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
      const model = a.model || chalk.dim('(default)');
      console.log(`  ${emoji} ${chalk.white(name)}: ${chalk.dim(model)}`);
    }
    console.log();
  } else {
    console.log(`${chalk.yellow('  Could not fetch agents')}\n`);
  }
} catch {
  console.log(`${chalk.yellow('  Could not fetch agents')}\n`);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
console.log(chalk.bold('Tasks:'));
try {
  const tasksPath = path.join(WORKSPACE, 'TASKS.json');
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const hitl = tasks.filter(t => t.status === 'needs_human_decision').length;
    const complete = tasks.filter(t => t.status === 'complete').length;
    console.log(
      `  Total: ${chalk.white(tasks.length)} · ` +
      `Pending: ${chalk.blue(pending)} · ` +
      `In Progress: ${chalk.cyan(inProgress)} · ` +
      `Done: ${chalk.green(complete)} · ` +
      `HITL: ${hitl > 0 ? chalk.yellow(hitl) : chalk.dim(hitl)}\n`
    );
  } else {
    console.log(`${chalk.yellow('  No TASKS.json found — run agi-farm setup first')}\n`);
  }
} catch {
  console.log(`${chalk.yellow('  Could not read tasks')}\n`);
}

// ── Comms ─────────────────────────────────────────────────────────────────────
console.log(chalk.bold('Comms:'));
try {
  const commsDir = path.join(WORKSPACE, 'comms');
  if (fs.existsSync(commsDir)) {
    const inboxCount = fs.readdirSync(path.join(commsDir, 'inboxes')).length;
    console.log(`  ${chalk.green('✓')} comms OK — ${inboxCount} agent inbox(es)\n`);
  } else {
    console.log(`  ${chalk.red('✗')} comms missing — run agi-farm setup\n`);
  }
} catch {
  console.log(`  ${chalk.yellow('?')} comms unreadable\n`);
}

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
console.log(chalk.bold('Cron Jobs:'));
try {
  const result = spawnSync('openclaw', ['cron', 'list'], {
    encoding: 'utf-8',
    timeout: 10000,
  });

  if (result.status === 0) {
    const lines = result.stdout.split('\n').filter(l => l.trim()).slice(0, 10);
    if (lines.length > 0) {
      for (const line of lines) console.log(chalk.dim(`  ${line}`));
    } else {
      console.log(chalk.dim('  No cron jobs registered'));
    }
    console.log();
  } else {
    console.log(`${chalk.yellow('  Could not fetch crons')}\n`);
  }
} catch {
  console.log(`${chalk.yellow('  Could not fetch crons')}\n`);
}

console.log(chalk.dim('Run agi-farm dashboard for the live ops room\n'));
