#!/usr/bin/env node
/**
 * AGI Farm — Create Company Tool
 *
 * Allows the Orchestrator to create a new company (team) in Paperclip.
 * This is typically done during setup, but the Orchestrator can also
 * use it to spin up a new venture or switch teams.
 *
 * After creating the company, it registers all team agents from team.json
 * into the new company and wires the org hierarchy.
 *
 * Input (JSON):
 *   - company_name (required): Name of the company/team
 *   - description (optional): What this company does
 *   - register_agents (optional): true (default) — also register agents from team.json
 *
 * Output (JSON):
 *   - result: Success message with company ID
 *   - company: The created company object
 *   - agents: Array of registered agents (if register_agents is true)
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

const { company_name, description, register_agents = true } = input;

if (!company_name) {
  console.error(JSON.stringify({ error: 'Missing required field: company_name' }));
  process.exit(1);
}

const workspace = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const teamJsonPath = path.join(workspace, 'agi-farm-bundle', 'team.json');
const paperclipPort = process.env.PAPERCLIP_PORT || '3100';
const paperclipHost = process.env.PAPERCLIP_HOST || '127.0.0.1';
const bridge = new PaperclipBridge(`http://${paperclipHost}:${paperclipPort}`);

try {
  // Check if company already exists
  const existing = await bridge.listCompanies();
  const duplicate = existing.find(c => c.name.toLowerCase() === company_name.toLowerCase());
  if (duplicate) {
    console.log(JSON.stringify({
      result: `Company "${company_name}" already exists (ID: ${duplicate.id}). Use it directly.`,
      company: duplicate,
      agents: [],
    }));
    process.exit(0);
  }

  // Create the company
  const company = await bridge.createCompany(company_name, description || `AGI Farm team: ${company_name}`);

  let agents = [];

  // Register agents from team.json if available and requested
  if (register_agents && fs.existsSync(teamJsonPath)) {
    const team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));

    if (team.agents && team.agents.length > 0) {
      const result = await bridge.syncTeam({
        teamName: company_name,
        agents: team.agents,
        intel: { domain: team.domain || 'General' },
      });
      agents = result.agents;

      // Update team.json with the new company name
      team.team_name = company_name;
      team.paperclip_company_id = company.id;
      fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2));
    }
  }

  console.log(JSON.stringify({
    result: `Company "${company_name}" created (ID: ${company.id})${agents.length > 0 ? ` with ${agents.length} agents registered` : ''}.`,
    company,
    agents,
  }));
} catch (err) {
  console.error(JSON.stringify({ error: `Failed to create company: ${err.message}` }));
  process.exit(1);
}
