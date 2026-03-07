#!/usr/bin/env node
/**
 * AGI Farm Autonomous Hiring Tool
 * 
 * Allows the Orchestrator to dynamically provision a new agent by ID, Name, Role, and Emoji.
 * It registers the agent with OpenClaw, adds them to the team.json bundle, and rebuilds
 * the workspace dynamically.
 */

import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tool input parsing (OpenClaw passes inputs as JSON string argument)
let input = {};
try {
    input = JSON.parse(process.argv[2] || '{}');
} catch (e) {
    console.error(JSON.stringify({ error: "Invalid JSON input provided to tool." }));
    process.exit(1);
}

const { agent_id, agent_name, agent_role, agent_emoji } = input;

if (!agent_id || !agent_name || !agent_role) {
    console.error(JSON.stringify({ error: "Missing required fields: agent_id, agent_name, or agent_role" }));
    process.exit(1);
}

const emoji = agent_emoji || '🤖';
const workspace = path.join(os.homedir(), '.openclaw', 'workspace');
const teamJsonPath = path.join(workspace, 'agi-farm-bundle', 'team.json');

// 1. Check if team.json exists
if (!fs.existsSync(teamJsonPath)) {
    console.error(JSON.stringify({ error: "No active AGI Farm team bundle found. Cannot hire an agent without a team." }));
    process.exit(1);
}

const team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));

// 2. Prevent duplicate hiring
if (team.agents.some(a => a.id === agent_id)) {
    console.log(JSON.stringify({ result: `Agent ID '${agent_id}' is already on the team roster.` }));
    process.exit(0);
}

// 3. Check if the agent already exists globally in OpenClaw
const listCmd = spawnSync('openclaw', ['agents', 'list', '--json'], { encoding: 'utf-8' });
let globalAgents = [];
if (listCmd.status === 0) {
    try {
        globalAgents = JSON.parse(listCmd.stdout);
    } catch (e) { }
}

const existingAgent = globalAgents.find(a => a.id === agent_id);

if (!existingAgent) {
    // 3a. Agent doesn't exist, create them
    console.log(JSON.stringify({ log: `Agent '${agent_id}' not found globally. Provisioning a new agent.` }));
    const addCmd = spawnSync('openclaw', [
        'agents', 'add',
        '--id', agent_id,
        '--name', agent_name,
        '--role', agent_role,
        '--emoji', emoji,
        '--workspace', path.join(os.homedir(), '.openclaw', 'workspace', 'agents-workspaces', agent_id)
    ], { encoding: 'utf-8' });

    if (addCmd.status !== 0) {
        console.error(JSON.stringify({
            error: "Failed to register new agent with OpenClaw.",
            details: addCmd.stderr
        }));
        process.exit(1);
    }
} else {
    console.log(JSON.stringify({ log: `Found existing agent '${agent_id}' in global OpenClaw registry. Adding to team.` }));
}

// 4. Update team.json bundle
const templatesDir = path.join(__dirname, '..', '..', '..', 'templates', 'agency-agents');
let foundTemplatePath = null;
if (fs.existsSync(templatesDir)) {
    const findTemplateId = (dir) => {
        for (const file of fs.readdirSync(dir)) {
            const fPath = path.join(dir, file);
            if (fs.statSync(fPath).isDirectory()) {
                findTemplateId(fPath);
            } else if (file === `${agent_id}.md`) {
                foundTemplatePath = 'agency-agents/' + path.relative(templatesDir, fPath);
            }
        }
    };
    findTemplateId(templatesDir);
}

const newAgentEntry = {
    id: agent_id,
    name: agent_name,
    emoji: emoji,
    role: agent_role,
    goal: `Dynamically provisioned agent focused on: ${agent_role}`,
    workspace: agent_id
};

if (foundTemplatePath) {
    newAgentEntry.template = foundTemplatePath;
    console.log(JSON.stringify({ log: `Found existing SOUL template for '${agent_id}'. Equipping agent with expertise.` }));
} else {
    newAgentEntry.is_custom = true;
}

team.agents.push(newAgentEntry);

fs.writeFileSync(teamJsonPath, JSON.stringify(team, null, 2), 'utf-8');

// 5. Rebuild the workspace silently to regenerate the Orchestrator's SOUL.md with the new map
const rebuildCmd = spawnSync('agi-farm', ['rebuild'], { encoding: 'utf-8', env: process.env });

if (rebuildCmd.status !== 0) {
    console.error(JSON.stringify({
        error: "Agent hired, but 'agi-farm rebuild' failed. The Orchestrator may not see the new agent in its instructions yet.",
        details: rebuildCmd.stderr
    }));
    process.exit(1);
}

// 6. Return success
console.log(JSON.stringify({
    result: `Success! Agent '${agent_name}' (@${agent_id}) has been hired as a ${agent_role}. They have been added to the Delegation Map and are ready to receive tasks.`
}));
