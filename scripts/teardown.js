#!/usr/bin/env node
/**
 * AGI Farm Teardown
 *
 * Reverts the system back: deletes the generated agents, workspace directories,
 * and the bundle.
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { runCommand } from './lib/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    console.log(chalk.cyan.bold('\n🚜 AGI Farm — Teardown & Uninstall\n'));

    const teamJsonPath = path.join(BUNDLE_DIR, 'team.json');
    if (!fs.existsSync(teamJsonPath)) {
        console.log(chalk.yellow('No active team bundle found at ' + BUNDLE_DIR));
        console.log(chalk.dim('Nothing to teardown. Exiting...'));
        process.exit(0);
    }

    let team;
    try {
        team = JSON.parse(fs.readFileSync(teamJsonPath, 'utf8'));
    } catch (err) {
        console.error(chalk.red('Failed to read team.json:'), err.message);
        process.exit(1);
    }

    console.log(chalk.red('WARNING! This action is IRREVERSIBLE.'));
    console.log(chalk.yellow(`This will delete the "${team.team_name}" team bundle and ALL associated agents.`));
    console.log(chalk.yellow('All agent workspaces, memories, and tracking files will be removed.\n'));

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you absolutely sure you want to completely uninstall this AGI team?',
            default: false,
        },
    ]);

    if (!confirm) {
        console.log(chalk.dim('Teardown cancelled.'));
        process.exit(0);
    }

    // Delete agents
    const spinner = ora('Deleting OpenClaw agents...').start();
    let deletedCount = 0;
    const deletedIds = new Set();

    // Phase 1: Delete agents listed in team.json
    for (const agent of team.agents) {
        if (agent.id === 'main') continue;
        try {
            runCommand('openclaw', ['agents', 'delete', '--force', agent.id]);
            deletedIds.add(agent.id);
            deletedCount++;
        } catch (e) {
            // Ignore errors
        }
    }

    // Phase 2: Live search for stray agents (like sage, forge, pixel, or test agents)
    try {
        spinner.text = 'Searching for stray agents...';
        const listResult = runCommand('openclaw', ['agents', 'list', '--json']);
        if (listResult.status === 0) {
            const liveAgents = JSON.parse(listResult.stdout);
            const patterns = ['sage', 'forge', 'pixel', 'vigil', 'anchor', 'lens', 'evolve', 'nova', 'cipher', 'vista', 'test-agent', 'stray-agent'];

            for (const a of liveAgents) {
                if (a.id === 'main' || deletedIds.has(a.id)) continue;

                // If ID matches one of our known defaults or session test IDs, delete it
                if (patterns.some(p => a.id.includes(p))) {
                    spinner.text = `Cleaning up stray agent: ${a.id}...`;
                    runCommand('openclaw', ['agents', 'delete', '--force', a.id]);
                    deletedCount++;
                }
            }
        }
    } catch (e) {
        // Fail silently
    }

    spinner.succeed(`Deleted ${deletedCount} agents`);

    // Remove bundle
    spinner.start('Removing AGI Farm bundle directory...');
    try {
        fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
        spinner.succeed('Bundle directory removed');
    } catch (e) {
        spinner.fail('Failed to remove bundle directory');
    }

    // Remove comms
    spinner.start('Removing comms infrastructure...');
    try {
        const commsDir = path.join(WORKSPACE, 'comms');
        if (fs.existsSync(commsDir)) {
            fs.rmSync(commsDir, { recursive: true, force: true });
        }
        spinner.succeed('Comms infrastructure removed');
    } catch (e) {
        spinner.succeed('Comms infrastructure removed');
    }

    // Remove registries
    spinner.start('Removing shared registries...');
    try {
        fs.rmSync(path.join(WORKSPACE, 'TASKS.json'), { force: true });
        fs.rmSync(path.join(WORKSPACE, 'AGENT_STATUS.json'), { force: true });
        spinner.succeed('Shared registries removed');
    } catch (e) {
        spinner.succeed('Shared registries removed');
    }

    console.log(chalk.green('\n✅ AGI Farm teardown complete. Your workspace is clean.\n'));
}

main().catch(err => {
    console.error(chalk.red('\nUnexpected error during teardown:'), err.message);
    process.exit(1);
});
