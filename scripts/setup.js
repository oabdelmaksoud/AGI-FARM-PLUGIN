#!/usr/bin/env node
/**
 * AGI Farm Setup Wizard
 *
 * Interactive wizard that creates a fully working multi-agent AI team on OpenClaw.
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { runCommand } from './lib/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

// ── Agent Templates ───────────────────────────────────────────────────────────
const AGENT_ROSTERS = {
  3: [
    { id: 'main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate the team, delegate tasks, synthesize results', workspace: '.' },
    { id: 'researcher', name: 'Sage', emoji: '🔮', role: 'Researcher', goal: 'Research deeply and surface the insights that matter most', workspace: 'researcher' },
    { id: 'builder', name: 'Forge', emoji: '⚒️', role: 'Builder', goal: 'Implement solutions cleanly and efficiently', workspace: 'builder' },
  ],
  5: [
    { id: 'main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate the team, delegate tasks, synthesize results', workspace: '.' },
    { id: 'researcher', name: 'Sage', emoji: '🔮', role: 'Researcher', goal: 'Research deeply and surface the insights that matter most', workspace: 'researcher' },
    { id: 'builder', name: 'Forge', emoji: '⚒️', role: 'Builder', goal: 'Implement solutions cleanly and efficiently', workspace: 'builder' },
    { id: 'qa', name: 'Vigil', emoji: '🛡️', role: 'QA Engineer', goal: 'Ensure every output meets quality standards', workspace: 'qa' },
    { id: 'content', name: 'Anchor', emoji: '⚓', role: 'Content Specialist', goal: 'Craft clear content that communicates complex ideas simply', workspace: 'content' },
  ],
  11: [
    { id: 'main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate specialists, delegate tasks, synthesize results', workspace: '.' },
    { id: 'sage', name: 'Sage', emoji: '🔮', role: 'Solution Architect', goal: 'Design robust, scalable architectures', workspace: 'solution-architect' },
    { id: 'forge', name: 'Forge', emoji: '⚒️', role: 'Implementation Engineer', goal: 'Implement clean, well-tested code efficiently', workspace: 'implementation-engineer' },
    { id: 'pixel', name: 'Pixel', emoji: '🐛', role: 'Debugger', goal: 'Find the true root cause of any bug or failure', workspace: 'debugger' },
    { id: 'vista', name: 'Vista', emoji: '🔭', role: 'Business Analyst', goal: 'Research deeply and surface the insights that matter most', workspace: 'business-analyst' },
    { id: 'cipher', name: 'Cipher', emoji: '🔊', role: 'Knowledge Curator', goal: 'Curate and surface knowledge so the team never forgets', workspace: 'knowledge-curator' },
    { id: 'vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Engineer', goal: 'Ensure every output meets quality standards', workspace: 'quality-assurance' },
    { id: 'anchor', name: 'Anchor', emoji: '⚓', role: 'Content Specialist', goal: 'Craft clear content that communicates complex ideas simply', workspace: 'content-specialist' },
    { id: 'lens', name: 'Lens', emoji: '📡', role: 'Multimodal Specialist', goal: 'Extract meaning from images, documents, and multimodal inputs', workspace: 'multimodal-specialist' },
    { id: 'evolve', name: 'Evolve', emoji: '🔄', role: 'Process Improvement Lead', goal: 'Make the team better systematically through continuous improvement', workspace: 'process-improvement' },
    { id: 'nova', name: 'Nova', emoji: '🧪', role: 'R&D Lead', goal: 'Turn hypotheses into proven capabilities through structured experimentation', workspace: 'r-and-d' },
  ],
};

// ── Wizard Steps ───────────────────────────────────────────────────────────────
async function runWizard() {
  console.log(chalk.cyan.bold('\n🚜 AGI Farm — Multi-Agent Team Builder\n'));

  // Pre-flight check: Does a team already exist?
  const teamJsonPath = path.join(BUNDLE_DIR, 'team.json');
  if (fs.existsSync(teamJsonPath)) {
    let existingTeam;
    try {
      existingTeam = JSON.parse(fs.readFileSync(teamJsonPath, 'utf8'));
    } catch (e) {
      existingTeam = { team_name: 'Unknown' };
    }

    console.log(chalk.yellow(`⚠ An active AGI Farm team ("${existingTeam.team_name}") already exists.`));
    console.log(chalk.dim('You must teardown the existing team before creating a new one.\n'));

    const { teardown } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'teardown',
        message: 'Would you like to completely uninstall the existing team now?',
        default: false,
      },
    ]);

    if (!teardown) {
      console.log(chalk.dim('Setup cancelled. Existing team preserved.'));
      process.exit(0);
    }

    // Run teardown script
    console.log(chalk.dim('\nRunning teardown...'));
    const teardownScript = path.join(__dirname, 'teardown.js');
    const result = spawnSync(process.execPath, [teardownScript], { stdio: 'inherit' });

    if (result.status !== 0) {
      console.error(chalk.red('\nTeardown failed. Please fix the errors before continuing.'));
      process.exit(1);
    }
    console.log(chalk.green('✅ Previous team cleared. Ready for new setup.\n'));
  }

  // Step 1: Team name
  const { teamName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'teamName',
      message: 'What should we call your team?',
      default: 'MyTeam',
      validate: (input) => input.length > 0 ? true : 'Team name is required',
    },
  ]);

  // Step 2: Orchestrator name
  const { orchestratorName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'orchestratorName',
      message: "What's your orchestrator's name?",
      default: 'Cooper',
    },
  ]);

  // Step 3: Team size
  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'How many agents?',
      choices: [
        { name: '3 — Minimal: Orchestrator + Researcher + Builder', value: 3 },
        { name: '5 — Standard: adds QA + Content', value: 5 },
        { name: '11 — Full stack: complete AGI system (recommended)', value: 11 },
      ],
      default: 11,
    },
  ]);

  // Step 3.5: Domain
  const { domain } = await inquirer.prompt([
    {
      type: 'list',
      name: 'domain',
      message: 'What domain?',
      choices: ['software', 'trading', 'research', 'general', 'custom'],
      default: 'general',
    },
  ]);

  let customDomain = '';
  if (domain === 'custom') {
    const { custom } = await inquirer.prompt([
      {
        type: 'input',
        name: 'custom',
        message: 'Describe your domain in one phrase:',
        validate: (input) => input.length > 0 ? true : 'Domain description is required',
      },
    ]);
    customDomain = custom;
  }

  // Step 4: Frameworks
  const { frameworks } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'frameworks',
      message: 'Collaboration frameworks?',
      choices: [
        { name: 'AutoGen', value: 'autogen', checked: false },
        { name: 'CrewAI', value: 'crewai', checked: false },
        { name: 'LangGraph', value: 'langgraph', checked: false },
      ],
    },
  ]);

  // Step 5: Confirm
  const finalDomain = domain === 'custom' ? customDomain : domain;
  console.log(chalk.dim('\n── Summary ──'));
  console.log(chalk.white(`Team:         ${teamName}`));
  console.log(chalk.white(`Orchestrator: ${orchestratorName}`));
  console.log(chalk.white(`Agents:       ${preset}`));
  console.log(chalk.white(`Domain:       ${finalDomain}`));
  console.log(chalk.white(`Frameworks:   ${frameworks.length > 0 ? frameworks.join(', ') : 'none'}`));

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Shall I proceed?',
      default: true,
    },
  ]);

  if (!proceed) {
    console.log(chalk.yellow('Setup cancelled.'));
    process.exit(0);
  }

  return {
    teamName,
    orchestratorName,
    preset,
    domain: finalDomain,
    frameworks,
  };
}

// ── Generate team.json ────────────────────────────────────────────────────────
function generateTeamJson(config) {
  const agents = AGENT_ROSTERS[config.preset].map(agent => ({
    ...agent,
    name: agent.id === 'main' ? config.orchestratorName : agent.name,
    // No model set — OpenClaw will use the user's configured default
  }));

  return {
    team_name: config.teamName,
    orchestrator_name: config.orchestratorName,
    preset: String(config.preset),
    domain: config.domain,
    frameworks: config.frameworks,
    created_at: new Date().toISOString(),
    agents,
  };
}

// ── Create OpenClaw Agents ────────────────────────────────────────────────────
function createAgents(team) {
  const spinner = ora('Creating OpenClaw agents...').start();

  for (const agent of team.agents) {
    if (agent.id === 'main') continue; // Skip main orchestrator

    try {
      const wsPath = path.join(WORKSPACE, 'agents-workspaces', agent.workspace);
      fs.mkdirSync(wsPath, { recursive: true });

      // OpenClaw normalizes the name into an ID. 
      // We pass the name and let OpenClaw handle the registration.
      spinner.text = `Registering agent: ${agent.name}...`;

      const result = runCommand('openclaw', [
        'agents', 'add',
        '--workspace', wsPath,
        agent.name,
        '--non-interactive'
      ]);

      if (result.status === 0) {
        // Extract the actual ID from stdout if needed, but for now we trust the normalization.
        spinner.text = `Created agent: ${agent.name} ${agent.emoji}`;
      } else {
        // If it fails, it might be a conflict.
        spinner.text = chalk.dim(`Note: ${agent.name} setup skipped (likely already exists)`);
      }
    } catch (err) {
      spinner.text = chalk.yellow(`⚠ Warning: ${agent.name} failed to initialize.`);
    }
  }

  spinner.succeed(`Agents initialized in ${WORKSPACE}`);
}

// ── Initialize Comms ────────────────────────────────────────────────────────
function initializeComms(team) {
  const spinner = ora('Initializing comms infrastructure...').start();

  const commsDir = path.join(WORKSPACE, 'comms');
  const inboxesDir = path.join(commsDir, 'inboxes');
  const outboxesDir = path.join(commsDir, 'outboxes');

  fs.mkdirSync(inboxesDir, { recursive: true });
  fs.mkdirSync(outboxesDir, { recursive: true });

  // Create broadcast.md
  fs.writeFileSync(path.join(commsDir, 'broadcast.md'), `# Team Broadcast\n\nWelcome to ${team.team_name}!\n`);

  // Create inboxes and outboxes for each agent
  for (const agent of team.agents) {
    fs.writeFileSync(path.join(inboxesDir, `${agent.id}.md`), `# ${agent.name}'s Inbox\n\nNo messages yet.\n`);
    fs.writeFileSync(path.join(outboxesDir, `${agent.id}.md`), `# ${agent.name}'s Outbox\n\nNo messages yet.\n`);
  }

  spinner.succeed('Comms infrastructure initialized');
}

// ── Initialize Registries ─────────────────────────────────────────────────────
function initializeRegistries(team) {
  const spinner = ora('Initializing registries...').start();

  // TASKS.json
  fs.writeFileSync(path.join(WORKSPACE, 'TASKS.json'), '[]');

  // AGENT_STATUS.json
  const status = {};
  for (const a of team.agents) {
    status[a.id] = { status: 'available', name: a.name };
  }
  fs.writeFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), JSON.stringify(status, null, 2));

  spinner.succeed('Registries initialized');
}

// ── Health Check ──────────────────────────────────────────────────────────────
function healthCheck(team) {
  console.log(chalk.dim('\n── Health Check ──'));

  // Check comms
  const commsDir = path.join(WORKSPACE, 'comms', 'inboxes');
  if (fs.existsSync(commsDir)) {
    console.log(chalk.green('✅ comms OK'));
  } else {
    console.log(chalk.red('❌ comms missing'));
  }

  // Check TASKS.json
  if (fs.existsSync(path.join(WORKSPACE, 'TASKS.json'))) {
    console.log(chalk.green('✅ TASKS.json OK'));
  } else {
    console.log(chalk.red('❌ TASKS.json missing'));
  }

  // Count agents
  try {
    const result = runCommand('openclaw', ['agents', 'list', '--json']);
    if (result.status === 0) {
      const agents = JSON.parse(result.stdout);
      console.log(chalk.green(`✅ Agents: ${agents.length}`));
    }
  } catch {
    console.log(chalk.yellow('⚠ Could not count agents'));
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const config = await runWizard();
    const team = generateTeamJson(config);

    // Create bundle directory
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });
    fs.writeFileSync(path.join(BUNDLE_DIR, 'team.json'), JSON.stringify(team, null, 2));

    console.log(chalk.green('\n✅ team.json written to'), BUNDLE_DIR);

    // Create agents
    createAgents(team);

    // Initialize comms
    initializeComms(team);

    // Initialize registries
    initializeRegistries(team);

    // Health check
    healthCheck(team);

    console.log(chalk.cyan.bold(`\n🎉 ${config.teamName} AGI team is live!\n`));
    console.log(chalk.white(`Agents:    ${config.preset}`));
    console.log(chalk.white(`Workspace: ${WORKSPACE}`));
    console.log(chalk.white(`Bundle:    ${BUNDLE_DIR}`));
    console.log(chalk.dim(`\nNext: talk to ${config.orchestratorName} · /agi-farm status · /agi-farm dashboard\n`));

  } catch (err) {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}

main();
