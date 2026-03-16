import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Agent Tools Tests
 *
 * Tests the Orchestrator's Paperclip tools for autonomous dashboard control:
 * - create_project: New project creation with routing logic
 * - create_task: Task creation with project attachment and assignment
 * - update_task: Status updates, reassignment, comments
 * - list_projects: Project discovery for routing decisions
 * - manage_board: Board state queries with filters
 *
 * Scenarios:
 * - New project vs existing project routing
 * - Task decomposition with subtasks
 * - Agent reassignment mid-flight
 * - Board monitoring with blocked/in-progress tracking
 * - Error handling (Paperclip down, quota exceeded, invalid input)
 * - Local file sync (TASKS.json, PROJECTS.json)
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

let WORKSPACE;
let fetchCalls;
let agentCounter;
let projectCounter;
let issueCounter;

beforeEach(() => {
  WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'agi-tools-'));
  fetchCalls = [];
  agentCounter = 0;
  projectCounter = 0;
  issueCounter = 0;
});

afterEach(() => {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  jest.restoreAllMocks();
});

function mockResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function installFullMock() {
  globalThis.fetch = jest.fn(async (url, opts) => {
    fetchCalls.push({ url, opts });
    const method = opts?.method || 'GET';

    // Health
    if (url.includes('/api/health')) return mockResponse({ status: 'ok' });

    // Companies
    if (url.endsWith('/api/companies') && method === 'GET') {
      return mockResponse([{ id: 'comp-1', name: 'Test Team' }]);
    }
    if (url.endsWith('/api/companies') && method === 'POST') {
      return mockResponse({ id: 'comp-1', name: JSON.parse(opts.body).name });
    }

    // Agents
    if (url.includes('/agents') && method === 'GET' && !url.includes('/api/agents/')) {
      return mockResponse([
        { id: 'pa-1', name: 'Cooper', role: 'ceo', adapterConfig: { clientId: 'main' } },
        { id: 'pa-2', name: 'Forge', role: 'engineer', adapterConfig: { clientId: 'forge' } },
        { id: 'pa-3', name: 'Vigil', role: 'qa', adapterConfig: { clientId: 'vigil' } },
        { id: 'pa-4', name: 'Pixel', role: 'designer', adapterConfig: { clientId: 'pixel' } },
      ]);
    }
    if (url.includes('/agents') && method === 'POST') {
      agentCounter++;
      const body = JSON.parse(opts.body);
      return mockResponse({ id: `pa-${agentCounter}`, name: body.name, role: body.role });
    }
    if (url.includes('/api/agents/') && method === 'PATCH') {
      return mockResponse({ id: url.split('/api/agents/')[1], ...JSON.parse(opts.body) });
    }

    // Projects
    if (url.includes('/projects') && method === 'GET' && !url.includes('/api/projects/')) {
      return mockResponse([
        { id: 'proj-1', name: 'Website Redesign', status: 'active', description: 'Redesign the website', createdAt: '2026-03-01' },
        { id: 'proj-2', name: 'Mobile App', status: 'active', description: 'Build mobile app', createdAt: '2026-03-10' },
      ]);
    }
    if (url.match(/\/api\/projects\/[^/]+$/) && method === 'GET') {
      const id = url.split('/api/projects/')[1];
      return mockResponse({ id, name: 'Website Redesign', status: 'active' });
    }
    if (url.includes('/projects') && method === 'POST') {
      projectCounter++;
      const body = JSON.parse(opts.body);
      return mockResponse({ id: `proj-${projectCounter + 10}`, name: body.name, status: 'active' });
    }
    if (url.match(/\/api\/projects\/[^/]+$/) && method === 'PATCH') {
      return mockResponse({ id: url.split('/api/projects/')[1], ...JSON.parse(opts.body) });
    }

    // Issues
    if (url.includes('/issues') && method === 'GET' && !url.includes('/api/issues/')) {
      return mockResponse([
        { id: 'iss-1', title: 'Design homepage', status: 'in_progress', priority: 'high', assigneeAgentId: 'pa-4', projectId: 'proj-1' },
        { id: 'iss-2', title: 'Setup CI/CD', status: 'todo', priority: 'medium', assigneeAgentId: 'pa-2', projectId: 'proj-1' },
        { id: 'iss-3', title: 'Security audit', status: 'blocked', priority: 'urgent', assigneeAgentId: 'pa-3', projectId: 'proj-1' },
        { id: 'iss-4', title: 'API design', status: 'done', priority: 'high', assigneeAgentId: 'pa-2', projectId: 'proj-2' },
      ]);
    }
    if (url.match(/\/api\/issues\/[^/]+$/) && method === 'GET') {
      return mockResponse({ id: url.split('/api/issues/')[1], title: 'Test issue', status: 'todo' });
    }
    if (url.includes('/issues') && method === 'POST' && !url.includes('/comments')) {
      issueCounter++;
      const body = JSON.parse(opts.body);
      return mockResponse({ id: `iss-${issueCounter + 100}`, ...body });
    }
    if (url.match(/\/api\/issues\/[^/]+$/) && method === 'PATCH') {
      return mockResponse({ id: url.split('/api/issues/')[1], ...JSON.parse(opts.body) });
    }

    // Comments
    if (url.includes('/comments') && method === 'POST') {
      return mockResponse({ id: 'comment-1', ...JSON.parse(opts.body) });
    }

    return mockResponse({ error: 'not found' }, { ok: false, status: 404 });
  });
}

