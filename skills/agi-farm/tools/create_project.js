#!/usr/bin/env node
/**
 * AGI Farm — Create Project Tool
 *
 * Allows the Orchestrator to create a new project in Paperclip.
 * Auto-creates company if none exists yet.
 *
 * Input (JSON):
 *   - project_name (required): Name of the project
 *   - description (required): What this project is about
 *   - lead_agent_id (optional): Agent ID to lead this project
 *   - color (optional): Hex color for the project
 *
 * Output (JSON):
 *   - result: Success message with project ID
 *   - project: The created project object
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

const { project_name, description, lead_agent_id, color } = input;

if (!project_name || !description) {
  console.error(JSON.stringify({ error: 'Missing required fields: project_name and description' }));
  process.exit(1);
}

const paperclipPort = process.env.PAPERCLIP_PORT || '3100';
const paperclipHost = process.env.PAPERCLIP_HOST || '127.0.0.1';
const bridge = new PaperclipBridge(`http://${paperclipHost}:${paperclipPort}`);

try {
  const { company } = await resolveCompany(bridge);

  // Resolve lead agent if specified
  let leadAgentId;
  if (lead_agent_id) {
    const agents = await bridge.listAgents(company.id);
    const leadAgent = agents.find(a =>
      a.name.toLowerCase() === lead_agent_id.toLowerCase() ||
      a.adapterConfig?.clientId === lead_agent_id
    );
    leadAgentId = leadAgent?.id;
  }

  const project = await bridge.createProject(company.id, {
    name: project_name,
    description,
    leadAgentId,
    color,
  });

  // Also update local PROJECTS.json
  const workspace = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
  const projectsPath = path.join(workspace, 'PROJECTS.json');
  if (fs.existsSync(projectsPath)) {
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
    projects.items.push({
      id: project.id,
      name: project_name,
      description,
      status: 'active',
      created_at: new Date().toISOString(),
      paperclip_id: project.id,
    });
    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
  }

  console.log(JSON.stringify({
    result: `Project "${project_name}" created successfully (ID: ${project.id}).`,
    project,
  }));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to create project: ${err.message}` }));
  process.exit(1);
}
