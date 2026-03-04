#!/usr/bin/env node
/**
 * AGI Farm Rebuild - Regenerate workspace from existing bundle
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');
const GENERATE_PY = path.join(os.homedir(), '.openclaw', 'skills', 'agi-farm', 'generate.py');

const args = process.argv.slice(2);
const force = args.includes('--force');

console.log(chalk.cyan.bold('\n🔄 AGI Farm — Rebuild Workspace\n'));

// Check for team.json
const teamJson = path.join(BUNDLE_DIR, 'team.json');
if (!fs.existsSync(teamJson)) {
  console.error(chalk.red('Error: team.json not found at'), teamJson);
  console.log(chalk.yellow('Run /agi-farm setup first'));
  process.exit(1);
}

// Check for generate.py
if (!fs.existsSync(GENERATE_PY)) {
  console.error(chalk.red('Error: generate.py not found at'), GENERATE_PY);
  console.log(chalk.yellow('The AGI Farm skill must be installed'));
  process.exit(1);
}

console.log(chalk.dim('Regenerating workspace files...'));

try {
  const spawnArgs = [
    GENERATE_PY,
    '--team-json', teamJson,
    '--output', WORKSPACE,
    '--all-agents',
    '--shared',
  ];
  if (!force) spawnArgs.push('--no-overwrite');

  const result = spawnSync('python3', spawnArgs, {
    encoding: 'utf-8',
    stdio: 'inherit',
    timeout: 60000,
  });

  if (result.status === 0) {
    console.log(chalk.green('\n✅ Workspace rebuilt successfully'));
    console.log(chalk.dim('\nNote: Existing files were preserved (--no-overwrite)'));
    console.log(chalk.dim('Use --force to overwrite everything\n'));
  } else {
    console.error(chalk.red('Error rebuilding workspace'));
    process.exit(1);
  }
} catch (err) {
  console.error(chalk.red('Error rebuilding workspace'));
  process.exit(1);
}
