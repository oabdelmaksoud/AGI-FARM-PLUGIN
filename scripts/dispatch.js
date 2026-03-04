#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISPATCH_PY = path.join(os.homedir(), '.openclaw', 'skills', 'agi-farm', 'scripts', 'auto-dispatch.py');

if (!fs.existsSync(DISPATCH_PY)) {
  console.error(chalk.red('Error: AGI Farm python skill not found at ' + DISPATCH_PY));
  console.log(chalk.yellow('Please install the skill first from the openclaw-skills repository.'));
  process.exit(1);
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');

console.log(chalk.cyan.bold('\n⚡ AGI Farm — Auto-Dispatcher\n'));

if (!execute) {
  console.log(chalk.yellow('Dry-run mode (preview only)'));
  console.log(chalk.dim('Use --execute to run\n'));
} else {
  console.log(chalk.green('Execute mode'));
  console.log(chalk.dim('Firing agent sessions for pending tasks...\n'));
}

// Run Python dispatcher
const proc = spawn('python3', [DISPATCH_PY, ...args], { stdio: 'inherit' });

proc.on('error', (err) => {
  console.error(chalk.red('Error:'), err.message);
  console.log(chalk.yellow('Make sure Python 3 is installed'));
  process.exit(1);
});

proc.on('close', (code) => {
  if (code === 0) {
    console.log(chalk.dim('\nDone.\n'));
  } else {
    console.log(chalk.red(`\nDispatcher exited with code ${code}\n`));
  }
});
