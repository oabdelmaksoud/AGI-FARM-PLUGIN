#!/usr/bin/env node
/**
 * AGI Farm Rebuild
 *
 * Regenerates workspace skeleton files from an existing team.json bundle.
 * Pure Node.js — no Python dependency required.
 * Preserves manually edited files by default (--force to overwrite).
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

const args = process.argv.slice(2);
const force = args.includes('--force');

console.log(chalk.cyan.bold('\n🔄 AGI Farm — Rebuild Workspace\n'));

// ── Load team.json ────────────────────────────────────────────────────────────
const teamJsonPath = path.join(BUNDLE_DIR, 'team.json');
if (!fs.existsSync(teamJsonPath)) {
  console.error(chalk.red('Error: team.json not found at'), teamJsonPath);
  console.log(chalk.yellow('Run agi-farm setup first.'));
  process.exit(1);
}

let team;
try {
  team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));
} catch (err) {
  console.error(chalk.red('Error: Could not parse team.json —'), err.message);
  process.exit(1);
}

const agents = team.agents || [];
const teamName = team.team_name || 'MyTeam';
const orchName = team.orchestrator_name || agents.find(a => a.id === 'main')?.name || 'Orchestrator';
const domain = team.domain || 'general';
const created = team.created_at || new Date().toISOString();
const frameworks = team.frameworks || [];

function writeFile(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists && !force) {
    console.log(chalk.dim(`  ↷ Skipped (exists): ${path.relative(WORKSPACE, filePath)}`));
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(chalk.green(`  ✓ ${exists ? 'Overwrote' : 'Created'}: ${path.relative(WORKSPACE, filePath)}`));
}

// ── Shared workspace files ────────────────────────────────────────────────────
console.log(chalk.bold('Shared workspace files:'));

// TASKS.json
writeFile(path.join(WORKSPACE, 'TASKS.json'), '[]');

// AGENT_STATUS.json
const agentStatus = Object.fromEntries(
  agents.map(a => [a.id, { status: 'available', name: a.name, role: a.role || 'Agent' }])
);
writeFile(path.join(WORKSPACE, 'AGENT_STATUS.json'), JSON.stringify(agentStatus, null, 2));

// AGENT_PERFORMANCE.json
const agentPerf = Object.fromEntries(
  agents.map(a => [a.id, { tasks_completed: 0, tasks_failed: 0, quality_score: 0, credibility: 1.0 }])
);
writeFile(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), JSON.stringify(agentPerf, null, 2));

// BUDGET.json
writeFile(path.join(WORKSPACE, 'BUDGET.json'), JSON.stringify({
  period: 'monthly', currency: 'USD',
  limit: 0, spent: 0, threshold_warn: 0.8,
}, null, 2));

// VELOCITY.json
writeFile(path.join(WORKSPACE, 'VELOCITY.json'), JSON.stringify({
  daily: [], weekly: [], by_agent: {}, by_type: {},
}, null, 2));

// OKRs.json
writeFile(path.join(WORKSPACE, 'OKRs.json'), JSON.stringify({ objectives: [] }, null, 2));

// EXPERIMENTS.json
writeFile(path.join(WORKSPACE, 'EXPERIMENTS.json'), JSON.stringify({ experiments: [] }, null, 2));

// IMPROVEMENT_BACKLOG.json
writeFile(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json'), JSON.stringify({ items: [] }, null, 2));

// SHARED_KNOWLEDGE.json
writeFile(path.join(WORKSPACE, 'SHARED_KNOWLEDGE.json'), '[]');

// ALERTS.json
writeFile(path.join(WORKSPACE, 'ALERTS.json'), '[]');

// PROJECTS.json
writeFile(path.join(WORKSPACE, 'PROJECTS.json'), '[]');

// MEMORY.md
writeFile(path.join(WORKSPACE, 'MEMORY.md'), `# ${teamName} — Shared Memory\n\n_Last rebuilt: ${new Date().toISOString()}_\n`);

// ── Comms infrastructure ──────────────────────────────────────────────────────
console.log(chalk.bold('\nComms infrastructure:'));
const commsDir = path.join(WORKSPACE, 'comms');
fs.mkdirSync(path.join(commsDir, 'inboxes'), { recursive: true });
fs.mkdirSync(path.join(commsDir, 'outboxes'), { recursive: true });

writeFile(path.join(commsDir, 'broadcast.md'), `# Broadcast Channel\n\n_Rebuilt: ${new Date().toISOString()}_\n`);

for (const agent of agents) {
  writeFile(path.join(commsDir, 'inboxes', `${agent.id}.md`), `# ${agent.name} — Inbox\n`);
  writeFile(path.join(commsDir, 'outboxes', `${agent.id}.md`), `# ${agent.name} — Outbox\n`);
}

// ── Per-agent SOUL.md ─────────────────────────────────────────────────────────
console.log(chalk.bold('\nAgent personas (SOUL.md):'));
for (const agent of agents) {
  if (agent.id === 'main') continue;
  const wsPath = path.join(WORKSPACE, 'agents-workspaces', agent.workspace || agent.id);
  const soulPath = path.join(wsPath, 'SOUL.md');
  writeFile(soulPath, `# ${agent.emoji || '🤖'} ${agent.name} — ${agent.role || 'Agent'}

**Team**: ${teamName}  
**Domain**: ${domain}  
**Goal**: ${agent.goal || ''}  
**Frameworks**: ${frameworks.join(', ') || 'none'}

## Core Directive
${agent.goal || 'Serve the team with excellence.'}

## Communication
- Post updates to comms/outboxes/${agent.id}.md
- Check comms/inboxes/${agent.id}.md for messages
- Use comms/broadcast.md for team-wide announcements

## Standards
- Be concise, direct, and actionable
- Always cite your sources
- Flag blockers immediately in broadcast.md as [BLOCKED]
`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(chalk.green('\n✅ Workspace rebuilt successfully'));
if (!force) {
  console.log(chalk.dim('Note: Existing files were preserved. Use --force to overwrite everything.'));
}
console.log();
