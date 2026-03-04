#!/usr/bin/env node
/**
 * AGI Farm Export - Push bundle to GitHub
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

console.log(chalk.cyan.bold('\n📤 AGI Farm — Export to GitHub\n'));

// Check for bundle
if (!fs.existsSync(BUNDLE_DIR)) {
  console.error(chalk.red('Error: Bundle not found at'), BUNDLE_DIR);
  console.log(chalk.yellow('Run /agi-farm setup first'));
  process.exit(1);
}

// Check for git
const gitDir = path.join(BUNDLE_DIR, '.git');
if (!fs.existsSync(gitDir)) {
  console.log(chalk.yellow('No git repository found in bundle'));
  console.log(chalk.dim('Run /agi-farm setup with GitHub option to create one'));
  process.exit(0);
}

try {
  process.chdir(BUNDLE_DIR);

  // Add all changes
  console.log(chalk.dim('Staging changes...'));
  spawnSync('git', ['add', '-A'], { stdio: 'inherit' });

  // Commit
  const date = new Date().toISOString().split('T')[0];
  console.log(chalk.dim('Committing...'));
  const commitResult = spawnSync('git', ['commit', '-m', `export: ${date}`], {
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  if (commitResult.status !== 0) {
    console.log(chalk.yellow('Nothing to commit'));
    process.exit(0);
  }

  // Push
  console.log(chalk.dim('Pushing to remote...'));
  const pushResult = spawnSync('git', ['push'], { stdio: 'inherit' });

  if (pushResult.status === 0) {
    console.log(chalk.green('\n✅ Bundle exported to GitHub'));
  } else {
    console.log(chalk.yellow('Push failed'));
  }

  // Get remote URL
  try {
    const urlResult = spawnSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf-8',
    });
    if (urlResult.status === 0) {
      const url = urlResult.stdout.trim();
      console.log(chalk.dim(`\nRemote: ${url}\n`));
    }
  } catch {}

} catch (err) {
  console.error(chalk.red('Error exporting to GitHub'));
  console.log(chalk.yellow('Make sure you have push access to the remote'));
  process.exit(1);
}
