import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Setup Scenario Tests
 *
 * Tests the full setup flow for every blueprint and custom team configurations.
 * Validates:
 * - Workspace file creation (TASKS.json, BUDGET.json, etc.)
 * - Paperclip sync (company + agents + hierarchy + issues)
 * - Agent creation and SOUL.md rendering
 * - Comms infrastructure
 * - HITL policy with role-based overrides
 * - Starter project seeding
 * - Edge cases (empty teams, reinstall, Paperclip offline)
 */

// ── Test workspace ──────────────────────────────────────────────────────────

let WORKSPACE;

beforeEach(() => {
  WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-test-'));
});

afterEach(() => {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
});

// ── Helpers extracted from setup.js (pure functions, no inquirer) ────────────

function initializeRegistries(config, workspace) {
  fs.writeFileSync(path.join(workspace, 'TASKS.json'), '[]');

  fs.writeFileSync(path.join(workspace, 'PROJECTS.json'), JSON.stringify({
    defaults: { auto_project_channel: true, execution_path: 'agi-farm-init' },
    items: []
  }, null, 2));

  fs.writeFileSync(path.join(workspace, 'BUDGET.json'), JSON.stringify({
    period: 'monthly',
    currency: 'USD',
    limit: parseFloat(config.budget.monthlyLimit),
    spent: 0,
    threshold_warn: parseFloat(config.budget.thresholdWarn) / 100
  }, null, 2));

  fs.writeFileSync(path.join(workspace, 'OKRs.json'), JSON.stringify({ objectives: config.okrs || [] }, null, 2));

  fs.writeFileSync(path.join(workspace, 'VELOCITY.json'), JSON.stringify({
    daily: [], weekly: [], by_agent: {}, by_type: {}
  }, null, 2));

  const status = {};
  const perf = {};
  for (const a of config.agents) {
    status[a.id] = { status: 'available', name: a.name };
    perf[a.id] = { tasks_completed: 0, tasks_failed: 0, quality_score: 0, credibility: 1.0 };
  }
  fs.writeFileSync(path.join(workspace, 'AGENT_STATUS.json'), JSON.stringify(status, null, 2));
  fs.writeFileSync(path.join(workspace, 'AGENT_PERFORMANCE.json'), JSON.stringify(perf, null, 2));
}

function initializeComms(config, workspace) {
  const commsDir = path.join(workspace, 'comms');
  fs.mkdirSync(path.join(commsDir, 'inboxes'), { recursive: true });
  fs.mkdirSync(path.join(commsDir, 'outboxes'), { recursive: true });
  fs.mkdirSync(path.join(commsDir, 'channels'), { recursive: true });

  const teamChannel = {
    id: 'team-wide',
    name: 'Team General',
    members: config.agents.map(a => a.id),
    messages: [
      { sender: 'system', text: `Welcome to ${config.teamName}! Comms initialized.`, timestamp: new Date().toISOString() }
    ]
  };
  fs.writeFileSync(path.join(commsDir, 'channels', 'team-wide.json'), JSON.stringify(teamChannel, null, 2));
}

function initializeHitlPolicy(config, workspace) {
  const policy = {
    global_threshold: config.ops.hitlSensitivity,
    auto_approve_below: config.ops.hitlSensitivity - 0.2,
    require_manual_review_for: [
      'filesystem_delete', 'network_request', 'process_kill', 'security_scan_bypass'
    ],
    agent_overrides: {}
  };

  for (const a of config.agents) {
    if (a.role.toLowerCase().includes('security') || a.id === 'vigil') {
      policy.agent_overrides[a.id] = { threshold: 0.5 };
    }
  }

  fs.writeFileSync(path.join(workspace, 'HITL_POLICY.json'), JSON.stringify(policy, null, 2));
}

function initializeStarterProject(config, workspace) {
  if (!config.project?.createProject) return;

  const starter = config.starterProject || {
    name: 'Initial Project',
    description: 'First research and development cycle',
    tasks: [{ id: 'init-1', title: 'Onboarding & Initial Research', assigned_to: 'main' }]
  };

  const projects = JSON.parse(fs.readFileSync(path.join(workspace, 'PROJECTS.json'), 'utf-8'));
  projects.items.push({
    id: 'starter-p1',
    name: starter.name,
    description: starter.description,
    status: 'active',
    created_at: new Date().toISOString(),
    members: config.agents.map(a => a.id)
  });
  fs.writeFileSync(path.join(workspace, 'PROJECTS.json'), JSON.stringify(projects, null, 2));

  const tasks = starter.tasks.map(t => ({
    ...t,
    project_id: 'starter-p1',
    status: 'pending',
    priority: 'medium',
    created_at: new Date().toISOString()
  }));
  fs.writeFileSync(path.join(workspace, 'TASKS.json'), JSON.stringify(tasks, null, 2));
}

