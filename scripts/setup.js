#!/usr/bin/env node
/**
 * AGI Farm Advanced Setup Wizard (v2.0)
 *
 * Professional onboarding for autonomous AGI teams.
 * - 15 industry-specific blueprints
 * - Budget, OKR, and Cron configuration
 * - HITL Policy & Project pre-seeding
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import open from 'open';

// Local Libs
import { runCommand } from './lib/run-command.js';
import {
  loadAgentRegistry,
  getCategoryEmoji,
  formatCategoryName,
  countAgentsInCategory,
  getCategories
} from './lib/agent-registry.js';
import { TEAM_BLUEPRINTS, getBlueprintById, getBlueprintGroups } from './lib/blueprints.js';
import { CRON_DEFS, getAllCrons } from './lib/cron-defs.js';
import { PaperclipBridge } from '../server/paperclip-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAgentTemplatePath(templateName) {
  if (templateName.startsWith('agency-agents/')) {
    return path.join(TEMPLATES_DIR, 'agency-agents', templateName.replace('agency-agents/', ''));
  }
  return path.join(TEMPLATES_DIR, templateName);
}

// ── Environment Checks ───────────────────────────────────────────────────────
async function checkOpenClaw() {
  const spinner = ora('Checking OpenClaw environment...').start();
  const result = runCommand('openclaw', ['--version']);

  if (result.status === 0) {
    const version = result.stdout.trim();
    spinner.succeed(`OpenClaw detected: ${chalk.green(version)}`);
    return version;
  } else {
    spinner.warn(chalk.yellow('OpenClaw not found in PATH. Ensure it is installed: npm install -g openclaw'));
    return null;
  }
}

// ── Phase 1: Identity & Blueprint ─────────────────────────────────────────────
async function promptIdentity() {
  console.log(chalk.cyan.bold('\n✨ Phase 1: Identity & Blueprint\n'));

  const blueprintGroups = getBlueprintGroups();
  const blueprintChoices = [];

  for (const [industry, blueprints] of Object.entries(blueprintGroups)) {
    blueprintChoices.push(new inquirer.Separator(`── ${industry} ──`));
    blueprints.forEach(b => {
      blueprintChoices.push({
        name: `${b.emoji} ${b.name} (${b.timeline}) - ${b.description}`,
        value: b.id
      });
    });
  }

  blueprintChoices.push(new inquirer.Separator());
  blueprintChoices.push({ name: '🛠️  Custom Team (Build from scratch)', value: 'custom' });

  return inquirer.prompt([
    {
      type: 'input',
      name: 'teamName',
      message: 'What is your AGI team name?',
      default: 'Project Phoenix',
      validate: (input) => input.trim().length > 0 ? true : 'Team name cannot be empty'
    },
    {
      type: 'input',
      name: 'orchestratorName',
      message: 'What is your lead orchestrator\'s name?',
      default: 'Cooper',
      validate: (input) => input.trim().length > 0 ? true : 'Name cannot be empty'
    },
    {
      type: 'list',
      name: 'blueprintId',
      message: 'Select a team blueprint:',
      choices: blueprintChoices,
      pageSize: 15
    }
  ]);
}

// ── Custom Team Builder ──────────────────────────────────────────────────────
async function buildCustomTeam(orchestratorName) {
  const registry = loadAgentRegistry(TEMPLATES_DIR);
  const categories = getCategories(registry);

  const agents = [
    { id: 'main', template: 'SOUL.md.main', name: orchestratorName, emoji: '🦅', role: 'Orchestrator', workspace: '.' }
  ];

  console.log(chalk.yellow('\n🛠️ Building Custom Team...'));

  let adding = true;
  while (adding) {
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Browse agents by category:',
        choices: [
          ...categories.map(c => ({
            name: `${getCategoryEmoji(c)} ${formatCategoryName(c)} (${countAgentsInCategory(registry, c)})`,
            value: c
          })),
          new inquirer.Separator(),
          { name: '✅ Finish Team Construction', value: 'done' }
        ]
      }
    ]);

    if (category === 'done') break;

    const catAgents = registry.filter(a => a.category === category);
    const { selectedAgent } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAgent',
        message: `Select an agent from ${formatCategoryName(category)}:`,
        choices: [
          ...catAgents.map(a => ({
            name: `${a.emoji} ${a.name} - ${a.description}`,
            value: a
          })),
          new inquirer.Separator(),
          { name: '⬅️ Back to Categories', value: 'back' }
        ]
      }
    ]);

    if (selectedAgent === 'back') continue;

    agents.push({
      id: selectedAgent.id,
      template: selectedAgent.soulTemplate,
      name: selectedAgent.name,
      emoji: selectedAgent.emoji,
      role: selectedAgent.description,
      workspace: selectedAgent.id
    });

    console.log(chalk.green(`Added ${selectedAgent.name} to the team!`));
  }

  return agents;
}

// ── Phase 2: Intelligence & Capabilities ──────────────────────────────────────
async function promptIntelligence(blueprint) {
  console.log(chalk.cyan.bold('\n✨ Phase 2: Intelligence & Capabilities\n'));

  return inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Primary project domain (e.g. Fintech, E-commerce, AI Research):',
      default: blueprint?.industry || 'Generic'
    },
    {
      type: 'checkbox',
      name: 'techStack',
      message: 'Select core technologies (for agent context):',
      choices: [
        { name: 'JavaScript/TypeScript', checked: true },
        { name: 'Python', checked: true },
        { name: 'React/Next.js' },
        { name: 'Node.js' },
        { name: 'SQL/NoSQL' },
        { name: 'AWS/GCP/Azure' },
        { name: 'Docker/K8s' }
      ]
    },
    {
      type: 'confirm',
      name: 'enableSkills',
      message: 'Enable ECC Production Skills? (@tdd, @security, @api)',
      default: blueprint?.featureFlags?.skills ?? true
    }
  ]);
}

// ── Phase 3: Budget & Goals ──────────────────────────────────────────────────
async function promptBudget(blueprint) {
  console.log(chalk.cyan.bold('\n✨ Phase 3: Budget & Goals\n'));

  const budget = await inquirer.prompt([
    {
      type: 'input',
      name: 'monthlyLimit',
      message: 'Monthly budget limit (USD, 0 = unlimited):',
      default: '500',
      validate: (input) => !isNaN(parseFloat(input)) ? true : 'Please enter a valid number'
    },
    {
      type: 'input',
      name: 'thresholdWarn',
      message: 'Warning threshold (%):',
      default: '80',
      validate: (input) => !isNaN(parseFloat(input)) && input > 0 && input <= 100 ? true : 'Please enter a valid percentage (1-100)'
    },
    {
      type: 'confirm',
      name: 'seedOkrs',
      message: 'Seed starter OKRs from template?',
      default: true
    }
  ]);

  return budget;
}

// ── Phase 4: Operations ───────────────────────────────────────────────────────
async function promptOperations(blueprint) {
  console.log(chalk.cyan.bold('\n✨ Phase 4: Operations\n'));

  const ops = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableDispatcher',
      message: 'Enable Auto-Dispatcher for background tasks?',
      default: blueprint?.dispatchEnabled ?? true
    },
    {
      type: 'checkbox',
      name: 'activeCrons',
      message: 'Select team cron jobs to activate:',
      choices: getAllCrons().map(c => ({
        name: c.label + ' - ' + c.description,
        value: c.id,
        checked: blueprint?.crons?.includes(c.id)
      }))
    },
    {
      type: 'list',
      name: 'hitlSensitivity',
      message: 'HITL (Human-in-the-Loop) approval sensitivity:',
      choices: [
        { name: '🟢 Low - block only on critical decisions (threshold: 0.9)', value: 0.9 },
        { name: '🟡 Medium - block on high-risk actions (threshold: 0.7)', value: 0.7 },
        { name: '🔴 High - approve all actions > medium confidence (threshold: 0.5)', value: 0.5 }
      ],
      default: blueprint?.hitlPolicy?.threshold ?? 0.7
    }
  ]);

  return ops;
}

// ── Phase 5: First Project ──────────────────────────────────────────────────
async function promptProject(blueprint) {
  console.log(chalk.cyan.bold('\n✨ Phase 5: First Project\n'));

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'createProject',
      message: `Create a starter project (${blueprint?.starterProject?.name || 'Initial Project'})?`,
      default: true
    }
  ]);
}

// ── Phase 6: Confirm & Go ───────────────────────────────────────────────────
async function promptConfirm(config) {
  console.log(chalk.cyan.bold('\n✨ Phase 6: Confirm & Go\n'));

  console.log(chalk.white('Team Summary:'));
  console.log(chalk.white(`- Name:        ${config.teamName}`));
  console.log(chalk.white(`- Blueprint:   ${config.blueprintId}`));
  console.log(chalk.white(`- Agents:      ${config.agents.length}`));
  console.log(chalk.white(`- Budget:      $${config.budget.monthlyLimit}/mo`));
  console.log(chalk.white(`- Crons:       ${config.ops.activeCrons.length} active`));
  console.log(chalk.white(`- Workspace:   ${WORKSPACE}`));
  console.log();

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Everything look correct? Ready to deploy?',
      default: true
    }
  ]);
}

// ── Agent Creation ───────────────────────────────────────────────────────────
function createAgents(config) {
  const spinner = ora('Creating agents...').start();

  for (const a of config.agents) {
    spinner.text = `Creating agent: ${a.name} (${a.id})...`;

    // 1. Register with openclaw
    runCommand('openclaw', [
      'agents', 'add',
      '--id', a.id,
      '--name', a.name,
      '--role', a.role,
      '--emoji', a.emoji
    ]);

    // 2. Setup workspace directory
    const agentDir = path.join(WORKSPACE, a.workspace || a.id);
    fs.mkdirSync(agentDir, { recursive: true });

    // 3. Copy SOUL.md template
    const templateSource = getAgentTemplatePath(a.template);
    if (fs.existsSync(templateSource)) {
      const soulDest = path.join(agentDir, 'SOUL.md');
      let content = fs.readFileSync(templateSource, 'utf-8');

      // Basic dynamic replacement
      content = content.replace(/\{\{NAME\}\}/g, a.name);
      content = content.replace(/\{\{ROLE\}\}/g, a.role);
      content = content.replace(/\{\{TEAM_NAME\}\}/g, config.teamName);
      content = content.replace(/\{\{DOMAIN\}\}/g, config.intel.domain);

      fs.writeFileSync(soulDest, content);
    }
  }

  spinner.succeed('Agents created');
}

// ── Comms Initialization ─────────────────────────────────────────────────────
function initializeComms(config) {
  const spinner = ora('Initializing comms infrastructure...').start();

  const commsDir = path.join(WORKSPACE, 'comms');
  fs.mkdirSync(path.join(commsDir, 'inboxes'), { recursive: true });
  fs.mkdirSync(path.join(commsDir, 'outboxes'), { recursive: true });
  fs.mkdirSync(path.join(commsDir, 'channels'), { recursive: true });

  // Create team-wide channel
  const teamChannel = {
    id: 'team-wide',
    name: 'Team General',
    members: config.agents.map(a => a.id),
    messages: [
      { sender: 'system', text: `Welcome to ${config.teamName}! Comms initialized.`, timestamp: new Date().toISOString() }
    ]
  };
  fs.writeFileSync(path.join(commsDir, 'channels', 'team-wide.json'), JSON.stringify(teamChannel, null, 2));

  spinner.succeed('Comms infrastructure initialized');
}

// ── Registry Initialization ──────────────────────────────────────────────────
function initializeRegistries(config) {
  const spinner = ora('Initializing registries...').start();

  // TASKS.json
  fs.writeFileSync(path.join(WORKSPACE, 'TASKS.json'), '[]');

  // PROJECTS.json
  fs.writeFileSync(path.join(WORKSPACE, 'PROJECTS.json'), JSON.stringify({
    defaults: { auto_project_channel: true, execution_path: 'agi-farm-init' },
    items: []
  }, null, 2));

  // BUDGET.json
  fs.writeFileSync(path.join(WORKSPACE, 'BUDGET.json'), JSON.stringify({
    period: 'monthly',
    currency: 'USD',
    limit: parseFloat(config.budget.monthlyLimit),
    spent: 0,
    threshold_warn: parseFloat(config.budget.thresholdWarn) / 100
  }, null, 2));

  // OKRs.json
  const blueprint = getBlueprintById(config.blueprintId);
  const okrs = config.budget.seedOkrs && blueprint?.okrs ? blueprint.okrs : [];
  fs.writeFileSync(path.join(WORKSPACE, 'OKRs.json'), JSON.stringify({ objectives: okrs }, null, 2));

  // VELOCITY.json
  fs.writeFileSync(path.join(WORKSPACE, 'VELOCITY.json'), JSON.stringify({ daily: [], weekly: [], by_agent: {}, by_type: {} }, null, 2));

  // AGENT_STATUS.json & PERFORMANCE.json
  const status = {};
  const perf = {};
  for (const a of config.agents) {
    status[a.id] = { status: 'available', name: a.name };
    perf[a.id] = { tasks_completed: 0, tasks_failed: 0, quality_score: 0, credibility: 1.0 };
  }
  fs.writeFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), JSON.stringify(status, null, 2));
  fs.writeFileSync(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), JSON.stringify(perf, null, 2));

  spinner.succeed('Registries initialized');
}

// ── Cron Initialization ──────────────────────────────────────────────────────
function initializeCrons(config) {
  const spinner = ora('Initializing cron jobs...').start();

  const activeCrons = config.ops.activeCrons.map(id => {
    const def = CRON_DEFS[id];
    return {
      id: def.id,
      label: def.label,
      schedule: def.schedule,
      agent: def.agent,
      command: def.command,
      active: true,
      last_run: null,
      next_run: null
    };
  });

  fs.writeFileSync(path.join(WORKSPACE, 'CRONS.json'), JSON.stringify({ jobs: activeCrons }, null, 2));
  spinner.succeed(`Activated ${activeCrons.length} cron jobs`);
}

// ── HITL Policy Initialization ───────────────────────────────────────────────
function initializeHitlPolicy(config) {
  const spinner = ora('Initializing HITL security policy...').start();

  const policy = {
    global_threshold: config.ops.hitlSensitivity,
    auto_approve_below: config.ops.hitlSensitivity - 0.2, // buffer
    require_manual_review_for: [
      'filesystem_delete',
      'network_request',
      'process_kill',
      'security_scan_bypass'
    ],
    agent_overrides: {}
  };

  // Add agent-specific overrides for sensitive roles
  for (const a of config.agents) {
    if (a.role.toLowerCase().includes('security') || a.id === 'vigil') {
      policy.agent_overrides[a.id] = { threshold: 0.5 }; // stricter for security agents
    }
  }

  fs.writeFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), JSON.stringify(policy, null, 2));
  spinner.succeed('HITL security policy active');
}

// ── Starter Project Initialization ───────────────────────────────────────────
function initializeStarterProject(config) {
  if (!config.project.createProject) return;

  const blueprint = getBlueprintById(config.blueprintId);
  const starter = blueprint?.starterProject || {
    name: 'Initial Project',
    description: 'First research and development cycle',
    tasks: [{ id: 'init-1', title: 'Onboarding & Initial Research', assigned_to: 'main' }]
  };

  const spinner = ora(`Seeding starter project: ${starter.name}...`).start();

  // 1. Update PROJECTS.json
  const projects = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'PROJECTS.json'), 'utf-8'));
  const projectObj = {
    id: 'starter-p1',
    name: starter.name,
    description: starter.description,
    status: 'active',
    created_at: new Date().toISOString(),
    members: config.agents.map(a => a.id)
  };
  projects.items.push(projectObj);
  fs.writeFileSync(path.join(WORKSPACE, 'PROJECTS.json'), JSON.stringify(projects, null, 2));

  // 2. Update TASKS.json
  const tasks = starter.tasks.map(t => ({
    ...t,
    project_id: 'starter-p1',
    status: 'pending',
    priority: 'medium',
    created_at: new Date().toISOString()
  }));
  fs.writeFileSync(path.join(WORKSPACE, 'TASKS.json'), JSON.stringify(tasks, null, 2));

  spinner.succeed(`Project "${starter.name}" seeded with ${tasks.length} tasks`);
}

// ── Security Scan ────────────────────────────────────────────────────────────
async function offerSecurityScan() {
  const { runScan } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runScan',
      message: 'Run initial AgentShield security scan now?',
      default: true
    }
  ]);

  if (!runScan) return;

  const spinner = ora('Running AgentShield baseline scan...').start();
  const result = runCommand('npx', ['ecc-agentshield', 'scan', '--path', '.', '--format', 'json']);

  if (result.status === 0) {
    try {
      const scanData = JSON.parse(result.stdout);
      fs.writeFileSync(path.join(WORKSPACE, 'SECURITY_STATUS.json'), JSON.stringify({
        last_scan: new Date().toISOString(),
        score: scanData.overallScore || 100,
        issues: scanData.issues || []
      }, null, 2));
      spinner.succeed(`Security scan complete. Score: ${scanData.overallScore || 100}`);
    } catch {
      spinner.warn('Security scan completed but report parsing failed');
    }
  } else {
    spinner.warn('Security scan could not be completed at this time');
  }
}

// ── Paperclip Sync ───────────────────────────────────────────────────────────
async function syncToPaperclip(config) {
  const host = process.env.PAPERCLIP_HOST || '127.0.0.1';
  const port = process.env.PAPERCLIP_PORT || process.env.PORT || '3100';
  const baseUrl = `http://${host}:${port}`;
  const bridge = new PaperclipBridge(baseUrl);

  const spinner = ora('Syncing team to Paperclip dashboard...').start();

  try {
    await bridge.waitForReady(15_000);
  } catch {
    spinner.warn('Paperclip server not running — skipping sync. Start it with: agi-farm dashboard');
    return null;
  }

  try {
    const result = await bridge.syncTeam(config);
    spinner.succeed(`Team synced to Paperclip (company: ${result.company.id}, ${result.agents.length} agents)`);
    return result;
  } catch (err) {
    spinner.warn(`Paperclip sync failed: ${err.message}. You can sync later with: agi-farm dashboard`);
    return null;
  }
}

// ── Dashboard UX ─────────────────────────────────────────────────────────────
async function offerOpenDashboard() {
  const host = process.env.PAPERCLIP_HOST || '127.0.0.1';
  const port = process.env.PAPERCLIP_PORT || process.env.PORT || '3100';
  const url = `http://${host}:${port}`;

  console.log(chalk.cyan(`\n🌐 Opening Paperclip dashboard at ${url}...`));
  await open(url);
}

// ── Lifecycle Management ─────────────────────────────────────────────────────
async function checkExistingInstall() {
  const teamJsonPath = path.join(BUNDLE_DIR, 'team.json');
  if (!fs.existsSync(teamJsonPath)) {
    // Fresh Install Confirmation
    console.log(chalk.cyan.bold('\n👋 Welcome to AGI Farm!'));
    console.log(chalk.white('This wizard will guide you through building a professional AGI team.\n'));

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Ready to start a fresh installation?',
        default: true
      }
    ]);

    if (!proceed) {
      console.log(chalk.yellow('\nSetup aborted.'));
      process.exit(0);
    }
    return 'fresh';
  }

  // Existing Install Detected
  let team = {};
  try {
    team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf8'));
  } catch (err) { /* ignore */ }

  const currentName = team.teamName || team.team_name || 'Unknown Team';
  console.log(chalk.yellow(`\n⚠️  Existing Installation Detected: "${currentName}"`));
  console.log(chalk.dim(`Bundle path: ${BUNDLE_DIR}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🔄 Update Team (Sync registries and crons only)', value: 'update' },
        { name: '🔥 Full Reinstall (Wipe everything and start over)', value: 'reinstall' },
        { name: '🗑️  Teardown Team (Uninstall and clean workspace)', value: 'teardown' },
        new inquirer.Separator(),
        { name: '❌ Abort', value: 'abort' }
      ]
    }
  ]);

  if (action === 'abort') {
    console.log(chalk.dim('Operation aborted.'));
    process.exit(0);
  }

  if (action === 'teardown') {
    // Dynamically import and run teardown
    const teardown = await import('./teardown.js');
    process.exit(0); // teardown.js calls its own main loop
  }

  if (action === 'reinstall') {
    const { confirmReinstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmReinstall',
        message: chalk.red.bold('Are you sure? This will PERMANENTLY delete your existing agents and work.'),
        default: false
      }
    ]);

    if (!confirmReinstall) {
      console.log(chalk.dim('Reinstall cancelled.'));
      process.exit(0);
    }

    const spinner = ora('Wiping existing installation...').start();
    try {
      // Simple wipe of bundle and key files for fresh start
      fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
      spinner.succeed('Workspace prepared for fresh install');
    } catch (err) {
      spinner.fail('Failed to wipe workspace: ' + err.message);
      process.exit(1);
    }
    return 'fresh';
  }

  return action; // 'update'
}

// ── Main Controller ──────────────────────────────────────────────────────────
async function main() {
  try {
    console.log(chalk.cyan.bold('\n⚡ AGI Farm — Advanced Setup Wizard v2.0\n'));

    // 0. Environment Check
    await checkOpenClaw();

    // 1. Lifecycle Check
    const mode = await checkExistingInstall();

    if (mode === 'update') {
      console.log(chalk.cyan.bold('\n🔧 Updating Existing Team...\n'));
      const teamJsonPath = path.join(BUNDLE_DIR, 'team.json');
      const config = JSON.parse(fs.readFileSync(teamJsonPath, 'utf8'));

      // Update logic (non-destructive)
      // We need to synthesize enough config for the init functions
      const fullConfig = {
        ...config,
        budget: {
          monthlyLimit: config.budget?.limit || '500',
          thresholdWarn: (config.budget?.threshold_warn * 100) || '80',
          seedOkrs: false
        },
        ops: {
          activeCrons: config.activeCrons || [],
          hitlSensitivity: config.hitlThreshold || 0.7
        },
        project: { createProject: false }
      };

      initializeCrons(fullConfig);
      initializeHitlPolicy(fullConfig);
      initializeRegistries(fullConfig);

      console.log(chalk.green.bold('\n✅ Team updated successfully.\n'));
      process.exit(0);
    }

    // 1. Interactive Prompts (Fresh Install)
    const identity = await promptIdentity();
    const blueprint = getBlueprintById(identity.blueprintId);

    let agents = [];
    if (identity.blueprintId === 'custom') {
      agents = await buildCustomTeam(identity.orchestratorName);
    } else {
      agents = blueprint.agents.map(a => a.id === 'main' ? { ...a, name: identity.orchestratorName } : a);
    }

    const intel = await promptIntelligence(blueprint);
    const budget = await promptBudget(blueprint);
    const ops = await promptOperations(blueprint);
    const project = await promptProject(blueprint);

    const config = {
      ...identity,
      agents,
      intel,
      budget,
      ops,
      project
    };

    // 2. Confirmation
    const { confirmed } = await promptConfirm(config);
    if (!confirmed) {
      console.log(chalk.yellow('\nSetup cancelled by user.'));
      return;
    }

    // 3. Execution
    console.log(chalk.cyan.bold('\n🚀 Deploying AGI Team...\n'));

    // Create bundle directory and team.json
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });
    fs.writeFileSync(path.join(BUNDLE_DIR, 'team.json'), JSON.stringify({
      teamName: config.teamName,
      orchestrator: config.orchestratorName,
      blueprint: config.blueprintId,
      agents: config.agents,
      domain: config.intel.domain
    }, null, 2));

    // Run initialization sequence
    createAgents(config);
    initializeComms(config);
    initializeRegistries(config);
    initializeCrons(config);
    initializeHitlPolicy(config);
    initializeStarterProject(config);

    // Sync to Paperclip dashboard
    await syncToPaperclip(config);

    const paperclipPort = process.env.PAPERCLIP_PORT || process.env.PORT || '3100';
    console.log(chalk.green.bold('\n Team Deployment Successful!\n'));
    console.log(chalk.white(`Workspace:  ${WORKSPACE}`));
    console.log(chalk.white(`Agents:     ${config.agents.length} active`));
    console.log(chalk.white(`Dashboard:  http://127.0.0.1:${paperclipPort} (Paperclip)`));

    // 4. Final Actions
    await offerSecurityScan();
    await offerOpenDashboard();

    console.log(chalk.cyan.bold('\nHappy building! /agi-farm status to check on your team.\n'));

  } catch (err) {
    console.error(chalk.red('\n❌ Setup failed:'), err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
