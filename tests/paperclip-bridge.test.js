import { jest } from '@jest/globals';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock fetch Response. */
function mockResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

let fetchCalls = [];

/** Install a deterministic fetch mock that records calls and returns canned responses. */
function installFetch(handler) {
  fetchCalls = [];
  globalThis.fetch = jest.fn(async (url, opts) => {
    fetchCalls.push({ url, opts });
    return handler(url, opts);
  });
}

// ── Imports ──────────────────────────────────────────────────────────────────

let PaperclipBridge, mapAgiFarmRole;

beforeAll(async () => {
  const mod = await import('../server/paperclip-bridge.js');
  PaperclipBridge = mod.PaperclipBridge;
  mapAgiFarmRole = mod.mapAgiFarmRole;
});

afterEach(() => {
  jest.restoreAllMocks();
  fetchCalls = [];
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. mapAgiFarmRole — role mapping
// ═══════════════════════════════════════════════════════════════════════════════

describe('mapAgiFarmRole', () => {
  test.each([
    ['ceo', 'ceo'],
    ['cto', 'cto'],
    ['cmo', 'cmo'],
    ['cfo', 'cfo'],
    ['engineer', 'engineer'],
    ['designer', 'designer'],
    ['pm', 'pm'],
    ['qa', 'qa'],
    ['devops', 'devops'],
    ['researcher', 'researcher'],
    ['general', 'general'],
  ])('direct match: "%s" → "%s"', (input, expected) => {
    expect(mapAgiFarmRole(input)).toBe(expected);
  });

  test.each([
    ['Lead Orchestrator', 'ceo'],
    ['CEO & Founder', 'ceo'],
    ['lead architect', 'cto'],
    ['Vigilance Monitor', 'qa'],
    ['Security Analyst', 'qa'],
    ['QA Engineer', 'qa'],
    ['Test Runner', 'qa'],
    ['DevOps Engineer', 'devops'],
    ['Infrastructure Lead', 'devops'],
    ['Cloud Ops', 'devops'],
    ['Data Scientist', 'researcher'],
    ['Research Assistant', 'researcher'],
    ['Business Analyst', 'researcher'],
    ['UI Designer', 'designer'],
    ['UX Researcher', 'designer'],
    ['Product Manager', 'pm'],
    ['Project Lead', 'pm'],
    ['Marketing Director', 'cmo'],
    ['Growth Hacker', 'cmo'],
    ['Content Writer', 'cmo'],
    ['Financial Controller', 'cfo'],
    ['Budget Analyst', 'cfo'],
    ['Cost Optimizer', 'cfo'],
    ['Tech Lead', 'cto'],
    ['Chief Architect', 'cto'],
    ['CTO', 'cto'],
  ])('keyword match: "%s" → "%s"', (input, expected) => {
    expect(mapAgiFarmRole(input)).toBe(expected);
  });

  test('returns "general" for null/undefined', () => {
    expect(mapAgiFarmRole(null)).toBe('general');
    expect(mapAgiFarmRole(undefined)).toBe('general');
    expect(mapAgiFarmRole('')).toBe('general');
  });

  test('defaults to "engineer" for unrecognized roles', () => {
    expect(mapAgiFarmRole('Coordinator')).toBe('engineer');
    expect(mapAgiFarmRole('Helper Bot')).toBe('engineer');
    expect(mapAgiFarmRole('Agent Smith')).toBe('engineer');
  });

  test('is case-insensitive', () => {
    expect(mapAgiFarmRole('CEO')).toBe('ceo');
    expect(mapAgiFarmRole('ENGINEER')).toBe('engineer');
    expect(mapAgiFarmRole('DevOps')).toBe('devops');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PaperclipBridge constructor
// ═══════════════════════════════════════════════════════════════════════════════

describe('PaperclipBridge constructor', () => {
  test('uses default base URL', () => {
    const bridge = new PaperclipBridge();
    expect(bridge.getDashboardUrl()).toBe('http://127.0.0.1:3100');
  });

  test('accepts custom base URL', () => {
    const bridge = new PaperclipBridge('http://10.0.0.5:9090');
    expect(bridge.getDashboardUrl()).toBe('http://10.0.0.5:9090');
  });

  test('strips trailing slash', () => {
    const bridge = new PaperclipBridge('http://localhost:3100/');
    expect(bridge.getDashboardUrl()).toBe('http://localhost:3100');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. waitForReady
// ═══════════════════════════════════════════════════════════════════════════════

describe('waitForReady', () => {
  test('resolves immediately when server is healthy', async () => {
    installFetch(() => mockResponse({ status: 'ok' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.waitForReady(5000);
    expect(result).toBe(true);
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/health');
  });

  test('retries until server responds', async () => {
    let attempt = 0;
    installFetch(() => {
      attempt++;
      if (attempt < 3) throw new Error('ECONNREFUSED');
      return mockResponse({ status: 'ok' });
    });
    const bridge = new PaperclipBridge();
    const result = await bridge.waitForReady(10000);
    expect(result).toBe(true);
    expect(attempt).toBe(3);
  });

  test('throws after timeout', async () => {
    installFetch(() => { throw new Error('ECONNREFUSED'); });
    const bridge = new PaperclipBridge();
    await expect(bridge.waitForReady(800)).rejects.toThrow('Paperclip not ready after 800ms');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. createCompany
// ═══════════════════════════════════════════════════════════════════════════════

describe('createCompany', () => {
  test('sends correct POST and returns company', async () => {
    const fakeCompany = { id: 'comp-1', name: 'Acme' };
    installFetch(() => mockResponse(fakeCompany));

    const bridge = new PaperclipBridge();
    const result = await bridge.createCompany('Acme', 'Test company');

    expect(result).toEqual(fakeCompany);
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies');
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.name).toBe('Acme');
    expect(body.description).toBe('Test company');
  });

  test('uses default description when empty', async () => {
    installFetch(() => mockResponse({ id: 'c1', name: 'X' }));
    const bridge = new PaperclipBridge();
    await bridge.createCompany('X');
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.description).toBe('AGI Farm team: X');
  });

  test('throws on API error', async () => {
    installFetch(() => mockResponse({ error: 'conflict' }, { ok: false, status: 409 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.createCompany('X')).rejects.toThrow('Failed to create company: 409');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. createAgent
// ═══════════════════════════════════════════════════════════════════════════════

describe('createAgent', () => {
  test('maps role and sends correct payload', async () => {
    const fakeAgent = { id: 'a-1', name: 'Cooper', role: 'ceo' };
    installFetch(() => mockResponse(fakeAgent));

    const bridge = new PaperclipBridge();
    const result = await bridge.createAgent('comp-1', {
      name: 'Cooper',
      role: 'Lead Orchestrator',
      id: 'cooper',
      emoji: '🧠',
    });

    expect(result).toEqual(fakeAgent);
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.role).toBe('ceo');
    expect(body.title).toBe('🧠 Cooper');
    expect(body.adapterType).toBe('openclaw_gateway');
    expect(body.adapterConfig.clientId).toBe('cooper');
  });

  test('title omits emoji when not provided', async () => {
    installFetch(() => mockResponse({ id: 'a-2', name: 'Atlas' }));
    const bridge = new PaperclipBridge();
    await bridge.createAgent('comp-1', { name: 'Atlas', role: 'engineer', id: 'atlas' });
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.title).toBe('Atlas');
  });

  test('merges custom openclawConfig', async () => {
    installFetch(() => mockResponse({ id: 'a-3' }));
    const bridge = new PaperclipBridge();
    await bridge.createAgent('comp-1', { name: 'Bot', id: 'bot' }, {
      gatewayUrl: 'ws://custom:9999',
      extraKey: 'val',
    });
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.adapterConfig.url).toBe('ws://custom:9999');
    expect(body.adapterConfig.extraKey).toBe('val');
  });

  test('uses description for role when role is missing', async () => {
    installFetch(() => mockResponse({ id: 'a-4' }));
    const bridge = new PaperclipBridge();
    await bridge.createAgent('comp-1', { name: 'Watcher', description: 'Security monitor', id: 'w' });
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.role).toBe('qa'); // "Security" keyword → qa
  });

  test('throws on API error with agent name in message', async () => {
    installFetch(() => mockResponse({ error: 'bad' }, { ok: false, status: 400 }));
    const bridge = new PaperclipBridge();
    await expect(
      bridge.createAgent('comp-1', { name: 'Broken', id: 'b' })
    ).rejects.toThrow('Failed to create agent "Broken": 400');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. updateAgent
// ═══════════════════════════════════════════════════════════════════════════════

describe('updateAgent', () => {
  test('sends PATCH with correct payload', async () => {
    installFetch(() => mockResponse({ id: 'a-1', reportsTo: 'a-0' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.updateAgent('a-1', { reportsTo: 'a-0' });

    expect(result.reportsTo).toBe('a-0');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/agents/a-1');
    expect(fetchCalls[0].opts.method).toBe('PATCH');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse({ error: 'nope' }, { ok: false, status: 404 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.updateAgent('x', {})).rejects.toThrow('Failed to update agent x: 404');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. listCompanies / listAgents
// ═══════════════════════════════════════════════════════════════════════════════

describe('listCompanies', () => {
  test('returns array of companies', async () => {
    installFetch(() => mockResponse([{ id: 'c1' }, { id: 'c2' }]));
    const bridge = new PaperclipBridge();
    const result = await bridge.listCompanies();
    expect(result).toHaveLength(2);
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 500 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.listCompanies()).rejects.toThrow('Failed to list companies: 500');
  });
});

describe('listAgents', () => {
  test('calls correct URL', async () => {
    installFetch(() => mockResponse([]));
    const bridge = new PaperclipBridge();
    await bridge.listAgents('comp-1');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/agents');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. createIssue
// ═══════════════════════════════════════════════════════════════════════════════

describe('createIssue', () => {
  test('sends correct payload', async () => {
    installFetch(() => mockResponse({ id: 'iss-1' }));
    const bridge = new PaperclipBridge();
    await bridge.createIssue('comp-1', { title: 'Fix bug', priority: 'high' });
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.title).toBe('Fix bug');
    expect(body.priority).toBe('high');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/issues');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse({ error: 'x' }, { ok: false, status: 422 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.createIssue('c', {})).rejects.toThrow('Failed to create issue: 422');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. syncTeam — the main integration scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('syncTeam', () => {
  let agentCounter;

  function setupSyncFetch() {
    agentCounter = 0;
    installFetch((url, opts) => {
      const method = opts?.method || 'GET';

      // POST /api/companies
      if (url.includes('/api/companies') && method === 'POST' && !url.includes('/agents') && !url.includes('/issues')) {
        return mockResponse({ id: 'comp-new', name: 'Test' });
      }
      // POST /api/companies/:id/agents
      if (url.includes('/agents') && method === 'POST') {
        agentCounter++;
        const body = JSON.parse(opts.body);
        return mockResponse({ id: `agent-${agentCounter}`, name: body.name, role: body.role });
      }
      // PATCH /api/agents/:id
      if (url.includes('/api/agents/') && method === 'PATCH') {
        const body = JSON.parse(opts.body);
        const id = url.split('/api/agents/')[1];
        return mockResponse({ id, ...body });
      }
      // POST /api/companies/:id/issues
      if (url.includes('/issues') && method === 'POST') {
        return mockResponse({ id: 'iss-1' });
      }
      return mockResponse({ error: 'unknown' }, { ok: false, status: 404 });
    });
  }

  // ── Scenario A: Standard team with CEO + workers ──

  test('Scenario A: CEO + 2 workers — CEO is root, workers report to CEO', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    const result = await bridge.syncTeam({
      teamName: 'Alpha Team',
      blueprintId: 'startup',
      agents: [
        { name: 'Atlas', role: 'engineer', id: 'atlas' },
        { name: 'Cooper', role: 'Lead Orchestrator', id: 'cooper' },
        { name: 'Vigil', role: 'Vigilance Monitor', id: 'vigil' },
      ],
    });

    expect(result.company.id).toBe('comp-new');
    expect(result.agents).toHaveLength(3);

    // Cooper (CEO) should be created first (reordered to front)
    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    const firstCreated = JSON.parse(createCalls[0].opts.body);
    expect(firstCreated.name).toBe('Cooper');
    expect(firstCreated.role).toBe('ceo');

    // PATCH calls: Atlas and Vigil should report to agent-1 (Cooper)
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(2);
    for (const call of patchCalls) {
      const body = JSON.parse(call.opts.body);
      expect(body.reportsTo).toBe('agent-1'); // Cooper's ID
    }

    // Cooper should NOT get a PATCH (he's root)
    const patchedIds = patchCalls.map(c => c.url.split('/api/agents/')[1]);
    expect(patchedIds).not.toContain('agent-1');
    expect(patchedIds).toContain('agent-2');
    expect(patchedIds).toContain('agent-3');
  });

  // ── Scenario B: CEO already at index 0 — no reordering needed ──

  test('Scenario B: CEO already first — still works correctly', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    const result = await bridge.syncTeam({
      teamName: 'B Team',
      agents: [
        { name: 'Boss', role: 'ceo', id: 'boss' },
        { name: 'Dev', role: 'engineer', id: 'dev' },
      ],
    });

    expect(result.agents).toHaveLength(2);
    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(JSON.parse(createCalls[0].opts.body).name).toBe('Boss');

    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(1); // Only Dev gets patched
  });

  // ── Scenario C: No CEO — first agent becomes root ──

  test('Scenario C: no CEO role — first agent is root by default', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    const result = await bridge.syncTeam({
      teamName: 'Flat Team',
      agents: [
        { name: 'Alpha', role: 'engineer', id: 'alpha' },
        { name: 'Beta', role: 'designer', id: 'beta' },
        { name: 'Gamma', role: 'qa', id: 'gamma' },
      ],
    });

    expect(result.agents).toHaveLength(3);

    // Alpha (first) is root, Beta and Gamma report to Alpha
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(2);
    for (const call of patchCalls) {
      expect(JSON.parse(call.opts.body).reportsTo).toBe('agent-1');
    }
  });

  // ── Scenario D: Single agent — no PATCH calls needed ──

  test('Scenario D: single agent — no hierarchy PATCH calls', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    await bridge.syncTeam({
      teamName: 'Solo',
      agents: [{ name: 'Lone Wolf', role: 'engineer', id: 'lone' }],
    });

    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(0);
  });

  // ── Scenario E: Team with starter tasks ──

  test('Scenario E: team with starter tasks creates issues', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    await bridge.syncTeam({
      teamName: 'Task Team',
      agents: [{ name: 'Worker', role: 'engineer', id: 'w' }],
      project: { createProject: true },
      starterTasks: [
        { title: 'Setup CI', description: 'Configure pipelines', priority: 'high' },
        { title: 'Write tests', priority: 'medium' },
      ],
    });

    const issueCalls = fetchCalls.filter(c => c.url.includes('/issues') && c.opts?.method === 'POST');
    expect(issueCalls).toHaveLength(2);
    expect(JSON.parse(issueCalls[0].opts.body).title).toBe('Setup CI');
    expect(JSON.parse(issueCalls[1].opts.body).title).toBe('Write tests');
    expect(JSON.parse(issueCalls[1].opts.body).description).toBe('');
  });

  // ── Scenario F: Team without project flag — no issues created ──

  test('Scenario F: no project flag — skips issue creation', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    await bridge.syncTeam({
      teamName: 'No Tasks',
      agents: [{ name: 'A', role: 'engineer', id: 'a' }],
      starterTasks: [{ title: 'Should not appear' }],
    });

    const issueCalls = fetchCalls.filter(c => c.url.includes('/issues'));
    expect(issueCalls).toHaveLength(0);
  });

  // ── Scenario G: Large team (10 agents) ──

  test('Scenario G: large team — all 9 non-CEO agents report to CEO', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    const agents = [
      { name: 'Dev1', role: 'engineer', id: 'd1' },
      { name: 'Dev2', role: 'engineer', id: 'd2' },
      { name: 'QA1', role: 'qa', id: 'q1' },
      { name: 'QA2', role: 'qa', id: 'q2' },
      { name: 'Boss', role: 'ceo', id: 'boss' },
      { name: 'Designer', role: 'designer', id: 'des' },
      { name: 'PM', role: 'pm', id: 'pm' },
      { name: 'DevOps', role: 'devops', id: 'do' },
      { name: 'Researcher', role: 'researcher', id: 'r' },
      { name: 'CMO', role: 'cmo', id: 'cmo' },
    ];

    const result = await bridge.syncTeam({ teamName: 'Big Team', agents });

    expect(result.agents).toHaveLength(10);

    // Boss (CEO at index 4) should be reordered to first
    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(JSON.parse(createCalls[0].opts.body).name).toBe('Boss');

    // 9 non-CEO agents should get PATCH
    const patchCalls = fetchCalls.filter(c => c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(9);
    for (const call of patchCalls) {
      expect(JSON.parse(call.opts.body).reportsTo).toBe('agent-1');
    }
  });

  // ── Scenario H: Company description includes blueprint and domain ──

  test('Scenario H: company description includes blueprint and domain', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    await bridge.syncTeam({
      teamName: 'My Team',
      blueprintId: 'saas-startup',
      intel: { domain: 'FinTech' },
      agents: [{ name: 'A', role: 'engineer', id: 'a' }],
    });

    const companyCalls = fetchCalls.filter(
      c => c.url.endsWith('/api/companies') && c.opts?.method === 'POST'
    );
    const body = JSON.parse(companyCalls[0].opts.body);
    expect(body.description).toContain('saas-startup');
    expect(body.description).toContain('FinTech');
  });

  // ── Scenario I: Custom openclawConfig is forwarded ──

  test('Scenario I: custom openclawConfig passed to all agents', async () => {
    setupSyncFetch();
    const bridge = new PaperclipBridge();

    await bridge.syncTeam(
      {
        teamName: 'Custom',
        agents: [
          { name: 'A', role: 'engineer', id: 'a' },
          { name: 'B', role: 'ceo', id: 'b' },
        ],
      },
      { gatewayUrl: 'ws://remote:5555' }
    );

    const createCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    for (const call of createCalls) {
      const body = JSON.parse(call.opts.body);
      expect(body.adapterConfig.url).toBe('ws://remote:5555');
    }
  });

  // ── Scenario J: Agent creation failure mid-sync ──

  test('Scenario J: agent creation failure throws and stops', async () => {
    let count = 0;
    installFetch((url, opts) => {
      const method = opts?.method || 'GET';
      if (url.includes('/api/companies') && method === 'POST' && !url.includes('/agents')) {
        return mockResponse({ id: 'comp-fail', name: 'X' });
      }
      if (url.includes('/agents') && method === 'POST') {
        count++;
        if (count === 2) return mockResponse({ error: 'quota' }, { ok: false, status: 429 });
        return mockResponse({ id: `a-${count}`, name: 'ok', role: 'engineer' });
      }
      return mockResponse({});
    });

    const bridge = new PaperclipBridge();
    await expect(
      bridge.syncTeam({
        teamName: 'Fail Team',
        agents: [
          { name: 'A', id: 'a' },
          { name: 'B', id: 'b' },
          { name: 'C', id: 'c' },
        ],
      })
    ).rejects.toThrow('Failed to create agent "B": 429');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. createProject
// ═══════════════════════════════════════════════════════════════════════════════

describe('createProject', () => {
  test('sends correct POST and returns project', async () => {
    const fakeProject = { id: 'proj-1', name: 'MVP', status: 'active' };
    installFetch(() => mockResponse(fakeProject));

    const bridge = new PaperclipBridge();
    const result = await bridge.createProject('comp-1', {
      name: 'MVP',
      description: 'Build the MVP',
      leadAgentId: 'agent-1',
    });

    expect(result).toEqual(fakeProject);
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/projects');
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.name).toBe('MVP');
    expect(body.description).toBe('Build the MVP');
    expect(body.leadAgentId).toBe('agent-1');
    expect(body.status).toBe('planned');
  });

  test('uses defaults for optional fields', async () => {
    installFetch(() => mockResponse({ id: 'p1' }));
    const bridge = new PaperclipBridge();
    await bridge.createProject('comp-1', { name: 'X' });
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.description).toBe('');
    expect(body.status).toBe('planned');
  });

  test('throws on API error', async () => {
    installFetch(() => mockResponse({ error: 'bad' }, { ok: false, status: 422 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.createProject('c', { name: 'X' })).rejects.toThrow('Failed to create project "X": 422');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. listProjects
// ═══════════════════════════════════════════════════════════════════════════════

describe('listProjects', () => {
  test('returns array of projects', async () => {
    installFetch(() => mockResponse([{ id: 'p1' }, { id: 'p2' }]));
    const bridge = new PaperclipBridge();
    const result = await bridge.listProjects('comp-1');
    expect(result).toHaveLength(2);
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/projects');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 500 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.listProjects('c')).rejects.toThrow('Failed to list projects: 500');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. getProject / updateProject
// ═══════════════════════════════════════════════════════════════════════════════

describe('getProject', () => {
  test('returns project details', async () => {
    installFetch(() => mockResponse({ id: 'p1', name: 'MVP', status: 'active' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.getProject('p1');
    expect(result.name).toBe('MVP');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/projects/p1');
  });

  test('throws on not found', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 404 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.getProject('nope')).rejects.toThrow('Failed to get project nope: 404');
  });
});

describe('updateProject', () => {
  test('sends PATCH with correct payload', async () => {
    installFetch(() => mockResponse({ id: 'p1', status: 'completed' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.updateProject('p1', { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/projects/p1');
    expect(fetchCalls[0].opts.method).toBe('PATCH');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 400 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.updateProject('p1', {})).rejects.toThrow('Failed to update project p1: 400');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. listIssues with filters
// ═══════════════════════════════════════════════════════════════════════════════

describe('listIssues', () => {
  test('calls correct URL without filters', async () => {
    installFetch(() => mockResponse([]));
    const bridge = new PaperclipBridge();
    await bridge.listIssues('comp-1');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/issues');
  });

  test('applies query string filters', async () => {
    installFetch(() => mockResponse([]));
    const bridge = new PaperclipBridge();
    await bridge.listIssues('comp-1', { projectId: 'p1', status: 'todo' });
    expect(fetchCalls[0].url).toContain('projectId=p1');
    expect(fetchCalls[0].url).toContain('status=todo');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 500 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.listIssues('c')).rejects.toThrow('Failed to list issues: 500');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. getIssue / updateIssue
// ═══════════════════════════════════════════════════════════════════════════════

describe('getIssue', () => {
  test('returns issue details', async () => {
    installFetch(() => mockResponse({ id: 'iss-1', title: 'Fix bug', status: 'todo' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.getIssue('iss-1');
    expect(result.title).toBe('Fix bug');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/issues/iss-1');
  });
});

describe('updateIssue', () => {
  test('sends PATCH with correct payload', async () => {
    installFetch(() => mockResponse({ id: 'iss-1', status: 'done' }));
    const bridge = new PaperclipBridge();
    const result = await bridge.updateIssue('iss-1', { status: 'done' });
    expect(result.status).toBe('done');
    expect(fetchCalls[0].opts.method).toBe('PATCH');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/issues/iss-1');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 404 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.updateIssue('x', {})).rejects.toThrow('Failed to update issue x: 404');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15. addIssueComment
// ═══════════════════════════════════════════════════════════════════════════════

describe('addIssueComment', () => {
  test('sends correct POST', async () => {
    installFetch(() => mockResponse({ id: 'comment-1' }));
    const bridge = new PaperclipBridge();
    await bridge.addIssueComment('iss-1', 'Task completed', 'agent-1');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/issues/iss-1/comments');
    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.body).toBe('Task completed');
    expect(body.authorAgentId).toBe('agent-1');
  });

  test('throws on failure', async () => {
    installFetch(() => mockResponse(null, { ok: false, status: 500 }));
    const bridge = new PaperclipBridge();
    await expect(bridge.addIssueComment('x', 'test')).rejects.toThrow('Failed to add comment to issue x: 500');
  });
});
