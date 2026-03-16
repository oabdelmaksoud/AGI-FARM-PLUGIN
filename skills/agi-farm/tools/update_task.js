#!/usr/bin/env node
/**
 * AGI Farm — Update Task Tool
 *
 * Allows agents to update task status, reassign tasks, add comments,
 * or change priority in Paperclip.
 *
 * Input (JSON):
 *   - task_id (required): Paperclip issue ID to update
 *   - status (optional): backlog, todo, in_progress, blocked, done, cancelled
 *   - assigned_to (optional): Agent ID to reassign to
 *   - priority (optional): low, medium, high, urgent
 *   - comment (optional): Progress note or completion summary
 *
 * Output (JSON):
 *   - result: Success message
 *   - issue: Updated issue object
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import { PaperclipBridge } from '../../../server/paperclip-bridge.js';

let input = {};
try {
  input = JSON.parse(process.argv[2] || '{}');
} catch {
  console.error(JSON.stringify({ error: 'Invalid JSON input.' }));
  process.exit(1);
}

const { task_id, status, assigned_to, priority, comment } = input;

if (!task_id) {
  console.error(JSON.stringify({ error: 'Missing required field: task_id' }));
  process.exit(1);
}

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

if (status && !VALID_STATUSES.includes(status)) {
  console.error(JSON.stringify({
    error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
  }));
  process.exit(1);
}

if (priority && !VALID_PRIORITIES.includes(priority)) {
  console.error(JSON.stringify({
    error: `Invalid priority "${priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`,
  }));
  process.exit(1);
}

const workspace = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const teamJsonPath = path.join(workspace, 'agi-farm-bundle', 'team.json');

if (!fs.existsSync(teamJsonPath)) {
  console.error(JSON.stringify({ error: 'No active AGI Farm team found.' }));
  process.exit(1);
}

const team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));
const paperclipPort = process.env.PAPERCLIP_PORT || '3100';
const paperclipHost = process.env.PAPERCLIP_HOST || '127.0.0.1';
const bridge = new PaperclipBridge(`http://${paperclipHost}:${paperclipPort}`);

try {
  // Build the patch object
  const patch = {};
  if (status) patch.status = status;
  if (priority) patch.priority = priority;

  // Resolve agent name → Paperclip agent ID if reassigning
  if (assigned_to) {
    const companies = await bridge.listCompanies();
    const company = companies.find(c => c.name === team.team_name) || companies[0];
    if (company) {
      const agents = await bridge.listAgents(company.id);
      const agent = agents.find(a =>
        a.name.toLowerCase() === assigned_to.toLowerCase() ||
        a.adapterConfig?.clientId === assigned_to
      );
      if (agent) {
        patch.assigneeAgentId = agent.id;
      } else {
        console.log(JSON.stringify({ log: `Warning: Agent "${assigned_to}" not found. Skipping reassignment.` }));
      }
    }
  }

  // Update the issue in Paperclip
  const issue = await bridge.updateIssue(task_id, patch);

  // Add comment if provided
  if (comment) {
    await bridge.addIssueComment(task_id, comment);
  }

  // Update local TASKS.json
  const tasksPath = path.join(workspace, 'TASKS.json');
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const localTask = tasks.find(t => t.id === task_id || t.paperclip_id === task_id);
    if (localTask) {
      if (status === 'done') {
        localTask.status = 'complete';
        localTask.completed_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        localTask.status = 'in-progress';
      } else if (status) {
        localTask.status = status;
      }
      if (assigned_to) localTask.assigned_to = assigned_to;
      if (priority) localTask.priority = priority;
      localTask.updated_at = new Date().toISOString();
      fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    }
  }

  const changes = [];
  if (status) changes.push(`status → ${status}`);
  if (assigned_to) changes.push(`assigned → ${assigned_to}`);
  if (priority) changes.push(`priority → ${priority}`);
  if (comment) changes.push('comment added');

  console.log(JSON.stringify({
    result: `Task ${task_id} updated: ${changes.join(', ')}.`,
    issue,
  }));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to update task: ${err.message}` }));
  process.exit(1);
}
