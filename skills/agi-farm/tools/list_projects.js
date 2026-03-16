#!/usr/bin/env node
/**
 * AGI Farm — List Projects Tool
 *
 * Allows the Orchestrator to see existing projects in Paperclip
 * so it can decide whether a new request belongs to an existing
 * project or needs a new one. Auto-creates company if none exists.
 *
 * Input (JSON):
 *   - status (optional): Filter by project status (active, completed, archived)
 *
 * Output (JSON):
 *   - result: Summary of projects found
 *   - projects: Array of project objects
 *   - company_id: The resolved company ID
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

  const allProjects = await bridge.listProjects(company.id);

  // Filter by status if requested
  const projects = input.status
    ? allProjects.filter(p => p.status === input.status)
    : allProjects;

  // Build a summary for the agent
  const summary = projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    lead: p.leadAgentId || 'unassigned',
    created: p.createdAt,
  }));

  console.log(JSON.stringify({
    result: projects.length === 0
      ? 'No projects found. Use create_project to start a new one.'
      : `Found ${projects.length} project(s): ${projects.map(p => `"${p.name}" (${p.status})`).join(', ')}.`,
    projects: summary,
    company_id: company.id,
  }));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to list projects: ${err.message}` }));
  process.exit(1);
}