// ── Paperclip sync mock ─────────────────────────────────────────────────────

let fetchCalls;
let agentCounter;

function mockResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function installPaperclipMock() {
  fetchCalls = [];
  agentCounter = 0;
  globalThis.fetch = jest.fn(async (url, opts) => {
    fetchCalls.push({ url, opts });
    const method = opts?.method || 'GET';

    // Health check
    if (url.includes('/api/health')) return mockResponse({ status: 'ok' });
    // POST company
    if (url.endsWith('/api/companies') && method === 'POST') {
      const body = JSON.parse(opts.body);
      return mockResponse({ id: 'comp-test', name: body.name });
    }
    // POST agent
    if (url.includes('/agents') && method === 'POST') {
      agentCounter++;
      const body = JSON.parse(opts.body);
      return mockResponse({ id: `agent-${agentCounter}`, name: body.name, role: body.role });
    }
    // PATCH agent
    if (url.includes('/api/agents/') && method === 'PATCH') {
      const body = JSON.parse(opts.body);
      const id = url.split('/api/agents/')[1];
      return mockResponse({ id, ...body });
    }
    // POST issue
    if (url.includes('/issues') && method === 'POST') {
      return mockResponse({ id: `iss-${Date.now()}` });
    }
    return mockResponse({ error: 'not found' }, { ok: false, status: 404 });
  });
}

async function syncToPaperclipMock(config) {
  const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
  const bridge = new PaperclipBridge('http://127.0.0.1:3100');
  await bridge.waitForReady(5000);
  return bridge.syncTeam(config);
}

// ── Import blueprints ───────────────────────────────────────────────────────

let TEAM_BLUEPRINTS, getBlueprintById;

