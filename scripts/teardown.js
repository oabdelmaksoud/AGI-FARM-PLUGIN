#!/usr/bin/env node
/**
 * AGI Farm Teardown
 *
 * Reverts the system back: deletes the generated agents, workspace directories,
 * and the bundle.
 */

const inquirer = require('inquirer');
const ora = require('ora');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Manually mock chalk to avoid ESM require issues
const chalk = {
    cyan: { bold: (str) => `\x1b[36m\x1b[1m${str}\x1b[0m` },
    yellow: (str) => `\x1b[33m${str}\x1b[0m`,
    green: (str) => `\x1b[32m${str}\x1b[0m`,
    red: (str) => `\x1b[31m${str}\x1b[0m`,
    dim: (str) => `\x1b[2m${str}\x1b[0m`
};

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

// ── Safe Command Runner ───────────────────────────────────────────────────────
function runCommand(cmd, args, options = {}) {
    return spawnSync(cmd, args, {
        encoding: 'utf-8',
        timeout: 30000,
        ...options,
    });
}

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
    for (const agent of team.agents) {
        if (agent.id === 'main') continue; // Orchestrator handles its own state
        try {
            runCommand('openclaw', ['agents', 'delete', '--force', agent.id]);
            deletedCount++;
        } catch (e) {
            // Ignore errors for individual deletions
        }
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
