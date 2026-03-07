# Wizard Enhancement Plan

**Version**: 1.0 (v1.7.0 - Planned)
**Purpose**: Enhance the AGI Farm setup wizard to leverage 91 agents and workflow templates
**Current State**: Wizard offers 3 fixed rosters (3, 5, 11 agents from AGI Farm core)
**Target State**: Wizard offers workflow templates + custom agent selection from all 91 agents

---

## 🎯 Current Wizard Flow (v1.6.0)

```
1. Team name → "MyTeam"
2. Orchestrator name → "Cooper"
3. Team size → [3 | 5 | 11] (fixed rosters)
4. Domain → [software | trading | research | general | custom]
5. Frameworks → [AutoGen | CrewAI | LangGraph]
6. Project defaults → [auto channel, execution path]
7. Confirm → Create team
```

### Current Limitations

| Limitation | Impact |
|------------|--------|
| **Fixed rosters only** | Users can't leverage 59 Agency-Agents templates |
| **No workflow templates** | Users don't know which combinations work well |
| **No agent browsing** | Users can't discover specialized agents |
| **No use-case selection** | Wizard doesn't guide users based on their goals |
| **Manual agent addition** | Users must manually copy templates after setup |

---

## 🚀 Enhanced Wizard Flow (v1.7.0 - Proposed)

### New Flow Overview

```
1. Team name → "MyTeam"
2. Orchestrator name → "Cooper"
3. Use-case selection → NEW! [Startup MVP | Marketing Campaign | Enterprise Feature | Quality-First | Custom]
   ↓
   IF "Custom":
     3a. Team size → [3 | 5 | 11 | Custom]
     3b. IF "Custom size": Browse 91 agents and select
   ELSE:
     3a. Show recommended workflow template
     3b. Option to customize roster
4. Domain → [software | trading | research | general | custom]
5. Frameworks → [AutoGen | CrewAI | LangGraph]
6. Project defaults → [auto channel, execution path]
7. Summary with workflow pattern reference → NEW!
8. Confirm → Create team with workflow documentation
```

### New Features

#### Feature 1: Workflow Template Selection
**User Experience**:
```
? What's your primary use case?
  ❯ 🚀 Startup MVP (5 agents, 1-2 weeks)
    📈 Marketing Campaign (5 agents, 2-4 weeks)
    🏢 Enterprise Feature (6 agents, 4-8 weeks)
    🔬 Quality-First (4 agents, quality-driven)
    ⚙️  Custom (choose your own agents)

[User selects "Startup MVP"]

✨ Startup MVP Team
────────────────────────────────────────────
Cooper (Orchestrator) - Pipeline management
Forge (Builder) - Backend implementation
Pixel (Frontend) - UI implementation
Vigil (QA) - Evidence-based validation
marketing-growth-hacker - User acquisition & experiments

Timeline: 1-2 weeks for typical MVP
Perfect for: Rapid prototyping, proof-of-concept, MVP launches

? Would you like to:
  ❯ Use this team as-is (recommended)
    Customize the roster
    See other templates
```

#### Feature 2: Agent Browser (for Custom teams)
**User Experience**:
```
? How many agents? Custom

? Select agents for your team:

📂 Categories:
  ❯ 🧪 Testing (7 agents)
    💻 Engineering (7 agents)
    🎨 Design (7 agents)
    📈 Marketing (8 agents)
    📋 Product (3 agents)
    ... (11 total categories)

[User selects "Testing"]

🧪 Testing Agents:
  ◯ Evidence Collector - Screenshot-based QA validation
  ◯ Reality Checker - Production readiness certification
  ◯ Performance Benchmarker - Load testing & optimization
  ◯ API Tester - Endpoint validation
  ◯ Test Results Analyzer - Test output analysis
  ◯ Tool Evaluator - Testing tool assessment
  ◯ Vigil (AGI Farm) - General QA specialist

[User selects Evidence Collector + Reality Checker]

Selected (2/10):
  ✓ Evidence Collector (testing)
  ✓ Reality Checker (testing)

? Continue selecting agents?
  ❯ Yes, browse more categories
    No, proceed with 2 agents (need 1+ more recommended)
```

