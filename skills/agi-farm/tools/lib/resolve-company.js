/**
 * Shared helper for agent tools — resolves the current company from Paperclip.
 *
 * Strategy:
 * 1. Look for a company matching team.json's team_name
 * 2. If not found but team.json has paperclip_company_id, use that
 * 3. Fall back to first company
 * 4. If no companies exist at all, auto-create one from team.json
 *
 * This ensures tools never fail with "No company found" when Paperclip
 * is running — they bootstrap automatically.
 */

import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Resolve the current Paperclip company for this AGI Farm team.
 *
 * @param {PaperclipBridge} bridge - Initialized bridge instance
 * @param {object} options
 * @param {string} options.workspace - Workspace path
 * @returns {Promise<{company: object, team: object}>}
 */
export async function resolveCompany(bridge, options = {}) {
  const workspace = options.workspace
    || process.env.AGI_FARM_WORKSPACE
    || path.join(os.homedir(), '.openclaw', 'workspace');

  const teamJsonPath = path.join(workspace, 'agi-farm-bundle', 'team.json');

  // Load team.json if it exists (optional — tools work without it)
  let team = null;
  if (fs.existsSync(teamJsonPath)) {
    team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));
  }

  const companies = await bridge.listCompanies();

  // Filter to active companies first, fall back to all
  const activeCompanies = companies.filter(c => c.status === 'active');
  const candidates = activeCompanies.length > 0 ? activeCompanies : companies;

  let company = null;

  if (team) {
    // 1. Match by team name
    company = candidates.find(c => c.name === team.team_name);

    // 2. Match by stored paperclip_company_id
    if (!company && team.paperclip_company_id) {
      company = candidates.find(c => c.id === team.paperclip_company_id);
    }
  }

  // 3. Fall back to first active company (works with or without team.json)
  if (!company && candidates.length > 0) {
    company = candidates[0];
  }

  // 4. Auto-create if no companies exist at all
  if (!company) {
    const teamName = (team && team.team_name) || 'AGI Farm Team';
    company = await bridge.createCompany(
      teamName,
      `Auto-created for AGI Farm team: ${teamName}`
    );

    // Register agents if team.json has them
    if (team && team.agents && team.agents.length > 0) {
      const syncResult = await bridge.syncTeam({
        teamName,
        agents: team.agents,
        intel: { domain: team.domain || 'General' },
      });
      team.paperclip_company_id = company.id;
      fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2));

      return { company: syncResult.company || company, team, agents: syncResult.agents };
    }

    if (team) {
      team.paperclip_company_id = company.id;
      fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2));
    }
  }

  return { company, team: team || { team_name: company.name } };
}
