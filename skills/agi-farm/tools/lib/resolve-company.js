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

  if (!fs.existsSync(teamJsonPath)) {
    throw new Error('No active AGI Farm team found. Run `agi-farm setup` first.');
  }

  const team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));
  const companies = await bridge.listCompanies();

  // 1. Match by team name
  let company = companies.find(c => c.name === team.team_name);

  // 2. Match by stored paperclip_company_id
  if (!company && team.paperclip_company_id) {
    company = companies.find(c => c.id === team.paperclip_company_id);
  }

  // 3. Fall back to first company
  if (!company && companies.length > 0) {
    company = companies[0];
  }

  // 4. Auto-create if no companies exist
  if (!company) {
    const teamName = team.team_name || 'AGI Farm Team';
    company = await bridge.createCompany(
      teamName,
      `Auto-created for AGI Farm team: ${teamName}`
    );

    // Register agents if available
    if (team.agents && team.agents.length > 0) {
      const syncResult = await bridge.syncTeam({
        teamName,
        agents: team.agents,
        intel: { domain: team.domain || 'General' },
      });
      // Store company ID for next time
      team.paperclip_company_id = company.id;
      fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2));

      return { company: syncResult.company || company, team, agents: syncResult.agents };
    }

    team.paperclip_company_id = company.id;
    fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2));
  }

  return { company, team };
}