#### Feature 3: Workflow Documentation Integration
**Post-setup**:
```
🎉 MyTeam AGI team is live!

Agents:    5 (Startup MVP Team)
Workspace: /Users/you/.openclaw/workspace
Bundle:    /Users/you/.openclaw/workspace/agi-farm-bundle

📚 Workflow Guide: templates/WORKFLOW_TEMPLATES.md#startup-mvp-team

✨ Quick Start:
1. Cooper coordinates the pipeline (PM → Architect → Dev-QA Loop → Integration)
2. Forge builds backend, Pixel builds frontend
3. Vigil validates each task with Evidence Collector pattern
4. marketing-growth-hacker sets up analytics and experiments

📖 References:
• Orchestration: templates/ORCHESTRATION_PATTERNS.md
• Quality Gates: templates/QUALITY_GATE_PATTERNS.md
• Agency-Agents Guide: AGENCY_AGENTS_GUIDE.md

Next: talk to Cooper · /agi-farm status · /agi-farm dashboard
```

---

## 🏗️ Implementation Plan

### Phase 1: Add Workflow Templates to Wizard (v1.7.0 - Week 1)

#### Changes to `scripts/setup.js`

**1. Add Workflow Template Definitions**

```javascript
// After AGENT_ROSTERS definition
const WORKFLOW_TEMPLATES = {
  'startup-mvp': {
    name: 'Startup MVP',
    emoji: '🚀',
    description: 'Rapid prototype development, proof-of-concept, MVP launches',
    timeline: '1-2 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator' },
      { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Backend' },
      { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Frontend' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA' },
      { id: 'growth-hacker', template: 'agency-agents/marketing/growth-hacker.md', name: 'Growth Hacker', emoji: '📈', role: 'Growth' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#startup-mvp-team',
    patterns: [
      'templates/ORCHESTRATION_PATTERNS.md',
      'templates/QUALITY_GATE_PATTERNS.md'
    ]
  },
  'marketing-campaign': {
    name: 'Marketing Campaign',
    emoji: '📈',
    description: 'Product launches, campaigns, content marketing, community growth',
    timeline: '2-4 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator' },
      { id: 'content-creator', template: 'agency-agents/marketing/content-creator.md', name: 'Content Creator', emoji: '✍️', role: 'Content' },
      { id: 'twitter-engager', template: 'agency-agents/marketing/twitter-engager.md', name: 'Twitter Engager', emoji: '🐦', role: 'Twitter' },
      { id: 'reddit-builder', template: 'agency-agents/marketing/reddit-community-builder.md', name: 'Reddit Builder', emoji: '👥', role: 'Reddit' },
      { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Analytics Reporter', emoji: '📊', role: 'Analytics' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#marketing-campaign-team',
    patterns: ['templates/ORCHESTRATION_PATTERNS.md']
  },
  'enterprise-feature': {
    name: 'Enterprise Feature',
    emoji: '🏢',
    description: 'Complex feature development, enterprise software, high-stakes projects',
    timeline: '4-8 weeks',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator' },
      { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Product Manager' },
      { id: 'sage', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Senior Developer' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA' },
      { id: 'experiment-tracker', template: 'agency-agents/project-management/experiment-tracker.md', name: 'Experiment Tracker', emoji: '🧪', role: 'Experiments' },
      { id: 'reality-checker', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Checker', emoji: '🛡️', role: 'Certification' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#enterprise-feature-team',
    patterns: [
      'templates/ORCHESTRATION_PATTERNS.md',
      'templates/QUALITY_GATE_PATTERNS.md'
    ]
  },
  'quality-first': {
    name: 'Quality-First',
    emoji: '🔬',
    description: 'Security-critical systems, regulated industries, zero-defect requirements',
    timeline: 'Quality-driven',
    agents: [
      { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator' },
      { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA (Evidence Collector)' },
      { id: 'reality-checker', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Checker', emoji: '🛡️', role: 'Certification' },
      { id: 'performance-benchmarker', template: 'agency-agents/testing/performance-benchmarker.md', name: 'Performance Benchmarker', emoji: '⚡', role: 'Performance' }
    ],
    workflowRef: 'templates/WORKFLOW_TEMPLATES.md#quality-first-team',
    patterns: ['templates/QUALITY_GATE_PATTERNS.md']
  }
};
```

