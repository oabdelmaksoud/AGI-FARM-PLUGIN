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
const jobId = args.includes('--job-id') ? args[args.indexOf('--job-id') + 1] : null;
const stepId = args.includes('--step-id') ? args[args.indexOf('--step-id') + 1] : null;

if ((jobId && !stepId) || (!jobId && stepId)) {
  console.error(chalk.red('Error: --job-id and --step-id must be provided together'));
  process.exit(1);
}

console.log(chalk.cyan.bold('\n⚡ AGI Farm — Auto-Dispatcher\n'));

if (jobId && stepId) {
  console.log(chalk.blue(`Job step mode: job=${jobId} step=${stepId}`));
  console.log(chalk.dim('Idempotent step execution path enabled\n'));
}

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
