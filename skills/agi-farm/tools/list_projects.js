#!/usr/bin/env node
/**
 * AGI Farm — List Projects Tool
 *
 * Allows the Orchestrator to see existing projects in Paperclip
 * so it can decide whether a new request belongs to an existing
 * project or needs a new one.
 *
 * Input (JSON):
 *   - status (optional): Filter by project status (active, completed, archived)
 *
 * Output (JSON):
 *   - result: Summary of projects found
 *   - projects: Array of project objects
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
  const companies = await bridge.listCompanies();
  const company = companies.find(c => c.name === team.team_name) || companies[0];

  if (!company) {
    console.error(JSON.stringify({ error: 'No company found in Paperclip.' }));
    process.exit(1);
  }

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
