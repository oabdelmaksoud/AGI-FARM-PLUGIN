import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * User Setup Scenario Tests
 *
 * Simulates real-world user flows through the AGI Farm setup wizard.
 * Each test covers a complete user journey from config → workspace → Paperclip sync.
 *
 * Scenarios:
 * - First-time user with blueprint selection
 * - Experienced user with custom team
 * - Re-setup over existing workspace
 * - Budget edge cases (zero, high, fractional)
 * - Various HITL sensitivity levels
 * - Teams with unusual agent compositions
 * - Paperclip connectivity issues
 * - Blueprint switching mid-setup
 * - Workspace file integrity after setup
 */

// ── Test workspace ──────────────────────────────────────────────────────────

let WORKSPACE;

beforeEach(() => {
  WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-user-'));
});

afterEach(() => {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
});

// ── Pure setup functions (extracted from setup.js) ──────────────────────────

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

  fs.writeFileSync(path.join(workspace, 'OKRs.json'), JSON.stringify({
    objectives: config.okrs || []
  }, null, 2));

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
    const role = (a.role || '').toLowerCase();
    if (role.includes('security') || a.id === 'vigil') {
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

function fullSetup(config, workspace) {
  initializeRegistries(config, workspace);
  initializeComms(config, workspace);
  initializeHitlPolicy(config, workspace);
  initializeStarterProject(config, workspace);
}

// ── Paperclip mock ──────────────────────────────────────────────────────────

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

    if (url.includes('/api/health')) return mockResponse({ status: 'ok' });
    if (url.endsWith('/api/companies') && method === 'POST') {
      const body = JSON.parse(opts.body);
      return mockResponse({ id: 'comp-test', name: body.name });
    }
    if (url.includes('/agents') && method === 'POST') {
      agentCounter++;
      const body = JSON.parse(opts.body);
      return mockResponse({ id: `agent-${agentCounter}`, name: body.name, role: body.role });
    }
    if (url.includes('/api/agents/') && method === 'PATCH') {
      const body = JSON.parse(opts.body);
      const id = url.split('/api/agents/')[1];
      return mockResponse({ id, ...body });
    }
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
// 1. First-Time User Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('First-time user setup', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('user picks startup-mvp blueprint with defaults', async () => {
    const bp = getBlueprintById('startup-mvp');
    const config = {
      teamName: 'My First Team',
      blueprintId: 'startup-mvp',
      agents: bp.agents,
      intel: { domain: 'SaaS' },
      budget: { monthlyLimit: '500', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: true },
      starterProject: bp.starterProject,
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    // Workspace files exist
    for (const f of ['TASKS.json', 'BUDGET.json', 'AGENT_STATUS.json', 'HITL_POLICY.json']) {
      expect(fs.existsSync(path.join(WORKSPACE, f))).toBe(true);
    }

    // Comms initialized
    expect(fs.existsSync(path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'))).toBe(true);

    // Paperclip synced
    expect(result.company.name).toBe('My First Team');
    expect(result.agents.length).toBe(bp.agents.length);

    // All tasks seeded
    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks.length).toBe(bp.starterProject.tasks.length);
    expect(tasks.every(t => t.status === 'pending')).toBe(true);
  });

  test('user picks fullstack-product with custom team name', async () => {
    const bp = getBlueprintById('fullstack-product');
    const config = {
      teamName: 'Acme Engineering',
      blueprintId: 'fullstack-product',
      agents: bp.agents,
      intel: { domain: 'E-commerce' },
      budget: { monthlyLimit: '2000', thresholdWarn: '90' },
      ops: { activeCrons: ['security-scan'], hitlSensitivity: 0.6 },
      project: { createProject: true },
      starterProject: bp.starterProject,
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    expect(result.company.name).toBe('Acme Engineering');
    expect(result.agents.length).toBe(bp.agents.length);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(2000);
    expect(budget.threshold_warn).toBe(0.9);
  });

  test('user picks ai-ml-system blueprint for ML project', async () => {
    const bp = getBlueprintById('ai-ml-system');
    const config = {
      teamName: 'ML Dream Team',
      blueprintId: 'ai-ml-system',
      agents: bp.agents,
      intel: { domain: 'Machine Learning' },
      budget: { monthlyLimit: '5000', thresholdWarn: '70' },
      ops: { activeCrons: [], hitlSensitivity: 0.5 },
      project: { createProject: true },
      starterProject: bp.starterProject,
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    expect(result.agents.length).toBe(bp.agents.length);

    // HITL is strict (0.5)
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(0.5);
    expect(policy.auto_approve_below).toBeCloseTo(0.3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Custom Team Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('Custom team configurations', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('user creates minimal 2-agent team', async () => {
    const config = {
      teamName: 'Duo',
      agents: [
        { id: 'main', name: 'Alpha', role: 'Lead Orchestrator', emoji: '🦅' },
        { id: 'dev', name: 'Beta', role: 'Full-Stack Developer', emoji: '⚒️' },
      ],
      intel: { domain: 'Web Development' },
      budget: { monthlyLimit: '200', thresholdWarn: '85' },
      ops: { activeCrons: [], hitlSensitivity: 0.9 },
      project: { createProject: false },
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    expect(result.agents).toHaveLength(2);

    // CEO hierarchy: Alpha is CEO, Beta reports to Alpha
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(1);
    expect(JSON.parse(patchCalls[0].opts.body).reportsTo).toBe('agent-1');

    // No tasks created
    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks).toEqual([]);
  });

  test('user creates large 8-agent custom team', async () => {
    const agents = [
      { id: 'main', name: 'Commander', role: 'Lead Orchestrator', emoji: '🦅' },
      { id: 'frontend', name: 'Pixel', role: 'UI Designer', emoji: '🎨' },
      { id: 'backend', name: 'Forge', role: 'Backend Developer', emoji: '⚒️' },
      { id: 'devops', name: 'Pipeline', role: 'DevOps Engineer', emoji: '🔧' },
      { id: 'qa', name: 'Sentinel', role: 'QA Specialist', emoji: '🛡️' },
      { id: 'data', name: 'Lens', role: 'Data Scientist', emoji: '🔬' },
      { id: 'pm', name: 'Compass', role: 'Product Manager', emoji: '🧭' },
      { id: 'security', name: 'Vigil', role: 'Security Analyst', emoji: '🔒' },
    ];

    const config = {
      teamName: 'Enterprise Squad',
      agents,
      intel: { domain: 'Enterprise' },
      budget: { monthlyLimit: '10000', thresholdWarn: '75' },
      ops: { activeCrons: ['security-scan', 'velocity-report'], hitlSensitivity: 0.6 },
      project: { createProject: true },
      starterProject: {
        name: 'Enterprise Onboarding',
        description: 'Initial enterprise setup',
        tasks: [
          { id: 't1', title: 'Infrastructure audit', assigned_to: 'devops' },
          { id: 't2', title: 'Security baseline', assigned_to: 'security' },
          { id: 't3', title: 'Architecture review', assigned_to: 'backend' },
        ],
      },
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    expect(result.agents).toHaveLength(8);

    // All 7 non-CEO agents report to CEO
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(7);

    // Comms channel has all 8 members
    const comms = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(comms.members).toHaveLength(8);

    // 3 tasks seeded
    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks).toHaveLength(3);

    // HITL: security and vigil get overrides
    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.agent_overrides.security).toBeDefined();
    // Note: 'qa' agent named 'Sentinel' with role 'QA Specialist' doesn't trigger
    // the security override because the role doesn't include 'security'
    expect(policy.agent_overrides.qa).toBeUndefined();
  });

  test('user creates single-agent team (solo mode)', async () => {
    const config = {
      teamName: 'Solo Agent',
      agents: [
        { id: 'main', name: 'Solo', role: 'Full Stack Developer', emoji: '🧑‍💻' },
      ],
      intel: { domain: 'Prototype' },
      budget: { monthlyLimit: '50', thresholdWarn: '95' },
      ops: { activeCrons: [], hitlSensitivity: 0.9 },
      project: { createProject: false },
    };

    fullSetup(config, WORKSPACE);
    const result = await syncToPaperclipMock(config);

    expect(result.agents).toHaveLength(1);

    // No PATCH calls for single agent
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(0);

    // Comms channel with single member
    const comms = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(comms.members).toEqual(['main']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Re-setup / Overwrite Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('Re-setup over existing workspace', () => {
  test('re-setup overwrites all workspace files cleanly', () => {
    // First setup
    const config1 = {
      teamName: 'Team A',
      agents: [
        { id: 'main', name: 'Alpha', role: 'Orchestrator' },
        { id: 'dev', name: 'Dev', role: 'Engineer' },
      ],
      budget: { monthlyLimit: '500', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: false },
    };

    fullSetup(config1, WORKSPACE);

    // Simulate agent doing some work
    const status1 = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    status1.main.status = 'busy';
    fs.writeFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), JSON.stringify(status1));

    // Re-setup with different team
    const config2 = {
      teamName: 'Team B',
      agents: [
        { id: 'main', name: 'Boss', role: 'Orchestrator' },
        { id: 'qa', name: 'Tester', role: 'QA Engineer' },
        { id: 'design', name: 'Artisan', role: 'UI Designer' },
      ],
      budget: { monthlyLimit: '1000', thresholdWarn: '70' },
      ops: { activeCrons: [], hitlSensitivity: 0.5 },
      project: { createProject: false },
    };

    fullSetup(config2, WORKSPACE);

    // Verify overwritten correctly
    const status2 = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    expect(Object.keys(status2)).toEqual(['main', 'qa', 'design']);
    expect(status2.main.name).toBe('Boss');
    expect(status2.main.status).toBe('available'); // Reset, not "busy"

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(1000);

    const comms = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(comms.members).toEqual(['main', 'qa', 'design']);
    expect(comms.messages[0].text).toContain('Team B');
  });

  test('re-setup preserves workspace directory structure', () => {
    const config = {
      teamName: 'Test',
      agents: [{ id: 'main', name: 'A', role: 'Engineer' }],
      budget: { monthlyLimit: '100', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: false },
    };

    // First setup
    fullSetup(config, WORKSPACE);

    // Add custom file to workspace
    fs.writeFileSync(path.join(WORKSPACE, 'custom-notes.txt'), 'user notes');

    // Re-setup
    fullSetup(config, WORKSPACE);

    // Custom file should still exist (we don't delete the workspace)
    expect(fs.existsSync(path.join(WORKSPACE, 'custom-notes.txt'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Budget Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('Budget edge cases', () => {
  test('zero budget', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'Free' }],
      budget: { monthlyLimit: '0', thresholdWarn: '80' },
    }, WORKSPACE);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(0);
    expect(budget.spent).toBe(0);
  });

  test('very high budget (enterprise)', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'Enterprise' }],
      budget: { monthlyLimit: '100000', thresholdWarn: '95' },
    }, WORKSPACE);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBe(100000);
    expect(budget.threshold_warn).toBe(0.95);
  });

  test('fractional budget', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'Fraction' }],
      budget: { monthlyLimit: '49.99', thresholdWarn: '33.33' },
    }, WORKSPACE);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.limit).toBeCloseTo(49.99);
    expect(budget.threshold_warn).toBeCloseTo(0.3333);
  });

  test('100% warning threshold', () => {
    initializeRegistries({
      agents: [{ id: 'main', name: 'NoWarn' }],
      budget: { monthlyLimit: '500', thresholdWarn: '100' },
    }, WORKSPACE);

    const budget = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'BUDGET.json'), 'utf-8'));
    expect(budget.threshold_warn).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. HITL Sensitivity Levels