**2. Update Wizard Flow**

```javascript
// Replace team size question with use-case selection
const { useCase } = await inquirer.prompt([
  {
    type: 'list',
    name: 'useCase',
    message: "What's your primary use case?",
    choices: [
      { name: '🚀 Startup MVP (5 agents, 1-2 weeks)', value: 'startup-mvp' },
      { name: '📈 Marketing Campaign (5 agents, 2-4 weeks)', value: 'marketing-campaign' },
      { name: '🏢 Enterprise Feature (6 agents, 4-8 weeks)', value: 'enterprise-feature' },
      { name: '🔬 Quality-First (4 agents, quality-driven)', value: 'quality-first' },
      { name: '⚙️  Legacy: 3 agents (minimal)', value: 'legacy-3' },
      { name: '⚙️  Legacy: 5 agents (standard)', value: 'legacy-5' },
      { name: '⚙️  Legacy: 11 agents (full stack)', value: 'legacy-11' },
      { name: '🎨 Custom (choose your own agents)', value: 'custom' },
    ],
    default: 'startup-mvp',
  },
]);

// Show template details if workflow template selected
if (WORKFLOW_TEMPLATES[useCase]) {
  const template = WORKFLOW_TEMPLATES[useCase];
  console.log(chalk.cyan(`\n✨ ${template.name} Team`));
  console.log(chalk.dim('─'.repeat(60)));

  for (const agent of template.agents) {
    console.log(chalk.white(`${agent.emoji} ${agent.name} - ${agent.role}`));
  }

  console.log(chalk.dim(`\nTimeline: ${template.timeline}`));
  console.log(chalk.dim(`Perfect for: ${template.description}`));

  const { customize } = await inquirer.prompt([
    {
      type: 'list',
      name: 'customize',
      message: 'Would you like to:',
      choices: [
        { name: 'Use this team as-is (recommended)', value: 'use' },
        { name: 'Customize the roster', value: 'customize' },
        { name: 'See other templates', value: 'back' },
      ],
      default: 'use',
    },
  ]);

  if (customize === 'back') {
    // Loop back to use-case selection (implement recursion)
  } else if (customize === 'customize') {
    // Allow editing the roster (implement agent browser)
  }
}
```

**3. Update Team Generation**

```javascript
function generateTeamJson(config) {
  let agents;

  if (WORKFLOW_TEMPLATES[config.useCase]) {
    // Use workflow template agents
    const template = WORKFLOW_TEMPLATES[config.useCase];
    agents = template.agents.map(agent => ({
      ...agent,
      name: agent.id === 'main' ? config.orchestratorName : agent.name,
      workspace: agent.id === 'main' ? '.' : agent.id,
    }));
  } else if (config.useCase.startsWith('legacy-')) {
    // Use legacy rosters
    const size = parseInt(config.useCase.split('-')[1]);
    agents = AGENT_ROSTERS[size].map(agent => ({
      ...agent,
      name: agent.id === 'main' ? config.orchestratorName : agent.name,
    }));
  } else if (config.useCase === 'custom') {
    // Use custom selected agents
    agents = config.customAgents;
  }

  return {
    team_name: config.teamName,
    orchestrator_name: config.orchestratorName,
    use_case: config.useCase,
    workflow_template: WORKFLOW_TEMPLATES[config.useCase]?.workflowRef,
    pattern_references: WORKFLOW_TEMPLATES[config.useCase]?.patterns || [],
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
```

**4. Update Post-Setup Output**

