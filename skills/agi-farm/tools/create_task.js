#!/usr/bin/env node
/**
 * AGI Farm — Create Task Tool
 *
 * Allows the Orchestrator to create tasks (issues) in Paperclip.
 * Auto-creates company if none exists yet.
 *
 * Input (JSON):
 *   - title (required): Task title
 *   - description (optional): Task details
 *   - project_id (optional): Paperclip project ID to attach to
 *   - assigned_to (optional): Agent ID to assign the task to
 *   - priority (optional): low, medium (default), high, urgent
 *   - parent_task_id (optional): Parent issue ID for subtasks
 *
 * Output (JSON):
 *   - result: Success message with issue ID
 *   - issue: The created issue object
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import { PaperclipBridge } from '../../../server/paperclip-bridge.js';
import { resolveCompany } from './lib/resolve-company.js';

let input = {};
try {
  input = JSON.parse(process.argv[2] || '{}');
} catch {
  console.error(JSON.stringify({ error: 'Invalid JSON input.' }));
  process.exit(1);
}

const { title, description, project_id, assigned_to, priority, parent_task_id } = input;

if (!title) {
  console.error(JSON.stringify({ error: 'Missing required field: title' }));
  process.exit(1);
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const resolvedPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

const paperclipPort = process.env.PAPERCLIP_PORT || '3100';
const paperclipHost = process.env.PAPERCLIP_HOST || '127.0.0.1';
const bridge = new PaperclipBridge(`http://${paperclipHost}:${paperclipPort}`);

try {
  const { company } = await resolveCompany(bridge);

  // Resolve agent name → Paperclip agent ID
  let assigneeAgentId;
  if (assigned_to) {
    const agents = await bridge.listAgents(company.id);
    const agent = agents.find(a =>
      a.name.toLowerCase() === assigned_to.toLowerCase() ||
      a.adapterConfig?.clientId === assigned_to
    );
    assigneeAgentId = agent?.id;
    if (!assigneeAgentId) {
      console.log(JSON.stringify({ log: `Warning: Agent "${assigned_to}" not found. Task will be unassigned.` }));
    }
  }

  const issueDef = {
    title,
    description: description || '',
    priority: resolvedPriority,
    status: assigneeAgentId ? 'todo' : 'backlog',
  };

  if (project_id) issueDef.projectId = project_id;
  if (assigneeAgentId) issueDef.assigneeAgentId = assigneeAgentId;
  if (parent_task_id) issueDef.parentId = parent_task_id;

  const issue = await bridge.createIssue(company.id, issueDef);

  // Also update local TASKS.json
  const workspace = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
  const tasksPath = path.join(workspace, 'TASKS.json');
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    tasks.push({
      id: issue.id,
      title,
      description: description || '',
      type: 'dev',
      priority: resolvedPriority,
      status: 'pending',
      assigned_to: assigned_to || null,
      project_id: project_id || null,
      paperclip_id: issue.id,
      created_at: new Date().toISOString(),
    });
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  }

  console.log(JSON.stringify({
    result: `Task "${title}" created${assigneeAgentId ? ` and assigned to ${assigned_to}` : ''} (ID: ${issue.id}).`,
    issue,
  }));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to create task: ${err.message}` }));
  process.exit(1);
}
