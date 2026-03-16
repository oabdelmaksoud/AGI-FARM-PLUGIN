#!/usr/bin/env node
/**
 * AGI Farm — Manage Board Tool
 *
 * Allows the Orchestrator to query the current state of all tasks,
 * filter by project/agent/status, and get a high-level overview.
 * Auto-creates company if none exists.
 *
 * Input (JSON):
 *   - project_id (optional): Filter tasks by project
 *   - assigned_to (optional): Filter tasks by agent
 *   - status (optional): Filter by status
 *   - include_agents (optional): Also return agent statuses (default: false)
 *
 * Output (JSON):
 *   - result: Summary of board state
 *   - issues: Array of issue objects
 *   - agents: Array of agent objects (if include_agents is true)
 *   - stats: { total, backlog, todo, in_progress, blocked, done }
 */

import { PaperclipBridge } from '../../../server/paperclip-bridge.js';
import { resolveCompany } from './lib/resolve-company.js';

let input = {};
try {
  input = JSON.parse(process.argv[2] || '{}');
} catch {
  console.error(JSON.stringify({ error: 'Invalid JSON input.' }));
  process.exit(1);
}

const paperclipPort = process.env.PAPERCLIP_PORT || '3100';
const paperclipHost = process.env.PAPERCLIP_HOST || '127.0.0.1';
const bridge = new PaperclipBridge(`http://${paperclipHost}:${paperclipPort}`);

try {
  const { company } = await resolveCompany(bridge);

  // Build filters
  const filters = {};
  if (input.project_id) filters.projectId = input.project_id;
  if (input.status) filters.status = input.status;

  // Resolve agent name to ID for filtering
  let agents = [];
  if (input.assigned_to || input.include_agents) {
    agents = await bridge.listAgents(company.id);
  }

  if (input.assigned_to) {
    const agent = agents.find(a =>
      a.name.toLowerCase() === input.assigned_to.toLowerCase() ||
      a.adapterConfig?.clientId === input.assigned_to
    );
    if (agent) filters.assigneeAgentId = agent.id;
  }

  const issues = await bridge.listIssues(company.id, filters);

  // Compute stats
  const stats = {
    total: issues.length,
    backlog: issues.filter(i => i.status === 'backlog').length,
    todo: issues.filter(i => i.status === 'todo').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    blocked: issues.filter(i => i.status === 'blocked').length,
    done: issues.filter(i => i.status === 'done').length,
    cancelled: issues.filter(i => i.status === 'cancelled').length,
  };

  // Build compact issue summaries
  const issueSummaries = issues.map(i => ({
    id: i.id,
    title: i.title,
    status: i.status,
    priority: i.priority,
    assignee: i.assigneeAgentId || 'unassigned',
    project: i.projectId || null,
  }));

  // Build result message
  const parts = [`Board: ${stats.total} tasks total`];
  if (stats.in_progress > 0) parts.push(`${stats.in_progress} in progress`);
  if (stats.blocked > 0) parts.push(`⚠️ ${stats.blocked} blocked`);
  if (stats.todo > 0) parts.push(`${stats.todo} to do`);
  if (stats.done > 0) parts.push(`${stats.done} done`);

  const output = {
    result: parts.join(', '),
    issues: issueSummaries,
    stats,
    company_id: company.id,
  };

  if (input.include_agents) {
    output.agents = agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status,
      clientId: a.adapterConfig?.clientId,
    }));
  }

  console.log(JSON.stringify(output));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to query board: ${err.message}` }));
  process.exit(1);
}