```javascript
// After team creation
console.log(chalk.cyan.bold(`\n🎉 ${config.teamName} AGI team is live!\n`));
console.log(chalk.white(`Use Case:  ${WORKFLOW_TEMPLATES[config.useCase]?.name || config.useCase}`));
console.log(chalk.white(`Agents:    ${team.agents.length}`));
console.log(chalk.white(`Workspace: ${WORKSPACE}`));

if (WORKFLOW_TEMPLATES[config.useCase]) {
  const template = WORKFLOW_TEMPLATES[config.useCase];
  console.log(chalk.dim(`\n📚 Workflow Guide: ${template.workflowRef}`));
  console.log(chalk.dim(`\n✨ Quick Start:`));
  console.log(chalk.dim(`   1. Cooper coordinates the pipeline`));
  console.log(chalk.dim(`   2. Refer to workflow template for phase-by-phase guidance`));
  console.log(chalk.dim(`   3. Quality gates enforced automatically`));

  if (template.patterns.length > 0) {
    console.log(chalk.dim(`\n📖 Pattern References:`));
    template.patterns.forEach(pattern => {
      console.log(chalk.dim(`   • ${pattern}`));
    });
  }
}

console.log(chalk.dim(`\nNext: talk to ${config.orchestratorName} · /agi-farm status · /agi-farm dashboard\n`));
```

---

### Phase 2: Add Agent Browser (v1.7.1 - Week 2)

#### Agent Metadata Indexing

**1. Create Agent Registry**

```javascript
// scripts/lib/agent-registry.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export function loadAgentRegistry() {
  const registry = {
    'agi-farm': [],
    'ecc': [],
    'agency-agents': [],
  };

  // Load AGI Farm core agents
  const coreTemplates = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.startsWith('SOUL.md.') && !f.includes('generic'));

  for (const file of coreTemplates) {
    const agentId = file.replace('SOUL.md.', '');
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
    const metadata = extractMetadata(content);

    registry['agi-farm'].push({
      id: `agi-farm-${agentId}`,
      source: 'agi-farm',
      template: file,
      category: 'core',
      ...metadata,
    });
  }

  // Load Agency-Agents templates
  const agencyDir = path.join(TEMPLATES_DIR, 'agency-agents');
  const categories = fs.readdirSync(agencyDir);

  for (const category of categories) {
    const categoryPath = path.join(agencyDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const templates = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

    for (const file of templates) {
      const agentId = file.replace('.md', '');
      const content = fs.readFileSync(path.join(categoryPath, file), 'utf-8');
      const metadata = extractMetadata(content);

      registry['agency-agents'].push({
        id: `agency-agents-${category}-${agentId}`,
        source: 'agency-agents',
        template: `agency-agents/${category}/${file}`,
        category,
        ...metadata,
      });
    }
  }

  return registry;
}

function extractMetadata(content) {
  // Extract name, role, description from SOUL.md content
  // Parse frontmatter or markdown headings
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const descMatch = content.match(/(?:^|\n)>(.+)/);

  return {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    description: descMatch ? descMatch[1].trim() : '',
  };
}
```

**2. Add Agent Browser UI**

```javascript
async function browseAgents(registry) {
  const categories = [...new Set(Object.values(registry).flat().map(a => a.category))];

  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'Browse agents by category:',
      choices: categories.map(cat => ({
        name: `${getCategoryEmoji(cat)} ${formatCategoryName(cat)} (${countAgentsInCategory(registry, cat)} agents)`,
        value: cat,
      })),
    },
  ]);

  const agentsInCategory = Object.values(registry)
    .flat()
    .filter(a => a.category === category);

  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message: `Select agents from ${formatCategoryName(category)}:`,
      choices: agentsInCategory.map(agent => ({
        name: `${agent.name} - ${agent.description}`,
        value: agent,
      })),
    },
  ]);

  return selectedAgents;
}

function getCategoryEmoji(category) {
  const emojis = {
    'core': '🦅',
    'testing': '🧪',
    'engineering': '💻',
    'design': '🎨',
    'marketing': '📈',
    'product': '📋',
    'project-management': '📊',
    'support': '🛠️',
    'spatial-computing': '🥽',
    'specialized': '⚙️',
    'strategy': '🎯',
  };
  return emojis[category] || '📁';
}
```

---

### Phase 3: Agent Template Copying (v1.7.2 - Week 3)

**Problem**: Currently, wizard only creates agents registered with OpenClaw. Agency-Agents templates need to be copied to agent workspaces.

**Solution**: Copy SOUL.md templates during agent creation

