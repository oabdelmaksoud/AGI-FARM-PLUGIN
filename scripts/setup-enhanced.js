#!/usr/bin/env node
/**
 * AGI Farm Enhanced Setup Wizard (v1.7.0)
 *
 * Interactive wizard with workflow templates and agent browsing
 * - 4 workflow templates (Startup MVP, Marketing Campaign, Enterprise Feature, Quality-First)
 * - Agent browser for custom teams (91 agents)
 * - Auto-copy SOUL.md templates
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import open from 'open';
import { runCommand } from './lib/run-command.js';
import {
  loadAgentRegistry,
  getCategoryEmoji,
  formatCategoryName,
  countAgentsInCategory,
  getCategories
} from './lib/agent-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

// ── Workflow Templates (v1.7.0) ───────────────────────────────────────────────
const WORKFLOW_TEMPLATES = {
  'startup-mvp': {
    name: 'Startup MVP',
    emoji: '🚀',
    description: 'Rapid prototype development, proof-of-concept, MVP launches',
    timeline: '1-2 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
      { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Backend Developer', workspace: 'forge' },
      { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Frontend Developer', workspace: 'pixel' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Specialist', workspace: 'vigil' },
      { id: 'growth-hacker', template: 'agency-agents/marketing/growth-hacker.md', name: 'Growth Hacker', emoji: '📈', role: 'Growth & Experiments', workspace: 'growth-hacker' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#template-1-startup-mvp-team-5-agents',
    patterns: [
      'templates/ORCHESTRATION_PATTERNS.md',
      'templates/QUALITY_GATE_PATTERNS.md'
    ],
    quickStart: [
      'Cooper coordinates the pipeline (PM → Architect → Dev-QA Loop → Integration)',
      'Forge builds backend, Pixel builds frontend',
      'Vigil validates each task with Evidence Collector pattern',
      'Growth Hacker sets up analytics and growth experiments'
    ]
  },
  'marketing-campaign': {
    name: 'Marketing Campaign',
    emoji: '📈',
    description: 'Product launches, campaigns, content marketing, community growth',
    timeline: '2-4 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
      { id: 'content-creator', template: 'agency-agents/marketing/content-creator.md', name: 'Content Creator', emoji: '✍️', role: 'Content Specialist', workspace: 'content-creator' },
      { id: 'twitter-engager', template: 'agency-agents/marketing/twitter-engager.md', name: 'Twitter Engager', emoji: '🐦', role: 'Twitter Community', workspace: 'twitter-engager' },
      { id: 'reddit-builder', template: 'agency-agents/marketing/reddit-community-builder.md', name: 'Reddit Builder', emoji: '👥', role: 'Reddit Community', workspace: 'reddit-builder' },
      { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Analytics Reporter', emoji: '📊', role: 'Performance Tracking', workspace: 'analytics' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#template-2-marketing-campaign-team-5-agents',
    patterns: ['templates/ORCHESTRATION_PATTERNS.md'],
    quickStart: [
      'Cooper coordinates multi-channel campaign launch',
      'Content Creator produces blog posts, landing pages, email sequences',
      'Twitter Engager builds thought leadership presence',
      'Reddit Builder establishes authentic community engagement',
      'Analytics Reporter tracks campaign performance and ROI'
    ]
  },
  'enterprise-feature': {
    name: 'Enterprise Feature',
    emoji: '🏢',
    description: 'Complex feature development, enterprise software, high-stakes projects',
    timeline: '4-8 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
      { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Product Manager', workspace: 'vista' },
      { id: 'sage', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Senior Developer', workspace: 'sage' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Specialist', workspace: 'vigil' },
      { id: 'experiment-tracker', template: 'agency-agents/project-management/experiment-tracker.md', name: 'Experiment Tracker', emoji: '🧪', role: 'A/B Testing', workspace: 'experiment-tracker' },
      { id: 'reality-checker', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Checker', emoji: '🛡️', role: 'Production Certification', workspace: 'reality-checker' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#template-3-enterprise-feature-team-6-agents',
    patterns: [
      'templates/ORCHESTRATION_PATTERNS.md',
      'templates/QUALITY_GATE_PATTERNS.md'
    ],
    quickStart: [
      'Vista analyzes requirements and creates comprehensive task breakdown',
      'Sage designs enterprise-grade architecture',
      'Cooper coordinates phased implementation with quality gates',
      'Vigil validates each sprint with comprehensive testing',
      'Reality Checker certifies production readiness (defaults to "NEEDS WORK")',
      'Experiment Tracker manages feature flags and gradual rollout'
    ]
  },
  'quality-first': {
    name: 'Quality-First',
    emoji: '🔬',
    description: 'Security-critical systems, regulated industries, zero-defect requirements',
    timeline: 'Quality-driven',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA (Evidence Collector)', workspace: 'vigil' },
      { id: 'reality-checker', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Checker', emoji: '🛡️', role: 'Production Certification', workspace: 'reality-checker' },
      { id: 'performance-benchmarker', template: 'agency-agents/testing/performance-benchmarker.md', name: 'Performance Benchmarker', emoji: '⚡', role: 'Performance QA', workspace: 'performance-benchmarker' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#template-4-quality-first-team-4-agents',
    patterns: ['templates/QUALITY_GATE_PATTERNS.md'],
    quickStart: [
      'Cooper enforces rigorous quality gates (95% coverage, Grade A security)',
      'Vigil validates every task with Evidence Collector pattern (3-5 issues minimum)',
      'Reality Checker certifies production readiness (overwhelming evidence required)',
      'Performance Benchmarker ensures all performance targets met',
      'Maximum 5 retry attempts per task (vs. 3 in standard pipeline)'
    ]
  }
};

// ── Legacy Agent Rosters (Backward Compatibility) ─────────────────────────────
const AGENT_ROSTERS = {
  3: [
    { id: 'main', template: 'SOUL.md.main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate the team, delegate tasks, synthesize results', workspace: '.' },
    { id: 'researcher', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Researcher', goal: 'Research deeply and surface the insights that matter most', workspace: 'researcher' },
    { id: 'builder', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Builder', goal: 'Implement solutions cleanly and efficiently', workspace: 'builder' },
  ],
  5: [
    { id: 'main', template: 'SOUL.md.main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate the team, delegate tasks, synthesize results', workspace: '.' },
    { id: 'researcher', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Researcher', goal: 'Research deeply and surface the insights that matter most', workspace: 'researcher' },
    { id: 'builder', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Builder', goal: 'Implement solutions cleanly and efficiently', workspace: 'builder' },
    { id: 'qa', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Engineer', goal: 'Ensure every output meets quality standards', workspace: 'qa' },
    { id: 'content', template: 'SOUL.md.anchor', name: 'Anchor', emoji: '⚓', role: 'Content Specialist', goal: 'Craft clear content that communicates complex ideas simply', workspace: 'content' },
  ],
  11: [
    { id: 'main', template: 'SOUL.md.main', name: 'Orchestrator', emoji: '🦅', role: 'Orchestrator', goal: 'Orchestrate specialists, delegate tasks, synthesize results', workspace: '.' },
    { id: 'sage', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Solution Architect', goal: 'Design robust, scalable architectures', workspace: 'solution-architect' },
    { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Implementation Engineer', goal: 'Implement clean, well-tested code efficiently', workspace: 'implementation-engineer' },
    { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Debugger', goal: 'Find the true root cause of any bug or failure', workspace: 'debugger' },
    { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Business Analyst', goal: 'Research deeply and surface the insights that matter most', workspace: 'business-analyst' },
    { id: 'cipher', template: 'SOUL.md.cipher', name: 'Cipher', emoji: '🔊', role: 'Knowledge Curator', goal: 'Curate and surface knowledge so the team never forgets', workspace: 'knowledge-curator' },
    { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Engineer', goal: 'Ensure every output meets quality standards', workspace: 'quality-assurance' },
    { id: 'anchor', template: 'SOUL.md.anchor', name: 'Anchor', emoji: '⚓', role: 'Content Specialist', goal: 'Craft clear content that communicates complex ideas simply', workspace: 'content-specialist' },
    { id: 'lens', template: 'SOUL.md.lens', name: 'Lens', emoji: '📡', role: 'Multimodal Specialist', goal: 'Extract meaning from images, documents, and multimodal inputs', workspace: 'multimodal-specialist' },
    { id: 'evolve', template: 'SOUL.md.evolve', name: 'Evolve', emoji: '🔄', role: 'Process Improvement Lead', goal: 'Make the team better systematically through continuous improvement', workspace: 'process-improvement' },
    { id: 'nova', template: 'SOUL.md.nova', name: 'Nova', emoji: '🧪', role: 'R&D Lead', goal: 'Turn hypotheses into proven capabilities through structured experimentation', workspace: 'r-and-d' },
  ],
};

// ── Wizard Steps ───────────────────────────────────────────────────────────────
async function runWizard() {
  console.log(chalk.cyan.bold('\n🚜 AGI Farm — Multi-Agent Team Builder (Enhanced v1.7.0)\n'));
  console.log(chalk.dim('Powered by Everything Claude Code (ECC) + Agency-Agents Integration\n'));
  console.log(chalk.white('✨ Now includes:'));
  console.log(chalk.dim('   • 91 agent templates (16 AGI Farm + 16 ECC + 59 Agency-Agents)'));
  console.log(chalk.dim('   • 4 workflow templates (Startup MVP, Marketing, Enterprise, Quality-First)'));
  console.log(chalk.dim('   • 69 specialized coding skills (TDD, security, API design)'));
  console.log(chalk.dim('   • Orchestration & quality gate patterns\n'));

  // Pre-flight check: Verify openclaw is available
  const versionResult = spawnSync('openclaw', ['--version'], { encoding: 'utf-8', timeout: 8000 });
  if (versionResult.status !== 0 || versionResult.error) {
    console.error(chalk.red('❌ OpenClaw not found. Please install OpenClaw before using AGI Farm.'));
    console.log(chalk.dim('   https://openclaw.ai/install'));
    process.exit(1);
  }
  const versionLine = (versionResult.stdout || '').split('\n')[0].trim();
  console.log(chalk.dim(`OpenClaw: ${versionLine}\n`));

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

  // Step 3: Use-case selection (NEW in v1.7.0)
  const { useCase } = await inquirer.prompt([
    {
      type: 'list',
      name: 'useCase',
      message: "What's your primary use case?",
      choices: [
        { name: '🚀 Startup MVP (5 agents, 1-2 weeks) — Rapid prototyping', value: 'startup-mvp' },
        { name: '📈 Marketing Campaign (5 agents, 2-4 weeks) — Multi-channel campaigns', value: 'marketing-campaign' },
        { name: '🏢 Enterprise Feature (6 agents, 4-8 weeks) — Complex development', value: 'enterprise-feature' },
        { name: '🔬 Quality-First (4 agents, quality-driven) — Zero-defect systems', value: 'quality-first' },
        new inquirer.Separator(),
        { name: '⚙️  Legacy: 3 agents (minimal)', value: 'legacy-3' },
        { name: '⚙️  Legacy: 5 agents (standard)', value: 'legacy-5' },
        { name: '⚙️  Legacy: 11 agents (full stack)', value: 'legacy-11' },
        new inquirer.Separator(),
        { name: '🎨 Custom (browse 91 agents and select)', value: 'custom' },
      ],
      default: 'startup-mvp',
    },
  ]);

  let selectedAgents = [];
  let workflowTemplate = null;

  // Show template details if workflow template selected
  if (WORKFLOW_TEMPLATES[useCase]) {
    workflowTemplate = WORKFLOW_TEMPLATES[useCase];
    console.log(chalk.cyan(`\n✨ ${workflowTemplate.name} Team`));
    console.log(chalk.dim('─'.repeat(70)));

    for (const agent of workflowTemplate.agents) {
      console.log(chalk.white(`${agent.emoji}  ${agent.name.padEnd(25)} — ${agent.role}`));
    }

    console.log(chalk.dim(`\nTimeline:    ${workflowTemplate.timeline}`));
    console.log(chalk.dim(`Perfect for: ${workflowTemplate.description}`));
    console.log(chalk.dim(`\nQuick Start:`));
    workflowTemplate.quickStart.forEach((step, i) => {
      console.log(chalk.dim(`   ${i + 1}. ${step}`));
    });

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Use this team as-is?',
        default: true,
      },
    ]);

    if (!proceed) {
      console.log(chalk.yellow('\nReturning to use-case selection...'));
      return runWizard(); // Recursively restart
    }

    selectedAgents = workflowTemplate.agents;
  } else if (useCase === 'custom') {
    // Custom team: Browse agents (NEW in v1.7.0)
    selectedAgents = await browseAndSelectAgents(orchestratorName);
  } else {
    // Legacy rosters
    const size = parseInt(useCase.split('-')[1]);
    selectedAgents = AGENT_ROSTERS[size];
  }

  // Step 4: Domain
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

  // Step 5: Frameworks
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

  // Step 6: ECC Resources (informational)
  console.log(chalk.dim('\n💡 ECC resources are automatically included:'));
  console.log(chalk.dim('   • @tdd-workflow, @security-scan, @api-design'));
  console.log(chalk.dim('   • See: ECC_OPENCLAW_QUICKREF.md for shortcuts\n'));

  // Step 7: Project defaults
  const { autoProjectChannel } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'autoProjectChannel',
      message: 'Auto-create a dedicated project channel for each new project?',
      default: true,
    },
  ]);

  const { defaultExecutionPath } = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultExecutionPath',
      message: 'Default execution path for new projects?',
      choices: [
        { name: 'AGI-Farm first (recommended)', value: 'agi-farm-first' },
        { name: 'Direct execution first', value: 'direct-first' },
      ],
      default: 'agi-farm-first',
    },
  ]);

  // Step 8: Confirm
  const finalDomain = domain === 'custom' ? customDomain : domain;
  console.log(chalk.dim('\n── Summary ──'));
  console.log(chalk.white(`Team:         ${teamName}`));
  console.log(chalk.white(`Orchestrator: ${orchestratorName}`));
  console.log(chalk.white(`Use Case:     ${workflowTemplate ? workflowTemplate.name : useCase}`));
  console.log(chalk.white(`Agents:       ${selectedAgents.length}`));
  console.log(chalk.white(`Domain:       ${finalDomain}`));
  console.log(chalk.white(`Frameworks:   ${frameworks.length > 0 ? frameworks.join(', ') : 'none'}`));
  console.log(chalk.white(`ECC:          enabled (69 skills, 7 hooks, 33 commands)`));
  if (workflowTemplate) {
    console.log(chalk.white(`Workflow:     ${workflowTemplate.workflowRef}`));
  }

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Shall I proceed with setup?',
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
    useCase,
    selectedAgents,
    workflowTemplate,
    domain: finalDomain,
    frameworks,
    autoProjectChannel,
    defaultExecutionPath,
  };
}

// ── Agent Browser (NEW in v1.7.0) ─────────────────────────────────────────────
async function browseAndSelectAgents(orchestratorName) {
  console.log(chalk.cyan('\n🎨 Custom Team Builder'));
  console.log(chalk.dim('Browse and select from 91 available agents\n'));

  const registry = loadAgentRegistry();
  const allAgents = Object.values(registry).flat();
  const categories = getCategories(registry);

  const selectedAgents = [
    // Always include orchestrator
    { id: 'main', template: 'SOUL.md.main', name: orchestratorName, emoji: '🦅', role: 'Orchestrator', workspace: '.' }
  ];

  let continueSelecting = true;

  while (continueSelecting) {
    // Show current selection
    if (selectedAgents.length > 1) {
      console.log(chalk.dim(`\n✓ Selected (${selectedAgents.length} agents):`));
      selectedAgents.slice(1).forEach(agent => {
        console.log(chalk.dim(`  ${agent.emoji} ${agent.name} (${agent.role})`));
      });
    }

    // Select category
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Browse agents by category:',
        choices: [
          ...categories.map(cat => ({
            name: `${getCategoryEmoji(cat)} ${formatCategoryName(cat)} (${countAgentsInCategory(registry, cat)} agents)`,
            value: cat,
          })),
          new inquirer.Separator(),
          { name: '✅ Done selecting agents', value: 'done' },
        ],
      },
    ]);

    if (category === 'done') {
      if (selectedAgents.length < 2) {
        console.log(chalk.yellow('\n⚠ You need at least 1 agent besides the orchestrator.'));
        continue;
      }
      continueSelecting = false;
      break;
    }

    // Show agents in category
    const agentsInCategory = allAgents.filter(a => a.category === category);

    const { agentsToAdd } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'agentsToAdd',
        message: `Select agents from ${formatCategoryName(category)}:`,
        choices: agentsInCategory.map(agent => {
          const alreadySelected = selectedAgents.some(a => a.id === agent.agentId);
          return {
            name: `${agent.emoji} ${agent.name} — ${agent.description}`,
            value: agent,
            checked: alreadySelected,
            disabled: alreadySelected ? 'Already selected' : false,
          };
        }),
      },
    ]);

    // Add selected agents
    for (const agent of agentsToAdd) {
      if (!selectedAgents.some(a => a.id === agent.agentId)) {
        selectedAgents.push({
          id: agent.agentId,
          template: agent.template,
          name: agent.name,
          emoji: agent.emoji,
          role: agent.role,
          workspace: agent.agentId,
        });
      }
    }
  }

  console.log(chalk.green(`\n✅ Custom team configured with ${selectedAgents.length} agents\n`));
  return selectedAgents;
}

// ── Generate team.json ────────────────────────────────────────────────────────
function generateTeamJson(config) {
  const agents = config.selectedAgents.map(agent => ({
    ...agent,
    name: agent.id === 'main' ? config.orchestratorName : agent.name,
  }));

  return {
    team_name: config.teamName,
    orchestrator_name: config.orchestratorName,
    use_case: config.useCase,
    workflow_template: config.workflowTemplate?.workflowRef || null,
    pattern_references: config.workflowTemplate?.patterns || [],
    domain: config.domain,
    frameworks: config.frameworks,
    project_defaults: {
      auto_project_channel: config.autoProjectChannel ?? true,
      execution_path: config.defaultExecutionPath || 'agi-farm-first',
    },
    created_at: new Date().toISOString(),
    agents,
  };
}

// ── Create OpenClaw Agents (Enhanced with template copying) ──────────────────
function createAgents(team) {
  const spinner = ora('Creating OpenClaw agents with templates...').start();

  for (const agent of team.agents) {
    if (agent.id === 'main') continue; // Skip main orchestrator

    try {
      const wsPath = path.join(WORKSPACE, 'agents-workspaces', agent.workspace);
      fs.mkdirSync(wsPath, { recursive: true });

      // NEW in v1.7.0: Copy SOUL.md template to workspace
      if (agent.template) {
        const templatePath = path.join(TEMPLATES_DIR, agent.template);
        const soulPath = path.join(wsPath, 'SOUL.md');

        if (fs.existsSync(templatePath)) {
          try {
            fs.copyFileSync(templatePath, soulPath);
            spinner.text = `Copied template: ${agent.name} (${agent.template})`;
          } catch (copyErr) {
            spinner.text = chalk.yellow(`⚠ Warning: Could not copy template for ${agent.name}`);
          }
        } else {
          spinner.text = chalk.yellow(`⚠ Warning: Template not found: ${agent.template}`);
        }
      }

      // Register agent with OpenClaw
      spinner.text = `Registering agent: ${agent.name}...`;

      const result = runCommand('openclaw', [
        'agents', 'add',
        '--workspace', wsPath,
        agent.name,
        '--non-interactive'
      ]);

      if (result.status === 0) {
        spinner.text = `Created agent: ${agent.name} ${agent.emoji}`;
      } else {
        spinner.text = chalk.dim(`Note: ${agent.name} setup skipped (likely already exists)`);
      }
    } catch (err) {
      spinner.text = chalk.yellow(`⚠ Warning: ${agent.name} failed to initialize.`);
    }
  }

  spinner.succeed(`Agents initialized with templates in ${WORKSPACE}`);
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

  // PROJECTS.json
  fs.writeFileSync(path.join(WORKSPACE, 'PROJECTS.json'), JSON.stringify({
    defaults: {
      auto_project_channel: team.project_defaults?.auto_project_channel ?? true,
      execution_path: team.project_defaults?.execution_path || 'agi-farm-first',
    },
    items: [],
  }, null, 2));

  // AGENT_STATUS.json
  const status = {};
  for (const a of team.agents) {
    status[a.id] = { status: 'available', name: a.name };
  }
  fs.writeFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), JSON.stringify(status, null, 2));

  // AGENT_PERFORMANCE.json
  const perf = {};
  for (const a of team.agents) {
    perf[a.id] = {
      tasks_completed: 0,
      tasks_failed: 0,
      quality_score: 0,
      credibility: 1.0,
    };
  }
  fs.writeFileSync(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), JSON.stringify(perf, null, 2));

  // BUDGET.json
  fs.writeFileSync(path.join(WORKSPACE, 'BUDGET.json'), JSON.stringify({
    period: 'monthly',
    currency: 'USD',
    limit: 0,
    spent: 0,
    threshold_warn: 0.8,
  }, null, 2));

  // VELOCITY.json
  fs.writeFileSync(path.join(WORKSPACE, 'VELOCITY.json'), JSON.stringify({
    daily: [],
    weekly: [],
    by_agent: {},
    by_type: {},
  }, null, 2));

  // OKRs.json
  fs.writeFileSync(path.join(WORKSPACE, 'OKRs.json'), JSON.stringify({ objectives: [] }, null, 2));

  // EXPERIMENTS.json
  fs.writeFileSync(path.join(WORKSPACE, 'EXPERIMENTS.json'), JSON.stringify({ experiments: [] }, null, 2));

  // IMPROVEMENT_BACKLOG.json
  fs.writeFileSync(path.join(WORKSPACE, 'IMPROVEMENT_BACKLOG.json'), JSON.stringify({ items: [] }, null, 2));

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

  // Check PROJECTS.json
  if (fs.existsSync(path.join(WORKSPACE, 'PROJECTS.json'))) {
    console.log(chalk.green('✅ PROJECTS.json OK'));
  } else {
    console.log(chalk.red('❌ PROJECTS.json missing'));
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

// ── Post-Setup UX (Enhanced with workflow guidance) ───────────────────────────
async function offerOpenDashboard() {
  const host = process.env.AGI_FARM_DASHBOARD_HOST || '127.0.0.1';
  const port = process.env.AGI_FARM_DASHBOARD_PORT || '8080';
  const url = `http://${host}:${port}`;

  const { openDashboard } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'openDashboard',
      message: `Open dashboard in browser now? (${url})`,
      default: true,
    },
  ]);

  if (!openDashboard) return;

  try {
    await open(url);
    console.log(chalk.green(`✅ Opened dashboard: ${url}`));
  } catch {
    console.log(chalk.yellow(`⚠ Could not open browser automatically. Open manually: ${url}`));
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

    // Create agents with templates
    createAgents(team);

    // Initialize comms
    initializeComms(team);

    // Initialize registries
    initializeRegistries(team);

    // Health check
    healthCheck(team);

    // Enhanced post-setup output
    console.log(chalk.cyan.bold(`\n🎉 ${config.teamName} AGI team is live!\n`));
    console.log(chalk.white(`Use Case:  ${config.workflowTemplate ? config.workflowTemplate.name : config.useCase}`));
    console.log(chalk.white(`Agents:    ${team.agents.length}`));
    console.log(chalk.white(`Workspace: ${WORKSPACE}`));
    console.log(chalk.white(`Bundle:    ${BUNDLE_DIR}`));

    if (config.workflowTemplate) {
      const template = config.workflowTemplate;
      console.log(chalk.dim(`\n📚 Workflow Guide: ${template.workflowRef}`));
      console.log(chalk.dim(`\n✨ Quick Start:`));
      template.quickStart.forEach((step, i) => {
        console.log(chalk.dim(`   ${i + 1}. ${step}`));
      });

      if (template.patterns.length > 0) {
        console.log(chalk.dim(`\n📖 Pattern References:`));
        template.patterns.forEach(pattern => {
          console.log(chalk.dim(`   • ${pattern}`));
        });
      }
    }

    console.log(chalk.dim(`\n✨ ECC Features Active:`));
    console.log(chalk.dim(`   • Production skills: @tdd-workflow, @security-scan, @api-design`));
    console.log(chalk.dim(`   • Quality hooks: typecheck, security-review, auto-format`));
    console.log(chalk.dim(`   • Quick ref: ECC_OPENCLAW_QUICKREF.md`));
    console.log(chalk.dim(`\nNext: talk to ${config.orchestratorName} · /agi-farm status · /agi-farm dashboard\n`));

    await offerOpenDashboard();

  } catch (err) {
    console.error(chalk.red('Error:'), err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
