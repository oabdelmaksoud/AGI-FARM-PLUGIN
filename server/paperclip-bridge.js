/**
 * Paperclip Bridge — Maps AGI Farm concepts to Paperclip REST API.
 *
 * Provides helpers for:
 * - Creating companies (teams) and agents
 * - Syncing AGI Farm workspace data into Paperclip
 * - Querying Paperclip for dashboard state
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:3100';

const PAPERCLIP_ROLES = [
  'ceo', 'cto', 'cmo', 'cfo', 'engineer', 'designer',
  'pm', 'qa', 'devops', 'researcher', 'general',
];

function mapAgiFarmRole(role) {
  if (!role) return 'general';
  const lower = role.toLowerCase();
  // Direct match
  const direct = PAPERCLIP_ROLES.find(r => lower === r);
  if (direct) return direct;
  // Domain-specific keywords checked BEFORE generic ones like "lead"
  if (lower.includes('devops') || lower.includes('infra') || lower.includes('ops')) return 'devops';
  if (lower.includes('secur') || lower.includes('qa') || lower.includes('test') || lower.includes('vigil')) return 'qa';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return 'designer';
  if (lower.includes('product') || lower.includes('project') || lower.includes('manag')) return 'pm';
  if (lower.includes('market') || lower.includes('growth') || lower.includes('content')) return 'cmo';
  if (lower.includes('financ') || lower.includes('budget') || lower.includes('cost')) return 'cfo';
  if (lower.includes('tech') || lower.includes('architect') || lower.includes('cto')) return 'cto';
  if (lower.includes('research') || lower.includes('data') || lower.includes('analys')) return 'researcher';
  // Generic leadership keywords last — only match if no domain keyword matched
  if (lower.includes('orchestrat') || lower.includes('lead') || lower.includes('ceo')) return 'ceo';
  // Default: most agents are engineers
  return 'engineer';
}

/**
 * Paperclip API client for AGI Farm integration.
 */
export class PaperclipBridge {
  #baseUrl;

  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Wait until Paperclip server is healthy (up to timeoutMs).
   */
  async waitForReady(timeoutMs = 30_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(`${this.#baseUrl}/api/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) return true;
      } catch {
        // not ready yet
      }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`Paperclip not ready after ${timeoutMs}ms`);
  }

  /**
   * Create a Paperclip company from AGI Farm team config.
   * @returns {Promise<{id: string, name: string}>}
   */
  async createCompany(teamName, description = '') {
    const res = await fetch(`${this.#baseUrl}/api/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: teamName,
        description: description || `AGI Farm team: ${teamName}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create company: ${res.status} ${body}`);
    }

    return res.json();
  }

  /**
   * List all companies.
   * @returns {Promise<Array>}
   */
  async listCompanies() {
    const res = await fetch(`${this.#baseUrl}/api/companies`);
    if (!res.ok) throw new Error(`Failed to list companies: ${res.status}`);
    return res.json();
  }

  /**
   * Create a Paperclip agent (hire) from AGI Farm agent definition.
   * @param {string} companyId
   * @param {object} agentDef - { name, role, id, emoji }
   * @param {object} openclawConfig - OpenClaw gateway connection config
   * @returns {Promise<object>}
   */
  async createAgent(companyId, agentDef, openclawConfig = {}) {
    const payload = {
      name: agentDef.name,
      role: mapAgiFarmRole(agentDef.role || agentDef.description),
      title: agentDef.emoji ? `${agentDef.emoji} ${agentDef.name}` : agentDef.name,
      adapterType: 'openclaw_gateway',
      adapterConfig: {
        url: openclawConfig.gatewayUrl || 'ws://localhost:8765',
        clientId: agentDef.id,
        clientMode: 'agent',
        role: agentDef.role || 'worker',
        autoPairOnFirstConnect: true,
        ...openclawConfig,
      },
      instructions: agentDef.instructions || '',
    };

    const res = await fetch(`${this.#baseUrl}/api/companies/${companyId}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create agent "${agentDef.name}": ${res.status} ${body}`);
    }