```javascript
function createAgents(team) {
  const spinner = ora('Creating OpenClaw agents...').start();

  for (const agent of team.agents) {
    if (agent.id === 'main') continue;

    try {
      const wsPath = path.join(WORKSPACE, 'agents-workspaces', agent.workspace);
      fs.mkdirSync(wsPath, { recursive: true});

      // NEW: Copy SOUL.md template
      if (agent.template) {
        const templatePath = path.join(TEMPLATES_DIR, agent.template);
        const soulPath = path.join(wsPath, 'SOUL.md');

        if (fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, soulPath);
          spinner.text = `Copied template: ${agent.name} (${agent.template})`;
        }
      }

      spinner.text = `Registering agent: ${agent.name}...`;
      const result = runCommand('openclaw', [
        'agents', 'add',
        '--workspace', wsPath,
        agent.name,
        '--non-interactive'
      ]);

      if (result.status === 0) {
        spinner.text = `Created agent: ${agent.name} ${agent.emoji}`;
      }
    } catch (err) {
      spinner.text = chalk.yellow(`⚠ Warning: ${agent.name} failed to initialize.`);
    }
  }

  spinner.succeed(`Agents initialized with templates`);
}
```

---

## 📊 User Experience Improvements

### Before (v1.6.0)
```
? How many agents?
  3 — Minimal
  5 — Standard
  11 — Full stack ✓

[Creates generic team with AGI Farm core agents]
[User must manually browse Agency-Agents templates]
[No workflow guidance]
```

### After (v1.7.0)
```
? What's your primary use case?
  🚀 Startup MVP (5 agents, 1-2 weeks) ✓
  📈 Marketing Campaign
  🏢 Enterprise Feature
  🔬 Quality-First
  ⚙️  Custom

✨ Startup MVP Team
────────────────────────────────────────────
🦅 Cooper - Pipeline management
⚒️ Forge - Backend implementation
🐛 Pixel - UI implementation
🛡️ Vigil - Evidence-based validation
📈 Growth Hacker - User acquisition

Timeline: 1-2 weeks
Perfect for: Rapid prototyping, proof-of-concept

? Would you like to:
  Use this team as-is ✓

[Creates team with workflow documentation]
[Copies all required SOUL.md templates]
[Provides workflow guide reference]
```

---

## 🎯 Success Metrics

### v1.7.0 (Workflow Templates in Wizard)
- [ ] 4 workflow templates available in wizard
- [ ] Workflow documentation linked in post-setup output
- [ ] Pattern references included in team.json
- [ ] Users can discover workflow templates during setup

### v1.7.1 (Agent Browser)
- [ ] All 91 agents indexed and browsable
- [ ] Category-based browsing functional
- [ ] Agent selection with descriptions
- [ ] Custom teams can be created

### v1.7.2 (Template Copying)
- [ ] SOUL.md templates auto-copied to agent workspaces
- [ ] Agency-Agents templates work out-of-box
- [ ] No manual template copying required

---

## 🚧 Implementation Challenges

### Challenge 1: Agent Workspace Setup
**Problem**: Agency-Agents templates may have different workspace requirements
**Solution**: Standardize workspace structure, copy template to `SOUL.md` in agent workspace

### Challenge 2: Agent Registration
**Problem**: OpenClaw may not recognize custom agent names
**Solution**: Use `openclaw agents add` with `--non-interactive` flag, handle conflicts gracefully

### Challenge 3: Backward Compatibility
**Problem**: Existing teams use legacy rosters
**Solution**: Keep legacy options (`legacy-3`, `legacy-5`, `legacy-11`) in wizard for backward compatibility

### Challenge 4: Template Discovery
**Problem**: Users don't know which agents exist
**Solution**: Agent browser with category navigation and descriptions

---

## 📚 Documentation Updates

### Files to Update
- `README.md` - Update "Quick Start" with workflow template examples
- `AGENCY_AGENTS_GUIDE.md` - Add wizard integration section
- `WORKFLOW_TEMPLATES.md` - Add "Using with Wizard" section
- `docs/WIZARD_GUIDE.md` - NEW: Comprehensive wizard user guide

---

**Version**: 1.0
**Status**: Planning Complete, Implementation: v1.7.0+
**Last Updated**: March 7, 2026
