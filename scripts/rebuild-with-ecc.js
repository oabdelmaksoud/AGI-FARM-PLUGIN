#!/usr/bin/env node
/**
 * AGI Farm Rebuild with ECC Integration
 *
 * Regenerates workspace skeleton files from an existing team.json bundle.
 * Now includes ECC (Everything Claude Code) resources in agent SOUL.md files.
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
const PLUGIN_DIR = path.join(__dirname, '..');
const ECC_DIR = path.join(PLUGIN_DIR, 'ecc-resources');
const CONFIG_DIR = path.join(PLUGIN_DIR, 'config');

const args = process.argv.slice(2);
const force = args.includes('--force');

console.log(chalk.cyan.bold('\n🔄 AGI Farm — Rebuild Workspace (with ECC)\n'));

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

// ── Load ECC mappings ─────────────────────────────────────────────────────────
let eccMappings = {};
const eccMappingsPath = path.join(CONFIG_DIR, 'ecc-mappings.json');
if (fs.existsSync(eccMappingsPath)) {
  try {
    eccMappings = JSON.parse(fs.readFileSync(eccMappingsPath, 'utf-8'));
    console.log(chalk.green('✓ Loaded ECC mappings'));
  } catch (err) {
    console.warn(chalk.yellow('Warning: Could not load ECC mappings —'), err.message);
  }
} else {
  console.warn(chalk.yellow('Warning: ECC mappings not found, SOUL.md files will have placeholder templates'));
}

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

// ── Load and render template ──────────────────────────────────────────────────
function renderTemplate(templatePath, variables) {
  if (!fs.existsSync(templatePath)) {
    return null;
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace simple variables {{VAR}}
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'string') {
      template = template.replaceAll(`{{${key}}}`, value);
    }
  }

  // Handle loop constructs {{#KEY}}...{{/KEY}}
  // For ECC_AGENTS
  if (variables.ECC_AGENTS && Array.isArray(variables.ECC_AGENTS)) {
    const agentPattern = /{{#ECC_AGENTS}}([\s\S]*?){{\/ECC_AGENTS}}/g;
    template = template.replace(agentPattern, (_, itemTemplate) => {
      return variables.ECC_AGENTS.map(agent => {
        let item = itemTemplate;
        for (const [k, v] of Object.entries(agent)) {
          item = item.replaceAll(`{{${k}}}`, String(v));
        }
        return item;
      }).join('');
    });
  }

  // For ECC_SKILLS
  if (variables.ECC_SKILLS && Array.isArray(variables.ECC_SKILLS)) {
    const skillPattern = /{{#ECC_SKILLS}}([\s\S]*?){{\/ECC_SKILLS}}/g;
    template = template.replace(skillPattern, (_, itemTemplate) => {
      return variables.ECC_SKILLS.map(skill => {
        let item = itemTemplate;
        for (const [k, v] of Object.entries(skill)) {
          item = item.replaceAll(`{{${k}}}`, String(v));
        }
        return item;
      }).join('');
    });
  }

  // For ECC_COMMANDS
  if (variables.ECC_COMMANDS && Array.isArray(variables.ECC_COMMANDS)) {
    const cmdPattern = /{{#ECC_COMMANDS}}([\s\S]*?){{\/ECC_COMMANDS}}/g;
    template = template.replace(cmdPattern, (_, itemTemplate) => {
      return variables.ECC_COMMANDS.map(cmd => {
        let item = itemTemplate;
        for (const [k, v] of Object.entries(cmd)) {
          item = item.replaceAll(`{{${k}}}`, String(v));
        }
        return item;
      }).join('');
    });
  }

  // For ECC_PRINCIPLES
  if (variables.ECC_PRINCIPLES && Array.isArray(variables.ECC_PRINCIPLES)) {
    const principlePattern = /{{#ECC_PRINCIPLES}}([\s\S]*?){{\/ECC_PRINCIPLES}}/g;
    template = template.replace(principlePattern, (_, itemTemplate) => {
      return variables.ECC_PRINCIPLES.map(principle => {
        return itemTemplate.replaceAll('{{.}}', principle);
      }).join('\n');
    });
  }

  return template;
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

// ── Per-agent SOUL.md with ECC ────────────────────────────────────────────────
console.log(chalk.bold('\nAgent personas (SOUL.md with ECC):'));

for (const agent of agents) {
  const wsPath = path.join(WORKSPACE, 'agents-workspaces', agent.workspace || agent.id);
  const soulPath = path.join(wsPath, 'SOUL.md');

  // Load agent-specific template
  const templatePath = path.join(PLUGIN_DIR, 'templates', `SOUL.md.${agent.id}`);
  const genericTemplatePath = path.join(PLUGIN_DIR, 'templates', 'SOUL.md.generic');

  const eccConfig = eccMappings[agent.id] || { agents: [], skills: [], commands: [], principles: [] };

  // Build ECC variables
  const eccAgents = eccConfig.agents.map(agentName => ({
    name: agentName.charAt(0).toUpperCase() + agentName.slice(1).replace(/-/g, ' '),
    file: `${agentName}.md`,
    description: getAgentDescription(agentName),
  }));

  const eccSkills = eccConfig.skills.map(skillName => ({
    name: skillName,
  }));

  const eccCommands = eccConfig.commands.map(cmdName => ({
    name: cmdName,
    description: getCommandDescription(cmdName),
  }));

  const variables = {
    AGENT_NAME: agent.name,
    AGENT_EMOJI: agent.emoji || '🤖',
    AGENT_ID: agent.id,
    TEAM_NAME: teamName,
    ORCHESTRATOR_NAME: orchName,
    WORKSPACE: WORKSPACE,
    DOMAIN: domain,
    GOAL: agent.goal || '',
    FRAMEWORKS: frameworks.join(', ') || 'none',
    ECC_PATH: ECC_DIR,
    ECC_AGENTS: eccAgents,
    ECC_SKILLS: eccSkills,
    ECC_COMMANDS: eccCommands,
    ECC_PRINCIPLES: eccConfig.principles || [],
  };

  let soulContent = renderTemplate(templatePath, variables);

  if (!soulContent) {
    // Fallback to generic template
    soulContent = renderTemplate(genericTemplatePath, variables);
  }

  if (!soulContent) {
    // Last resort: minimal SOUL.md
    soulContent = `# ${agent.emoji || '🤖'} ${agent.name} — ${agent.role || 'Agent'}

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
`;
  }

  writeFile(soulPath, soulContent);
}

// ── Helper functions ──────────────────────────────────────────────────────────
function getAgentDescription(name) {
  const descriptions = {
    'architect': 'System design and scalability',
    'planner': 'Implementation planning',
    'tdd-guide': 'Test-driven development',
    'code-reviewer': 'Code quality and maintainability',
    'security-reviewer': 'Vulnerability detection',
    'build-error-resolver': 'Fix build/type errors',
    'e2e-runner': 'End-to-end testing',
    'refactor-cleaner': 'Dead code cleanup',
    'doc-updater': 'Documentation and codemaps',
    'go-reviewer': 'Go code review',
    'go-build-resolver': 'Go build errors',
    'database-reviewer': 'PostgreSQL/Supabase specialist',
    'python-reviewer': 'Python code review',
    'chief-of-staff': 'Orchestration and delegation',
    'harness-optimizer': 'Agent harness optimization',
    'loop-operator': 'Autonomous loop management',
  };
  return descriptions[name] || 'Specialized agent';
}

function getCommandDescription(name) {
  const descriptions = {
    'build-fix': 'Fix build/type errors',
    'checkpoint': 'Save progress checkpoint',
    'code-review': 'Run code quality review',
    'e2e': 'Run end-to-end tests',
    'eval': 'Evaluate performance',
    'evolve': 'Process improvement',
    'go-build': 'Fix Go build errors',
    'go-test': 'Run Go tests',
    'harness-audit': 'Audit agent harness',
    'instinct-export': 'Export instinct data',
    'instinct-import': 'Import instinct data',
    'instinct-status': 'Check instinct status',
    'learn': 'Continuous learning',
    'learn-eval': 'Evaluate learning',
    'loop-start': 'Start autonomous loop',
    'loop-status': 'Check loop status',
    'model-route': 'Route to model',
    'multi-backend': 'Multi-backend support',
    'security-scan': 'Security vulnerability scan',
    'claw': 'CLI automation workflow',
  };
  return descriptions[name] || 'Command';
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(chalk.green('\n✅ Workspace rebuilt successfully with ECC integration'));
if (!force) {
  console.log(chalk.dim('Note: Existing files were preserved. Use --force to overwrite everything.'));
}
console.log();