// ═══════════════════════════════════════════════════════════════════════════════

describe('HITL sensitivity levels', () => {
  const baseAgents = [
    { id: 'main', role: 'Orchestrator' },
    { id: 'dev', role: 'Engineer' },
    { id: 'vigil', role: 'Security Monitor' },
  ];

  test.each([
    [0.3, 0.1, 'ultra-strict'],
    [0.5, 0.3, 'strict'],
    [0.7, 0.5, 'moderate'],
    [0.9, 0.7, 'relaxed'],
    [1.0, 0.8, 'fully-auto'],
  ])('sensitivity %f → auto_approve_below %f (%s)', (sensitivity, expectedAutoApprove, _label) => {
    initializeHitlPolicy({
      agents: baseAgents,
      ops: { hitlSensitivity: sensitivity },
    }, WORKSPACE);

    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(policy.global_threshold).toBe(sensitivity);
    expect(policy.auto_approve_below).toBeCloseTo(expectedAutoApprove);

    // Vigil always gets override (role includes "security")
    expect(policy.agent_overrides.vigil).toBeDefined();
    expect(policy.agent_overrides.vigil.threshold).toBe(0.5);

    // Non-security agents don't get override
    expect(policy.agent_overrides.dev).toBeUndefined();
    expect(policy.agent_overrides.main).toBeUndefined();
  });

  test('team with multiple security-related agents', () => {
    initializeHitlPolicy({
      agents: [
        { id: 'main', role: 'Orchestrator' },
        { id: 'vigil', role: 'Vigilance Monitor' },
        { id: 'sec', role: 'Security Analyst' },
        { id: 'pen', role: 'Security Penetration Tester' },
        { id: 'dev', role: 'Backend Developer' },
      ],
      ops: { hitlSensitivity: 0.7 },
    }, WORKSPACE);

    const policy = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'HITL_POLICY.json'), 'utf-8'));
    expect(Object.keys(policy.agent_overrides)).toEqual(
      expect.arrayContaining(['vigil', 'sec', 'pen'])
    );
    expect(policy.agent_overrides.dev).toBeUndefined();
    expect(policy.agent_overrides.main).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Paperclip Connectivity Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('Paperclip connectivity scenarios', () => {
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('Paperclip offline — workspace setup still works', async () => {
    globalThis.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });

    const config = {
      teamName: 'Offline Team',
      agents: [
        { id: 'main', name: 'Solo', role: 'Orchestrator' },
        { id: 'dev', name: 'Dev', role: 'Engineer' },
      ],
      budget: { monthlyLimit: '300', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: true },
      starterProject: {
        name: 'Offline Project',
        description: 'Test offline',
        tasks: [{ id: 't1', title: 'Task 1', assigned_to: 'dev' }],
      },
    };

    // Workspace setup should work fine
    fullSetup(config, WORKSPACE);

    // All files created
    expect(fs.existsSync(path.join(WORKSPACE, 'TASKS.json'))).toBe(true);
    expect(fs.existsSync(path.join(WORKSPACE, 'BUDGET.json'))).toBe(true);
    expect(fs.existsSync(path.join(WORKSPACE, 'AGENT_STATUS.json'))).toBe(true);

    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    expect(tasks).toHaveLength(1);

    // Paperclip sync should fail gracefully
    const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
    const bridge = new PaperclipBridge('http://127.0.0.1:3100');
    await expect(bridge.waitForReady(500)).rejects.toThrow('Paperclip not ready');
  });

  test('Paperclip slow startup — retries then succeeds', async () => {
    let attempt = 0;
    fetchCalls = [];
    globalThis.fetch = jest.fn(async (url, opts) => {
      fetchCalls.push({ url, opts });
      attempt++;
      if (url.includes('/api/health')) {
        if (attempt <= 3) throw new Error('ECONNREFUSED');
        return mockResponse({ status: 'ok' });
      }
      return mockResponse({ error: 'unknown' }, { ok: false, status: 404 });
    });

    const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
    const bridge = new PaperclipBridge('http://127.0.0.1:3100');
    const ready = await bridge.waitForReady(15000);
    expect(ready).toBe(true);
    expect(attempt).toBe(4);
  });

  test('Paperclip returns 500 on company creation', async () => {
    fetchCalls = [];
    globalThis.fetch = jest.fn(async (url, opts) => {
      fetchCalls.push({ url, opts });
      if (url.includes('/api/health')) return mockResponse({ status: 'ok' });
      if (url.includes('/api/companies') && opts?.method === 'POST') {
        return mockResponse({ error: 'internal error' }, { ok: false, status: 500 });
      }
      return mockResponse({});
    });

    const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
    const bridge = new PaperclipBridge('http://127.0.0.1:3100');
    await bridge.waitForReady(5000);
    await expect(bridge.createCompany('Test')).rejects.toThrow('Failed to create company: 500');
  });

  test('Paperclip agent quota exceeded mid-sync', async () => {
    let agentCount = 0;
    fetchCalls = [];
    globalThis.fetch = jest.fn(async (url, opts) => {
      fetchCalls.push({ url, opts });
      const method = opts?.method || 'GET';
      if (url.includes('/api/health')) return mockResponse({ status: 'ok' });
      if (url.endsWith('/api/companies') && method === 'POST') {
        return mockResponse({ id: 'comp-1', name: 'X' });
      }
      if (url.includes('/agents') && method === 'POST') {
        agentCount++;
        if (agentCount > 3) {
          return mockResponse({ error: 'Agent quota exceeded' }, { ok: false, status: 429 });
        }
        return mockResponse({ id: `a-${agentCount}`, name: 'Agent', role: 'engineer' });
      }
      return mockResponse({});
    });

    const { PaperclipBridge } = await import('../server/paperclip-bridge.js');
    const bridge = new PaperclipBridge('http://127.0.0.1:3100');
    await bridge.waitForReady(5000);

    await expect(bridge.syncTeam({
      teamName: 'Quota Test',
      agents: [
        { id: 'a', name: 'A', role: 'ceo' },
        { id: 'b', name: 'B', role: 'engineer' },
        { id: 'c', name: 'C', role: 'engineer' },
        { id: 'd', name: 'D', role: 'engineer' },  // This one should fail (4th agent)
        { id: 'e', name: 'E', role: 'engineer' },
      ],
    })).rejects.toThrow('Failed to create agent "D": 429');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Org Chart Hierarchy Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('Org chart hierarchy', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('CEO at middle of agent list gets moved to front', async () => {
    const config = {
      teamName: 'Reorder Test',
      agents: [
        { id: 'dev1', name: 'Dev1', role: 'Backend Developer' },
        { id: 'dev2', name: 'Dev2', role: 'Frontend Developer' },
        { id: 'main', name: 'Boss', role: 'Lead Orchestrator' },
        { id: 'qa', name: 'Tester', role: 'QA Engineer' },
      ],
    };

    const result = await syncToPaperclipMock(config);

    // Boss should be created first
    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(JSON.parse(createCalls[0].opts.body).name).toBe('Boss');
    expect(JSON.parse(createCalls[0].opts.body).role).toBe('ceo');

    // 3 non-CEO agents report to CEO
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(3);
    for (const call of patchCalls) {
      expect(JSON.parse(call.opts.body).reportsTo).toBe('agent-1');
    }
  });

  test('CEO at last position still works', async () => {
    const config = {
      teamName: 'Last CEO',
      agents: [
        { id: 'a', name: 'A', role: 'Engineer' },
        { id: 'b', name: 'B', role: 'Designer' },
        { id: 'c', name: 'C', role: 'Lead Orchestrator' },
      ],
    };

    const result = await syncToPaperclipMock(config);

    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(JSON.parse(createCalls[0].opts.body).name).toBe('C');
    expect(JSON.parse(createCalls[0].opts.body).role).toBe('ceo');
  });

  test('no explicit CEO — first agent becomes root', async () => {
    const config = {
      teamName: 'Flat Team',
      agents: [
        { id: 'a', name: 'Alpha', role: 'Engineer' },
        { id: 'b', name: 'Beta', role: 'Designer' },
      ],
    };

    const result = await syncToPaperclipMock(config);

    // Alpha is root (first agent), Beta reports to Alpha
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(1);
    expect(JSON.parse(patchCalls[0].opts.body).reportsTo).toBe('agent-1');
  });

  test('multiple CEO-like roles — first one wins', async () => {
    const config = {
      teamName: 'Two Bosses',
      agents: [
        { id: 'a', name: 'Dev', role: 'Engineer' },
        { id: 'b', name: 'CEO1', role: 'CEO & Founder' },
        { id: 'c', name: 'CEO2', role: 'Lead Orchestrator' },
      ],
    };

    const result = await syncToPaperclipMock(config);

    // First CEO found (CEO1) becomes root
    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(JSON.parse(createCalls[0].opts.body).name).toBe('CEO1');

    // CEO2 and Dev both report to CEO1
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Workspace File Integrity
// ═══════════════════════════════════════════════════════════════════════════════

describe('Workspace file integrity', () => {
  test('all JSON files are valid parseable JSON', () => {
    const config = {
      teamName: 'Integrity Test',
      agents: [
        { id: 'main', name: 'Cooper', role: 'Orchestrator' },
        { id: 'dev', name: 'Dev', role: 'Engineer' },
      ],
      budget: { monthlyLimit: '750', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: true },
      starterProject: {
        name: 'Test Project',
        description: 'Integrity test',
        tasks: [{ id: 't1', title: 'Test task', assigned_to: 'dev' }],
      },
    };

    fullSetup(config, WORKSPACE);

    const jsonFiles = [
      'TASKS.json', 'PROJECTS.json', 'BUDGET.json', 'OKRs.json',
      'VELOCITY.json', 'AGENT_STATUS.json', 'AGENT_PERFORMANCE.json',
      'HITL_POLICY.json', 'comms/channels/team-wide.json',
    ];

    for (const f of jsonFiles) {
      const filePath = path.join(WORKSPACE, f);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });

  test('agent IDs are consistent across all workspace files', () => {
    const agents = [
      { id: 'main', name: 'Cooper', role: 'Orchestrator' },
      { id: 'forge', name: 'Forge', role: 'Engineer' },
      { id: 'vigil', name: 'Vigil', role: 'Security Monitor' },
    ];

    const config = {
      teamName: 'Consistency Test',
      agents,
      budget: { monthlyLimit: '500', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: false },
    };

    fullSetup(config, WORKSPACE);

    const agentIds = new Set(agents.map(a => a.id));

    // AGENT_STATUS.json
    const status = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), 'utf-8'));
    expect(new Set(Object.keys(status))).toEqual(agentIds);

    // AGENT_PERFORMANCE.json
    const perf = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'AGENT_PERFORMANCE.json'), 'utf-8'));
    expect(new Set(Object.keys(perf))).toEqual(agentIds);

    // Comms channel
    const comms = JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'comms', 'channels', 'team-wide.json'), 'utf-8'
    ));
    expect(new Set(comms.members)).toEqual(agentIds);
  });

  test('starter project tasks reference the correct project ID', () => {
    const config = {
      teamName: 'Project Ref Test',
      agents: [{ id: 'main', name: 'A' }, { id: 'dev', name: 'B' }],
      budget: { monthlyLimit: '100', thresholdWarn: '80' },
      ops: { activeCrons: [], hitlSensitivity: 0.7 },
      project: { createProject: true },
      starterProject: {
        name: 'MVP',
        description: 'Build it',
        tasks: [
          { id: 't1', title: 'Task 1', assigned_to: 'main' },
          { id: 't2', title: 'Task 2', assigned_to: 'dev' },
        ],
      },
    };

    fullSetup(config, WORKSPACE);

    const projects = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'PROJECTS.json'), 'utf-8'));
    expect(projects.items[0].id).toBe('starter-p1');

    const tasks = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'TASKS.json'), 'utf-8'));
    for (const task of tasks) {
      expect(task.project_id).toBe('starter-p1');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
      expect(task.created_at).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Industry Blueprint Coverage (all 14+ blueprints)
// ═══════════════════════════════════════════════════════════════════════════════

describe('All blueprints end-to-end', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('every blueprint produces a valid workspace and syncs to Paperclip', async () => {
    for (const [bpId, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `agi-bp-e2e-${bpId}-`));
      try {
        const config = {
          teamName: `${bp.name} Team`,
          blueprintId: bpId,
          agents: bp.agents,
          intel: { domain: bp.industry },
          budget: { monthlyLimit: '1000', thresholdWarn: '80' },
          ops: { activeCrons: [], hitlSensitivity: bp.hitlPolicy?.threshold || 0.7 },
          project: { createProject: true },
          starterProject: bp.starterProject,
        };

        // Setup workspace
        fullSetup(config, tmpDir);

        // Verify workspace
        const status = JSON.parse(fs.readFileSync(path.join(tmpDir, 'AGENT_STATUS.json'), 'utf-8'));
        expect(Object.keys(status).length).toBe(bp.agents.length);

        const tasks = JSON.parse(fs.readFileSync(path.join(tmpDir, 'TASKS.json'), 'utf-8'));
        expect(tasks.length).toBe(bp.starterProject.tasks.length);

        // Sync to Paperclip
        agentCounter = 0; // Reset for each blueprint
        const result = await syncToPaperclipMock(config);
        expect(result.company).toBeDefined();
        expect(result.agents.length).toBe(bp.agents.length);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Role Mapping Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('Role mapping in sync context', () => {
  beforeEach(() => installPaperclipMock());
  afterEach(() => { jest.restoreAllMocks(); fetchCalls = []; });

  test('all blueprint agent roles map to valid Paperclip roles', async () => {
    const { mapAgiFarmRole } = await import('../server/paperclip-bridge.js');
    const validRoles = new Set(['ceo', 'cto', 'cmo', 'cfo', 'engineer', 'designer', 'pm', 'qa', 'devops', 'researcher', 'general']);

    for (const [bpId, bp] of Object.entries(TEAM_BLUEPRINTS)) {
      for (const agent of bp.agents) {
        const mapped = mapAgiFarmRole(agent.role);
        expect(validRoles.has(mapped)).toBe(true);
      }
    }
  });

  test('agents with descriptions but no roles still map correctly', async () => {
    const config = {
      teamName: 'Desc Team',
      agents: [
        { id: 'a', name: 'A', description: 'Lead Orchestrator and coordinator' },
        { id: 'b', name: 'B', description: 'Frontend design specialist' },
      ],
    };

    const result = await syncToPaperclipMock(config);
    expect(result.agents).toHaveLength(2);

    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    // First agent should use description for role mapping
    const firstBody = JSON.parse(createCalls[0].opts.body);
    expect(['ceo', 'designer', 'engineer']).toContain(firstBody.role);
  });
});