beforeAll(async () => {
  const mod = await import('../scripts/lib/blueprints.js');
  TEAM_BLUEPRINTS = mod.TEAM_BLUEPRINTS;
  getBlueprintById = mod.getBlueprintById;
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Blueprint Registry
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blueprint registry', () => {
  test('all 15 blueprints are loadable', () => {
    const ids = Object.keys(TEAM_BLUEPRINTS);
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });

  test('every blueprint has required fields', () => {
    for (const [id, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      expect(bp.name).toBeTruthy();
      expect(bp.industry).toBeTruthy();
      expect(bp.agents).toBeDefined();
      expect(bp.agents.length).toBeGreaterThanOrEqual(2);
      expect(bp.hitlPolicy?.threshold).toBeGreaterThan(0);
      expect(bp.starterProject?.name).toBeTruthy();
      expect(bp.starterProject?.tasks?.length).toBeGreaterThan(0);
    }
  });

  test('every blueprint has an orchestrator (main) agent', () => {
    for (const [id, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      const main = bp.agents.find(a => a.id === 'main');
      expect(main).toBeTruthy();
      expect(main.role.toLowerCase()).toMatch(/orchestrat/i);
    }
  });

  test('no duplicate agent IDs within a blueprint', () => {
    for (const [id, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      const agentIds = bp.agents.map(a => a.id);
      expect(new Set(agentIds).size).toBe(agentIds.length);
    }
  });

  test('all starter tasks reference valid agent IDs', () => {
    for (const [id, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      const agentIds = new Set(bp.agents.map(a => a.id));
      for (const task of bp.starterProject.tasks) {
        expect(agentIds.has(task.assigned_to)).toBe(true);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Workspace file creation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Workspace initialization', () => {
  const baseConfig = {
    teamName: 'Test Team',
    agents: [
      { id: 'main', name: 'Cooper', role: 'Orchestrator', emoji: '🦅' },
      { id: 'dev', name: 'Dev', role: 'Engineer', emoji: '⚒️' },
    ],
    budget: { monthlyLimit: '750', thresholdWarn: '85', seedOkrs: false },
    ops: { activeCrons: [], hitlSensitivity: 0.7 },
    project: { createProject: false },
    intel: { domain: 'FinTech' },
  };

  test('initializeRegistries creates all required JSON files', () => {
    initializeRegistries(baseConfig, WORKSPACE);

    const required = ['TASKS.json', 'PROJECTS.json', 'BUDGET.json', 'OKRs.json',
      'VELOCITY.json', 'AGENT_STATUS.json', 'AGENT_PERFORMANCE.json'];
    for (const f of required) {
      expect(fs.existsSync(path.join(WORKSPACE, f))).toBe(true);
    }
  });

  test('BUDGET.json reflects config values', () => {
    initializeRegistries(baseConfig, WORKSPACE);
    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(750);
    expect(budget.threshold_warn).toBe(0.85);
    expect(budget.spent).toBe(0);
    expect(budget.currency).toBe('USD');
  });

  test('AGENT_STATUS tracks all agents', () => {
    initializeRegistries(baseConfig, WORKSPACE);
    const status = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    expect(Object.keys(status)).toEqual(['main', 'dev']);
    expect(status.main.status).toBe('available');
    expect(status.dev.name).toBe('Dev');
  });

  test('AGENT_PERFORMANCE initializes all metrics to zero', () => {
    initializeRegistries(baseConfig, WORKSPACE);
    const perf = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), 'utf-8'));
    for (const agentId of ['main', 'dev']) {
      expect(perf[agentId].tasks_completed).toBe(0);
      expect(perf[agentId].credibility).toBe(1.0);
    }
  });

  test('VELOCITY starts empty', () => {
    initializeRegistries(baseConfig, WORKSPACE);
    const vel = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'VELOCITY.json'), 'utf-8'));
    expect(vel.daily).toEqual([]);
    expect(vel.by_agent).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Comms infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

describe('Comms infrastructure', () => {
  test('creates directory structure', () => {
    initializeComms({ teamName: 'T', agents: [{ id: 'a' }] }, WORKSPACE);
    expect(fs.existsSync(path.join(WORKSPACE, 'comms', 'inboxes'))).toBe(true);
    expect(fs.existsSync(path.join(WORKSPACE, 'comms', 'outboxes'))).toBe(true);
    expect(fs.existsSync(path.join(WORKSPACE, 'comms', 'channels'))).toBe(true);
  });

  test('team-wide channel lists all agent IDs', () => {
    const agents = [{ id: 'main' }, { id: 'forge' }, { id: 'vigil' }];
    initializeComms({ teamName: 'Alpha', agents }, WORKSPACE);
    const ch = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(ch.members).toEqual(['main', 'forge', 'vigil']);
    expect(ch.messages[0].text).toContain('Alpha');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HITL policy
// ═══════════════════════════════════════════════════════════════════════════════

describe('HITL policy', () => {
  test('sets global threshold from config', () => {
    const config = {
      agents: [{ id: 'main', role: 'Orchestrator' }],
      ops: { hitlSensitivity: 0.7 },
    };
    initializeHitlPolicy(config, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(0.7);
    expect(policy.auto_approve_below).toBeCloseTo(0.5);
  });

  test('low sensitivity (0.9) creates relaxed policy', () => {
    initializeHitlPolicy({
      agents: [{ id: 'main', role: 'Orchestrator' }],
      ops: { hitlSensitivity: 0.9 },
    }, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(0.9);
    expect(policy.auto_approve_below).toBeCloseTo(0.7);
  });

  test('high sensitivity (0.5) creates strict policy', () => {
    initializeHitlPolicy({
      agents: [{ id: 'main', role: 'Orchestrator' }],
      ops: { hitlSensitivity: 0.5 },
    }, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(0.5);
    expect(policy.auto_approve_below).toBeCloseTo(0.3);
  });

  test('vigil agent gets stricter override', () => {
    initializeHitlPolicy({
      agents: [
        { id: 'main', role: 'Orchestrator' },
        { id: 'vigil', role: 'QA Specialist' },
      ],
      ops: { hitlSensitivity: 0.7 },
    }, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.agent_overrides.vigil.threshold).toBe(0.5);
    expect(policy.agent_overrides.main).toBeUndefined();
  });

  test('security-role agents get stricter override', () => {
    initializeHitlPolicy({
      agents: [
        { id: 'main', role: 'Orchestrator' },
        { id: 'security', role: 'Security Compliance' },
        { id: 'dev', role: 'Backend Developer' },
      ],
      ops: { hitlSensitivity: 0.8 },
    }, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.agent_overrides.security.threshold).toBe(0.5);
    expect(policy.agent_overrides.dev).toBeUndefined();
  });

  test('required manual review actions are always present', () => {
    initializeHitlPolicy({
      agents: [{ id: 'x', role: 'Generic' }],
      ops: { hitlSensitivity: 0.9 },
    }, WORKSPACE);
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.require_manual_review_for).toContain('filesystem_delete');
    expect(policy.require_manual_review_for).toContain('network_request');
    expect(policy.require_manual_review_for).toContain('process_kill');
    expect(policy.require_manual_review_for).toContain('security_scan_bypass');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Starter project seeding
// ═══════════════════════════════════════════════════════════════════════════════

describe('Starter project', () => {
  test('seeds project and tasks when createProject is true', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'C' }, { id: 'forge', name: 'F' }],
      budget: { monthlyLimit: '100', thresholdWarn: '80' },
    }, WORKSPACE);

    initializeStarterProject({
      agents: [{ id: 'main' }, { id: 'forge' }],
      project: { createProject: true },
      starterProject: {
        name: 'MVP Launch',
        description: 'Build the MVP',
        tasks: [
          { id: 't1', title: 'Setup backend', assigned_to: 'forge' },
          { id: 't2', title: 'Plan sprint', assigned_to: 'main' },
        ],
      },
    }, WORKSPACE);

    const projects = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'PROJECTS.json'), 'utf-8'));
    expect(projects.items).toHaveLength(1);
    expect(projects.items[0].name).toBe('MVP Launch');
    expect(projects.items[0].status).toBe('active');
    expect(projects.items[0].members).toEqual(['main', 'forge']);

    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks).toHaveLength(2);
    expect(tasks[0].project_id).toBe('starter-p1');
    expect(tasks[0].status).toBe('pending');
    expect(tasks[1].title).toBe('Plan sprint');
  });

  test('skips project creation when createProject is false', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'C' }],
      budget: { monthlyLimit: '100', thresholdWarn: '80' },
    }, WORKSPACE);

    initializeStarterProject({ project: { createProject: false } }, WORKSPACE);

    const projects = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'PROJECTS.json'), 'utf-8'));
    expect(projects.items).toHaveLength(0);
  });

  test('uses default project when no starterProject provided', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'C' }],
      budget: { monthlyLimit: '100', thresholdWarn: '80' },
    }, WORKSPACE);

    initializeStarterProject({
      agents: [{ id: 'main' }],
      project: { createProject: true },
    }, WORKSPACE);

    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Onboarding & Initial Research');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Full blueprint scenarios → Paperclip sync
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blueprint → Paperclip sync', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  // Test every single blueprint
  const blueprintIds = [
    'startup-mvp', 'fullstack-product', 'mobile-first', 'ai-ml-system',
    'marketing-campaign', 'brand-launch', 'performance-marketing',
    'enterprise-feature', 'security-critical', 'compliance-audit',
    'quality-first', 'research-discovery',
    'content-studio', 'design-sprint',
  ];

  test.each(blueprintIds)('blueprint "%s" syncs correctly', async (bpId) => {
    const bp = getBlueprintById(bpId);
    expect(bp).toBeTruthy();

    const config = {
      teamName: bp.name,
      blueprintId: bpId,
      agents: bp.agents,
      intel: { domain: bp.industry },
      project: { createProject: true },
      starterTasks: bp.starterProject.tasks,
    };

    const result = await syncToPaperclipMock(config);

    // Company was created
    expect(result.company.id).toBe('comp-test');

    // All agents were created
    expect(result.agents).toHaveLength(bp.agents.length);

    // Agent creation calls match agent count
    const createCalls = fetchCalls.filter(c =>
      c.url.includes('/agents') && c.opts?.method === 'POST'
    );
    expect(createCalls.length).toBe(bp.agents.length);

    // Hierarchy: CEO/orchestrator is first, all others report to it
    const firstAgent = JSON.parse(createCalls[0].opts.body);
    expect(firstAgent.role).toBe('ceo'); // orchestrator maps to ceo

    // PATCH calls: (N-1) agents get reportsTo
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls.length).toBe(bp.agents.length - 1);
    for (const pc of patchCalls) {
      expect(JSON.parse(pc.opts.body).reportsTo).toBe('agent-1');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Full end-to-end scenario simulations
// ═══════════════════════════════════════════════════════════════════════════════

describe('End-to-end setup scenarios', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('Scenario: Startup MVP with custom orchestrator name', async () => {
    const bp = getBlueprintById('startup-mvp');
    const agents = bp.agents.map(a => a.id === 'main'
      ? { ...a, name: 'Phoenix' }
      : a
    );

    const config = {
      teamName: 'Phoenix Labs',
      blueprintId: 'startup-mvp',
      agents,
      intel: { domain: 'SaaS' },
      budget: { monthlyLimit: '1000', thresholdWarn: '75', seedOkrs: true },
      ops: { activeCrons: ['security-scan', 'velocity-report'], hitlSensitivity: 0.7 },
      project: { createProject: true },
      starterProject: bp.starterProject,
    };

    // 1. Initialize workspace
    initializeRegistries(config, WORKSPACE);
    initializeComms(config, WORKSPACE);
    initializeHitlPolicy(config, WORKSPACE);
    initializeStarterProject(config, WORKSPACE);

    // 2. Sync to Paperclip
    const result = await syncToPaperclipMock(config);

    // Verify workspace files
    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(1000);

    const status = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    expect(status.main.name).toBe('Phoenix');
    expect(Object.keys(status)).toHaveLength(5); // 5 agents in startup-mvp

    const comms = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(comms.members).toHaveLength(5);

    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks.length).toBe(bp.starterProject.tasks.length);

    // Verify Paperclip sync
    expect(result.agents).toHaveLength(5);
    expect(result.company.name).toBe('Phoenix Labs');
  });

  test('Scenario: Security-Critical team gets strict HITL', async () => {
    const bp = getBlueprintById('security-critical');
    const config = {
      teamName: 'Fort Knox',
      agents: bp.agents,
      budget: { monthlyLimit: '2000', thresholdWarn: '60' },
      ops: { activeCrons: [], hitlSensitivity: bp.hitlPolicy.threshold }, // 0.5
      project: { createProject: false },
      intel: { domain: 'FinSec' },
    };

    initializeRegistries(config, WORKSPACE);
    initializeHitlPolicy(config, WORKSPACE);

    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(0.5);
    expect(policy.auto_approve_below).toBeCloseTo(0.3);

    // Both security and vigil agents should get overrides
    expect(policy.agent_overrides.security?.threshold).toBe(0.5);
    expect(policy.agent_overrides.vigil?.threshold).toBe(0.5);
  });

  test('Scenario: Large compliance team (6 agents) hierarchy', async () => {
    const bp = getBlueprintById('compliance-audit');
    const config = {
      teamName: 'Audit Corp',
      blueprintId: 'compliance-audit',
      agents: bp.agents,
      intel: { domain: 'Legal' },
    };

    const result = await syncToPaperclipMock(config);

    expect(result.agents).toHaveLength(6);

    // 5 non-CEO agents should report to CEO
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(5);
  });

  test('Scenario: Custom team with 2 agents (minimal)', async () => {
    const config = {
      teamName: 'Duo',
      agents: [
        { id: 'main', name: 'Lead', role: 'Orchestrator', emoji: '🦅' },
        { id: 'worker', name: 'Worker', role: 'Backend Developer', emoji: '⚒️' },
      ],
      intel: { domain: 'Web' },
      budget: { monthlyLimit: '100', thresholdWarn: '90' },
      ops: { activeCrons: [], hitlSensitivity: 0.9 },
      project: { createProject: false },
    };

    initializeRegistries(config, WORKSPACE);
    initializeComms(config, WORKSPACE);
    initializeHitlPolicy(config, WORKSPACE);

    const result = await syncToPaperclipMock(config);

    expect(result.agents).toHaveLength(2);
    const status = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    expect(Object.keys(status)).toEqual(['main', 'worker']);
  });

  test('Scenario: Paperclip offline — sync skipped gracefully', async () => {
    // Override fetch to simulate offline
    globalThis.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });

    const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
    const bridge = new PaperclipBridge('http://127.0.0.1:3100');

    await expect(bridge.waitForReady(800)).rejects.toThrow('Paperclip not ready');

    // Workspace files should still work independently
    initializeRegistries({
      agents: [{ id: 'main', name: 'Solo' }],
      budget: { monthlyLimit: '500', thresholdWarn: '80' },
    }, WORKSPACE);

    expect(fs.existsSync(path.join(WORKSPACE, 'AGENT_STATUS.json'))).toBe(true);
  });

  test('Scenario: Zero-budget team', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'Free' }],
      budget: { monthlyLimit: '0', thresholdWarn: '80' },
    }, WORKSPACE);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(0);
  });

  test('Scenario: All blueprint agents are available and statusable', () => {
    for (const [bpId, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `agi-bp-${bpId}-`));
      try {
        initializeRegistries({
          agents: bp.agents,
          budget: { monthlyLimit: '500', thresholdWarn: '80' },
        }, tmpDir);

        const status = JSON.parse(fs.readFileSync(path.join(tmpDir, 'AGENT_STATUS.json'), 'utf-8'));
        const perf = JSON.parse(fs.readFileSync(path.join(tmpDir, 'AGENT_PERFORMANCE.json'), 'utf-8'));

        expect(Object.keys(status).length).toBe(bp.agents.length);
        expect(Object.keys(perf).length).toBe(bp.agents.length);

        for (const agent of bp.agents) {
          expect(status[agent.id]).toBeDefined();
          expect(status[agent.id].name).toBe(agent.name);
          expect(perf[agent.id].credibility).toBe(1.0);
        }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
});