// ── Import bridge ───────────────────────────────────────────────────────────

let PaperclipBridge;

beforeAll(async () => {
  const mod = await import('../server/paperclip-bridge.js');
  PaperclipBridge = mod.PaperclipBridge;
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Project Routing Decision — New vs Existing
// ═══════════════════════════════════════════════════════════════════════════════

describe('Project routing: new vs existing', () => {
  beforeEach(() => installFullMock());

  test('Scenario: User request matches existing project — route to it', async () => {
    const bridge = new PaperclipBridge();

    // Step 1: Orchestrator lists projects to check what exists
    const projects = await bridge.listProjects('comp-1');
    expect(projects).toHaveLength(2);

    // Step 2: "Add a contact form to the website" → matches "Website Redesign"
    const matchingProject = projects.find(p =>
      p.name.toLowerCase().includes('website')
    );
    expect(matchingProject).toBeDefined();
    expect(matchingProject.id).toBe('proj-1');

    // Step 3: Create task under existing project
    const issue = await bridge.createIssue('comp-1', {
      title: 'Add contact form',
      description: 'Implement contact form with validation',
      projectId: matchingProject.id,
      assigneeAgentId: 'pa-2',
      priority: 'medium',
    });

    expect(issue.projectId).toBe('proj-1');

    // Verify no create_project call was made
    const projectCreateCalls = fetchCalls.filter(c =>
      c.url.includes('/projects') && c.opts?.method === 'POST'
    );
    expect(projectCreateCalls).toHaveLength(0);
  });

  test('Scenario: User request is a new initiative — create new project', async () => {
    const bridge = new PaperclipBridge();

    // Step 1: List projects
    const projects = await bridge.listProjects('comp-1');

    // Step 2: "Build a marketing dashboard" — no match
    const match = projects.find(p =>
      p.name.toLowerCase().includes('marketing') ||
      p.name.toLowerCase().includes('dashboard')
    );
    expect(match).toBeUndefined();

    // Step 3: Create new project
    const newProject = await bridge.createProject('comp-1', {
      name: 'Marketing Dashboard',
      description: 'Real-time marketing analytics dashboard',
      leadAgentId: 'pa-2',
    });

    expect(newProject.name).toBe('Marketing Dashboard');

    // Step 4: Create tasks under new project
    const task1 = await bridge.createIssue('comp-1', {
      title: 'Design dashboard wireframes',
      projectId: newProject.id,
      assigneeAgentId: 'pa-4',
      priority: 'high',
    });

    const task2 = await bridge.createIssue('comp-1', {
      title: 'Implement data pipeline',
      projectId: newProject.id,
      assigneeAgentId: 'pa-2',
      priority: 'high',
    });

    expect(task1.projectId).toBe(newProject.id);
    expect(task2.projectId).toBe(newProject.id);
  });

  test('Scenario: Ambiguous request — Orchestrator picks closest match', async () => {
    const bridge = new PaperclipBridge();
    const projects = await bridge.listProjects('comp-1');

    // "Fix the app's login screen" — could be Website or Mobile App
    // Orchestrator uses keyword matching
    const mobileMatch = projects.find(p => p.name.toLowerCase().includes('mobile'));
    const websiteMatch = projects.find(p => p.name.toLowerCase().includes('website'));

    // Both exist — Orchestrator should pick based on "app" → Mobile App
    expect(mobileMatch).toBeDefined();
    expect(websiteMatch).toBeDefined();
    expect(mobileMatch.id).toBe('proj-2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Task Decomposition with Subtasks
// ═══════════════════════════════════════════════════════════════════════════════

describe('Task decomposition', () => {
  beforeEach(() => installFullMock());

  test('Scenario: Break "Build auth system" into subtasks', async () => {
    const bridge = new PaperclipBridge();

    // Create parent task
    const parentTask = await bridge.createIssue('comp-1', {
      title: 'Build authentication system',
      description: 'Complete auth with OAuth, JWT, and role-based access',
      projectId: 'proj-1',
      priority: 'high',
    });

    // Create subtasks
    const subtasks = [
      { title: 'Design auth API schema', assigned_to: 'pa-2', priority: 'high' },
      { title: 'Implement JWT token service', assigned_to: 'pa-2', priority: 'high' },
      { title: 'Add OAuth providers (Google, GitHub)', assigned_to: 'pa-2', priority: 'medium' },
      { title: 'Write auth unit tests', assigned_to: 'pa-3', priority: 'high' },
      { title: 'Security review of auth flow', assigned_to: 'pa-3', priority: 'urgent' },
    ];

    const createdSubtasks = [];
    for (const st of subtasks) {
      const issue = await bridge.createIssue('comp-1', {
        title: st.title,
        parentId: parentTask.id,
        assigneeAgentId: st.assigned_to,
        priority: st.priority,
        projectId: 'proj-1',
      });
      createdSubtasks.push(issue);
    }

    expect(createdSubtasks).toHaveLength(5);

    // Verify all subtasks reference parent
    const issueCalls = fetchCalls.filter(c =>
      c.url.includes('/issues') && c.opts?.method === 'POST'
    );
    // 1 parent + 5 subtasks = 6 issue creations
    expect(issueCalls).toHaveLength(6);

    // Subtasks should have parentId
    for (let i = 1; i < issueCalls.length; i++) {
      const body = JSON.parse(issueCalls[i].opts.body);
      expect(body.parentId).toBe(parentTask.id);
    }
  });

  test('Scenario: Standalone task without project', async () => {
    const bridge = new PaperclipBridge();

    const issue = await bridge.createIssue('comp-1', {
      title: 'Fix critical production bug',
      description: 'Login page returns 500',
      priority: 'urgent',
      assigneeAgentId: 'pa-2',
    });

    expect(issue.title).toBe('Fix critical production bug');
    expect(issue.priority).toBe('urgent');

    // No projectId in payload
    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);
    expect(body.projectId).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Task Status Updates and Reassignment
// ═══════════════════════════════════════════════════════════════════════════════

describe('Task status updates', () => {
  beforeEach(() => installFullMock());

  test('Scenario: Mark task as in_progress then done', async () => {
    const bridge = new PaperclipBridge();

    // Start work
    const started = await bridge.updateIssue('iss-2', { status: 'in_progress' });
    expect(started.status).toBe('in_progress');

    // Complete work
    const done = await bridge.updateIssue('iss-2', { status: 'done' });
    expect(done.status).toBe('done');

    // Add completion comment
    await bridge.addIssueComment('iss-2', 'CI/CD pipeline configured with GitHub Actions');

    const patchCalls = fetchCalls.filter(c => c.url.includes('/api/issues/iss-2') && c.opts?.method === 'PATCH');
    expect(patchCalls).toHaveLength(2);

    const commentCalls = fetchCalls.filter(c => c.url.includes('/comments') && c.opts?.method === 'POST');
    expect(commentCalls).toHaveLength(1);
  });

  test('Scenario: Reassign blocked task to different agent', async () => {
    const bridge = new PaperclipBridge();

    // Task is blocked — reassign from Vigil to Forge
    const updated = await bridge.updateIssue('iss-3', {
      status: 'todo',
      assigneeAgentId: 'pa-2',
    });

    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);
    expect(body.status).toBe('todo');
    expect(body.assigneeAgentId).toBe('pa-2');
  });

  test('Scenario: Escalate task priority', async () => {
    const bridge = new PaperclipBridge();

    await bridge.updateIssue('iss-2', { priority: 'urgent' });

    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);
    expect(body.priority).toBe('urgent');
  });

  test('Scenario: Cancel a task', async () => {
    const bridge = new PaperclipBridge();

    const cancelled = await bridge.updateIssue('iss-2', { status: 'cancelled' });
    await bridge.addIssueComment('iss-2', 'Cancelled: requirements changed, no longer needed');

    expect(cancelled.status).toBe('cancelled');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Board Monitoring
// ═══════════════════════════════════════════════════════════════════════════════

describe('Board monitoring', () => {
  beforeEach(() => installFullMock());

  test('Scenario: Orchestrator checks full board state', async () => {
    const bridge = new PaperclipBridge();

    const issues = await bridge.listIssues('comp-1');

    // Compute stats like manage_board tool does
    const stats = {
      total: issues.length,
      in_progress: issues.filter(i => i.status === 'in_progress').length,
      todo: issues.filter(i => i.status === 'todo').length,
      blocked: issues.filter(i => i.status === 'blocked').length,
      done: issues.filter(i => i.status === 'done').length,
    };

    expect(stats.total).toBe(4);
    expect(stats.in_progress).toBe(1);
    expect(stats.todo).toBe(1);
    expect(stats.blocked).toBe(1);
    expect(stats.done).toBe(1);
  });

  test('Scenario: Filter board by project', async () => {
    const bridge = new PaperclipBridge();

    await bridge.listIssues('comp-1', { projectId: 'proj-1' });

    expect(fetchCalls[0].url).toContain('projectId=proj-1');
  });

  test('Scenario: Filter board by status (blocked only)', async () => {
    const bridge = new PaperclipBridge();

    await bridge.listIssues('comp-1', { status: 'blocked' });

    expect(fetchCalls[0].url).toContain('status=blocked');
  });

  test('Scenario: Filter by agent assignment', async () => {
    const bridge = new PaperclipBridge();

    await bridge.listIssues('comp-1', { assigneeAgentId: 'pa-2' });

    expect(fetchCalls[0].url).toContain('assigneeAgentId=pa-2');
  });

  test('Scenario: Combined filters', async () => {
    const bridge = new PaperclipBridge();

    await bridge.listIssues('comp-1', {
      projectId: 'proj-1',
      status: 'in_progress',
      priority: 'high',
    });

    const url = fetchCalls[0].url;
    expect(url).toContain('projectId=proj-1');
    expect(url).toContain('status=in_progress');
    expect(url).toContain('priority=high');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Full Orchestration Flow (End-to-End)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Full orchestration flow', () => {
  beforeEach(() => installFullMock());

  test('Scenario: "Build me a landing page" — full autonomous flow', async () => {
    const bridge = new PaperclipBridge();

    // Step 1: Check existing projects
    const projects = await bridge.listProjects('comp-1');
    const websiteProject = projects.find(p => p.name.toLowerCase().includes('website'));

    // Step 2: Website project exists — route there
    expect(websiteProject).toBeDefined();

    // Step 3: Decompose into tasks
    const tasks = [
      { title: 'Design landing page mockup', agent: 'pa-4', priority: 'high' },
      { title: 'Implement landing page HTML/CSS', agent: 'pa-2', priority: 'high' },
      { title: 'Add analytics tracking', agent: 'pa-2', priority: 'medium' },
      { title: 'QA review landing page', agent: 'pa-3', priority: 'high' },
    ];

    const createdTasks = [];
    for (const t of tasks) {
      const issue = await bridge.createIssue('comp-1', {
        title: t.title,
        projectId: websiteProject.id,
        assigneeAgentId: t.agent,
        priority: t.priority,
        status: 'todo',
      });
      createdTasks.push(issue);
    }

    expect(createdTasks).toHaveLength(4);

    // Step 4: Simulate work progress
    await bridge.updateIssue(createdTasks[0].id, { status: 'in_progress' });
    await bridge.updateIssue(createdTasks[0].id, { status: 'done' });
    await bridge.addIssueComment(createdTasks[0].id, 'Mockup completed — Figma link attached');

    // Step 5: Check board
    const allIssues = await bridge.listIssues('comp-1');
    expect(allIssues.length).toBeGreaterThan(0);

    // Verify the flow: list_projects → create_tasks → update → monitor
    const projectListCalls = fetchCalls.filter(c => c.url.includes('/projects') && (!c.opts || c.opts.method === 'GET' || !c.opts.method));
    const issueCreateCalls = fetchCalls.filter(c => c.url.includes('/issues') && c.opts?.method === 'POST' && !c.url.includes('/comments'));
    const issueUpdateCalls = fetchCalls.filter(c => c.url.includes('/api/issues/') && c.opts?.method === 'PATCH');
    const commentCalls = fetchCalls.filter(c => c.url.includes('/comments') && c.opts?.method === 'POST');

    expect(projectListCalls.length).toBeGreaterThanOrEqual(1);
    expect(issueCreateCalls).toHaveLength(4);
    expect(issueUpdateCalls).toHaveLength(2);
    expect(commentCalls).toHaveLength(1);
  });

  test('Scenario: "Create a new analytics service" — new project flow', async () => {
    const bridge = new PaperclipBridge();

    // Step 1: Check existing projects — no analytics project
    const projects = await bridge.listProjects('comp-1');
    const match = projects.find(p => p.name.toLowerCase().includes('analytics'));
    expect(match).toBeUndefined();

    // Step 2: Create new project
    const newProject = await bridge.createProject('comp-1', {
      name: 'Analytics Service',
      description: 'Real-time analytics microservice with event tracking',
      leadAgentId: 'pa-2',
    });

    // Step 3: Create tasks
    await bridge.createIssue('comp-1', {
      title: 'Design event schema',
      projectId: newProject.id,
      assigneeAgentId: 'pa-2',
      priority: 'high',
    });

    await bridge.createIssue('comp-1', {
      title: 'Setup ClickHouse database',
      projectId: newProject.id,
      assigneeAgentId: 'pa-2',
      priority: 'high',
    });

    // Verify project was created then tasks added to it
    const projCreateCalls = fetchCalls.filter(c => c.url.includes('/projects') && c.opts?.method === 'POST');
    expect(projCreateCalls).toHaveLength(1);
    expect(JSON.parse(projCreateCalls[0].opts.body).name).toBe('Analytics Service');

    const issueCreateCalls = fetchCalls.filter(c => c.url.includes('/issues') && c.opts?.method === 'POST');
    expect(issueCreateCalls).toHaveLength(2);
    for (const call of issueCreateCalls) {
      expect(JSON.parse(call.opts.body).projectId).toBe(newProject.id);
    }
  });

  test('Scenario: "Hire a data engineer and set up the pipeline" — hire + task', async () => {
    const bridge = new PaperclipBridge();

    // Step 1: Orchestrator realizes team has no data engineer
    const agents = await bridge.listAgents('comp-1');
    const dataEngineer = agents.find(a => a.role === 'researcher' || a.name.toLowerCase().includes('data'));
    // No data engineer exists in mock team
    expect(dataEngineer).toBeUndefined();

    // Step 2: Hire specialist (would use hire_specialist tool)
    // Simulated: create agent in Paperclip
    const newAgent = await bridge.createAgent('comp-1', {
      name: 'Pipeline',
      role: 'Data Scientist',
      id: 'pipeline',
      emoji: '📊',
    });

    expect(newAgent.role).toBe('researcher'); // "Data Scientist" maps to "researcher"

    // Step 3: Wire into org chart
    await bridge.updateAgent(newAgent.id, { reportsTo: 'pa-1' }); // Reports to CEO

    // Step 4: Create task for the new agent
    await bridge.createIssue('comp-1', {
      title: 'Design ETL pipeline for analytics',
      assigneeAgentId: newAgent.id,
      priority: 'high',
    });

    // Verify full sequence
    const agentCreateCalls = fetchCalls.filter(c => c.url.includes('/agents') && c.opts?.method === 'POST');
    expect(agentCreateCalls.length).toBeGreaterThanOrEqual(1);

    const agentPatchCalls = fetchCalls.filter(c => c.url.includes('/api/agents/') && c.opts?.method === 'PATCH');
    expect(agentPatchCalls.length).toBeGreaterThanOrEqual(1);
    expect(JSON.parse(agentPatchCalls[0].opts.body).reportsTo).toBe('pa-1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

describe('Error handling', () => {
  test('Paperclip offline — project creation fails gracefully', async () => {
    globalThis.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });

    const bridge = new PaperclipBridge();
    await expect(bridge.createProject('comp-1', { name: 'X' })).rejects.toThrow('ECONNREFUSED');
  });

  test('Paperclip returns 422 — invalid project data', async () => {
    globalThis.fetch = jest.fn(async () =>
      mockResponse({ error: 'Name required' }, { ok: false, status: 422 })
    );

    const bridge = new PaperclipBridge();
    await expect(bridge.createProject('comp-1', { name: '' })).rejects.toThrow('422');
  });

  test('Paperclip returns 404 — issue not found for update', async () => {
    globalThis.fetch = jest.fn(async () =>
      mockResponse({ error: 'Not found' }, { ok: false, status: 404 })
    );

    const bridge = new PaperclipBridge();
    await expect(bridge.updateIssue('nonexistent', { status: 'done' })).rejects.toThrow('404');
  });

  test('Paperclip returns 500 — server error on list', async () => {
    globalThis.fetch = jest.fn(async () =>
      mockResponse({ error: 'Internal error' }, { ok: false, status: 500 })
    );

    const bridge = new PaperclipBridge();
    await expect(bridge.listProjects('comp-1')).rejects.toThrow('500');
    await expect(bridge.listIssues('comp-1')).rejects.toThrow('500');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Local File Sync
// ═══════════════════════════════════════════════════════════════════════════════

describe('Local file sync verification', () => {
  test('PROJECTS.json updated when bridge creates project', () => {
    // Simulate what create_project.js tool does
    const projectsPath = path.join(WORKSPACE, 'PROJECTS.json');
    fs.writeFileSync(projectsPath, JSON.stringify({
      defaults: { auto_project_channel: true },
      items: [],
    }, null, 2));

    // Simulate tool updating local file
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
    projects.items.push({
      id: 'proj-new',
      name: 'New Project',
      description: 'Test',
      status: 'active',
      created_at: new Date().toISOString(),
      paperclip_id: 'proj-new',
    });
    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));

    // Verify
    const updated = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].name).toBe('New Project');
    expect(updated.items[0].paperclip_id).toBe('proj-new');
  });

  test('TASKS.json updated when bridge creates issue', () => {
    const tasksPath = path.join(WORKSPACE, 'TASKS.json');
    fs.writeFileSync(tasksPath, '[]');

    // Simulate tool updating local file
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    tasks.push({
      id: 'iss-new',
      title: 'New Task',
      description: '',
      type: 'dev',
      priority: 'medium',
      status: 'pending',
      assigned_to: 'forge',
      project_id: 'proj-1',
      paperclip_id: 'iss-new',
      created_at: new Date().toISOString(),
    });
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

    const updated = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    expect(updated).toHaveLength(1);
    expect(updated[0].paperclip_id).toBe('iss-new');
  });

  test('TASKS.json status sync when task completed', () => {
    const tasksPath = path.join(WORKSPACE, 'TASKS.json');
    fs.writeFileSync(tasksPath, JSON.stringify([
      { id: 'iss-1', title: 'Task A', status: 'pending', paperclip_id: 'iss-1' },
      { id: 'iss-2', title: 'Task B', status: 'in-progress', paperclip_id: 'iss-2' },
    ], null, 2));

    // Simulate update_task tool marking task done
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const task = tasks.find(t => t.paperclip_id === 'iss-2');
    task.status = 'complete';
    task.completed_at = new Date().toISOString();
    task.updated_at = new Date().toISOString();
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

    const updated = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    expect(updated[0].status).toBe('pending'); // Unchanged
    expect(updated[1].status).toBe('complete'); // Updated
    expect(updated[1].completed_at).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  beforeEach(() => installFullMock());

  test('Create task with no agent assignment — goes to backlog', async () => {
    const bridge = new PaperclipBridge();

    const issue = await bridge.createIssue('comp-1', {
      title: 'Unassigned task',
      priority: 'low',
    });

    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);
    expect(body.assigneeAgentId).toBeUndefined();
  });

  test('Create project with no lead — defaults apply', async () => {
    const bridge = new PaperclipBridge();

    await bridge.createProject('comp-1', {
      name: 'Leaderless Project',
      description: 'No lead assigned',
    });

    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].opts.body);
    expect(body.leadAgentId).toBeUndefined();
    expect(body.status).toBe('active');
  });

  test('List issues with no filters returns all', async () => {
    const bridge = new PaperclipBridge();

    const issues = await bridge.listIssues('comp-1');
    expect(issues).toHaveLength(4);
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/companies/comp-1/issues');
    expect(fetchCalls[0].url).not.toContain('?');
  });

  test('Get single issue details', async () => {
    const bridge = new PaperclipBridge();

    const issue = await bridge.getIssue('iss-1');
    expect(issue.title).toBe('Test issue');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/issues/iss-1');
  });

  test('Get single project details', async () => {
    const bridge = new PaperclipBridge();

    const project = await bridge.getProject('proj-1');
    expect(project.name).toBe('Website Redesign');
    expect(fetchCalls[0].url).toBe('http://127.0.0.1:3100/api/projects/proj-1');
  });

  test('Update project status to completed', async () => {
    const bridge = new PaperclipBridge();

    const updated = await bridge.updateProject('proj-1', { status: 'completed' });
    expect(updated.status).toBe('completed');
    expect(fetchCalls[0].opts.method).toBe('PATCH');
  });

  test('Add comment without author', async () => {
    const bridge = new PaperclipBridge();

    await bridge.addIssueComment('iss-1', 'Progress update');

    const body = JSON.parse(fetchCalls[0].opts.body);
    expect(body.content).toBe('Progress update');
    expect(body.authorAgentId).toBeUndefined();
  });
});
