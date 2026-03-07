#!/usr/bin/env node
/**
 * AGI Farm CLI Dispatcher
 *
 * Routes "agi-farm <command>" to the appropriate script.
 * Defaults to "setup" if no command or an invalid command is provided.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_COMMANDS = ['setup', 'teardown', 'status', 'dashboard', 'dispatch', 'export', 'rebuild', 'launchagent'];

// The main `agi-farm` command is the first argument after node and the script path
const args = process.argv.slice(2);
let command = args[0];

// If no command provided, or command is not in our known list (meaning it might be a flag like --help passed to setup, or a typo), default to setup
if (!command || !VALID_COMMANDS.includes(command)) {
    // If the user meant a subcommand but typed it wrong, we could show help, but the historical behavior was to just run setup.
    // For safety, let's keep the historical behavior of running the wizard if they just type `agi-farm`.
    // However, if they typed `agi-farm status`, `command` will be 'status'.

    // Actually, if it's explicitly one of the known cmds, we route. 
    // Otherwise, route to setup and pass all args down.
    command = 'setup';
} else {
    // Valid command recognized, remove it from the args array representing the flags
    args.shift();
}

const targetScript = path.join(__dirname, `${command}.js`);

if (!fs.existsSync(targetScript)) {
    console.error(`\x1b[31mError: Target script not found for command '${command}' at ${targetScript}\x1b[0m`);
    process.exit(1);
}

// Spawn the target script, passing along any remaining arguments
const result = spawnSync(process.execPath, [targetScript, ...args], { stdio: 'inherit' });

if (result.error) {
    console.error(`\x1b[31mFailed to start subcommand '${command}': ${result.error.message}\x1b[0m`);
    process.exit(1);
}

process.exit(result.status ?? 1);