    return res.json();
  }

  /**
   * List agents for a company.
   */
  async listAgents(companyId) {
    const res = await fetch(`${this.#baseUrl}/api/companies/${companyId}/agents`);
    if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
    return res.json();
  }

  /**
   * Create an issue (task) in Paperclip for a company.
   */
  async createIssue(companyId, issueDef) {
    const res = await fetch(`${this.#baseUrl}/api/companies/${companyId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueDef),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create issue: ${res.status} ${body}`);
    }

    return res.json();
  }

  /**
   * Update an existing agent (PATCH /api/agents/:id).
   */
  async updateAgent(agentId, patch) {
    const res = await fetch(`${this.#baseUrl}/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to update agent ${agentId}: ${res.status} ${body}`);
    }
    return res.json();
  }

  /**
   * Sync an entire AGI Farm team config into Paperclip.
   * Creates company + all agents with org hierarchy wired.
   * @param {object} teamConfig - Full team config from setup wizard
   * @param {object} openclawConfig - Optional OpenClaw gateway settings
   * @returns {Promise<{company: object, agents: Array}>}
   */
  async syncTeam(teamConfig, openclawConfig = {}) {
    // Create company
    const company = await this.createCompany(
      teamConfig.teamName,
      `Blueprint: ${teamConfig.blueprintId || 'custom'} | Domain: ${teamConfig.intel?.domain || 'General'}`
    );

    // Create CEO/lead agent first (root of org chart)
    const agentDefs = [...teamConfig.agents];
    const ceoIdx = agentDefs.findIndex(a => {
      const role = mapAgiFarmRole(a.role || a.description);
      return role === 'ceo';
    });
    // If a CEO exists, move it to the front so it's created first
    if (ceoIdx > 0) {
      const [ceo] = agentDefs.splice(ceoIdx, 1);
      agentDefs.unshift(ceo);
    }

    // Create each agent
    const agents = [];
    let rootAgentId = null;
    for (const agentDef of agentDefs) {
      const agent = await this.createAgent(company.id, agentDef, openclawConfig);
      agents.push(agent);
      if (!rootAgentId) {
        rootAgentId = agent.id; // First agent is the root (CEO or first defined)
      }
    }

    // Wire org hierarchy: all non-root agents report to the root agent
    for (const agent of agents) {
      if (agent.id !== rootAgentId) {
        await this.updateAgent(agent.id, { reportsTo: rootAgentId });
      }
    }

    // Create starter project tasks as issues
    if (teamConfig.project?.createProject && teamConfig.starterTasks) {
      for (const task of teamConfig.starterTasks) {
        await this.createIssue(company.id, {
          title: task.title,
          description: task.description || '',
          assigneeAgentId: task.assigned_to,
          priority: task.priority || 'medium',
        });
      }
    }

    return { company, agents };
  }

  // ── Project Management ─────────────────────────────────────────────────────

  /**
   * Create a project in Paperclip.
   * @param {string} companyId
   * @param {object} projectDef - { name, description, leadAgentId?, status?, color? }
   * @returns {Promise<object>}
   */
  async createProject(companyId, projectDef) {
    const res = await fetch(`${this.#baseUrl}/api/companies/${companyId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectDef.name,
        description: projectDef.description || '',
        leadAgentId: projectDef.leadAgentId || undefined,
        status: projectDef.status || 'planned',
        color: projectDef.color || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create project "${projectDef.name}": ${res.status} ${body}`);
    }

    return res.json();
  }

  /**
   * List projects for a company.
   * @param {string} companyId
   * @returns {Promise<Array>}
   */
  async listProjects(companyId) {
    const res = await fetch(`${this.#baseUrl}/api/companies/${companyId}/projects`);
    if (!res.ok) throw new Error(`Failed to list projects: ${res.status}`);
    return res.json();
  }

  /**
   * Get project details by ID.
   * @param {string} projectId
   * @returns {Promise<object>}
   */
  async getProject(projectId) {
    const res = await fetch(`${this.#baseUrl}/api/projects/${projectId}`);
    if (!res.ok) throw new Error(`Failed to get project ${projectId}: ${res.status}`);
    return res.json();
  }

  /**
   * Update a project.
   * @param {string} projectId
   * @param {object} patch - Fields to update
   * @returns {Promise<object>}
   */
  async updateProject(projectId, patch) {
    const res = await fetch(`${this.#baseUrl}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to update project ${projectId}: ${res.status} ${body}`);
    }
    return res.json();
  }

  // ── Issue/Task Management ─────────────────────────────────────────────────

  /**
   * List issues for a company with optional filters.
   * @param {string} companyId
   * @param {object} filters - { projectId?, status?, assigneeAgentId?, priority? }
   * @returns {Promise<Array>}
   */
  async listIssues(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.status) params.set('status', filters.status);
    if (filters.assigneeAgentId) params.set('assigneeAgentId', filters.assigneeAgentId);
    if (filters.priority) params.set('priority', filters.priority);

    const qs = params.toString();
    const url = `${this.#baseUrl}/api/companies/${companyId}/issues${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to list issues: ${res.status}`);
    return res.json();
  }

  /**
   * Get issue details by ID.
   * @param {string} issueId
   * @returns {Promise<object>}
   */
  async getIssue(issueId) {
    const res = await fetch(`${this.#baseUrl}/api/issues/${issueId}`);
    if (!res.ok) throw new Error(`Failed to get issue ${issueId}: ${res.status}`);
    return res.json();
  }

  /**
   * Update an issue (PATCH /api/issues/:id).
   * @param {string} issueId
   * @param {object} patch - Fields to update (status, assigneeAgentId, priority, etc.)
   * @returns {Promise<object>}
   */
  async updateIssue(issueId, patch) {
    const res = await fetch(`${this.#baseUrl}/api/issues/${issueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to update issue ${issueId}: ${res.status} ${body}`);
    }
    return res.json();
  }

  /**
   * Add a comment to an issue.
   * @param {string} issueId
   * @param {string} content - Comment text
   * @param {string} authorAgentId - The agent posting the comment
   * @returns {Promise<object>}
   */
  async addIssueComment(issueId, content, authorAgentId) {
    const res = await fetch(`${this.#baseUrl}/api/issues/${issueId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: content, authorAgentId }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to add comment to issue ${issueId}: ${res.status} ${body}`);
    }
    return res.json();
  }

  /**
   * Get Paperclip dashboard URL.
   */
  getDashboardUrl() {
    return this.#baseUrl;
  }
}

export { mapAgiFarmRole };
export default PaperclipBridge;
