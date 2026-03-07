#!/usr/bin/env node
/**
 * AGI Farm Professional CLI (v2.0)
 * 
 * Main entry point for all AGI Farm automation commands.
 * Built with Commander for a professional terminal experience.
 */

import { Command } from 'commander';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
    .name('agi-farm')
    .description('Comprehensive toolset for AGI Farm team management')
    .version(packageJson.version);

// ── Subcommands ──────────────────────────────────────────────────────────────

function routeSubcommand(commandName, description, scriptOverride = null) {
    const scriptPath = path.join(__dirname, `${scriptOverride || commandName}.js`);

    if (!fs.existsSync(scriptPath)) {
        console.error(`\x1b[31mError: Subcommand script not found: ${scriptPath}\x1b[0m`);
        return;
    }

    program
        .command(`${commandName} [args...]`)
        .description(description)
        .allowUnknownOption()
        .action(() => {
            // We slice(3) to pass through all args after 'node agi-farm.js commandName'
            const result = spawnSync(process.execPath, [scriptPath, ...process.argv.slice(3)], { stdio: 'inherit' });
            process.exit(result.status ?? 0);
        });
}

// Register all core commands
routeSubcommand('setup', 'Launch the Advanced Setup Wizard to build a new AGI team');
routeSubcommand('teardown', 'Safely stop and remove an existing AGI team and workspace');
routeSubcommand('status', 'Check real-time status, agent health, and project progress');
routeSubcommand('dashboard', 'Start the AGI Farm Live Ops Dashboard (Web UI)');
routeSubcommand('dispatch', 'Process the task queue and orchestrate agent assignments');
routeSubcommand('export', 'Bundle the workspace and team configuration for GitHub export');
routeSubcommand('rebuild', 'Regenerate SOUL.md files and re-sync components from templates');
routeSubcommand('launchagent', 'Install/Reset the macOS LaunchAgent for background persistence', 'install-launchagent');

// ── Default Behavior ────────────────────────────────────────────────────────

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
    console.log('\n\x1b[36mTip: Run "agi-farm setup" to get started.\x1b[0m\n');
} else {
    // If the first arg is not a command, we could assume 'setup' for backward compat,
    // but professional CLIs usually require the command name.
    // We'll require it for clarity.
    program.parse(process.argv);
}
