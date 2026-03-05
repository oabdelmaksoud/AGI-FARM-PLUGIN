#!/usr/bin/env node
/**
 * AGI Farm Export - Push bundle to GitHub
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const BUNDLE_DIR = path.join(WORKSPACE, 'agi-farm-bundle');

console.log(chalk.cyan.bold('\n📤 AGI Farm — Export to GitHub\n'));

// Check for bundle
if (!fs.existsSync(BUNDLE_DIR)) {
  console.error(chalk.red('Error: Bundle not found at'), BUNDLE_DIR);
  console.log(chalk.yellow('Run agi-farm setup first.'));
  process.exit(1);
}

// Check for git
const gitDir = path.join(BUNDLE_DIR, '.git');
if (!fs.existsSync(gitDir)) {
  console.log(chalk.yellow('No git repository found in the bundle directory.'));
  console.log(chalk.dim('\nTo set one up manually:'));
  console.log(chalk.white(`  cd "${BUNDLE_DIR}"`));
  console.log(chalk.white('  git init -b main'));
  console.log(chalk.white('  git add .'));
  console.log(chalk.white('  git commit -m "feat: initial AGI Farm bundle"'));
  console.log(chalk.white('  git remote add origin <your-repo-url>'));
  console.log(chalk.white('  git push -u origin main'));
  console.log(chalk.dim('\nOr re-run agi-farm setup and choose the GitHub option.\n'));
  process.exit(0);
}

// Check for remote
const remoteResult = spawnSync('git', ['remote', 'get-url', 'origin'], {
  encoding: 'utf-8', cwd: BUNDLE_DIR,
});
if (remoteResult.status !== 0) {
  console.log(chalk.yellow('No git remote configured.'));
  console.log(chalk.dim('\nTo add a remote:'));
  console.log(chalk.white(`  cd "${BUNDLE_DIR}"`));
  console.log(chalk.white('  git remote add origin <your-repo-url>'));
  console.log(chalk.white('  git push -u origin main\n'));
  process.exit(0);
}

const remoteUrl = remoteResult.stdout.trim();

try {
  // Add all changes
  console.log(chalk.dim('Staging changes...'));
  spawnSync('git', ['add', '-A'], { stdio: 'inherit', cwd: BUNDLE_DIR });

  // Commit
  const date = new Date().toISOString().split('T')[0];
  console.log(chalk.dim('Committing...'));
  const commitResult = spawnSync('git', ['commit', '-m', `export: ${date}`], {
    encoding: 'utf-8',
    stdio: 'inherit',
    cwd: BUNDLE_DIR,
  });

  if (commitResult.status !== 0) {
    console.log(chalk.dim('Nothing new to commit.'));
  }

  // Push
  console.log(chalk.dim('Pushing to remote...'));
  const pushResult = spawnSync('git', ['push'], { stdio: 'inherit', cwd: BUNDLE_DIR });

  if (pushResult.status === 0) {
    console.log(chalk.green('\n✅ Bundle exported to GitHub'));
    console.log(chalk.dim(`   Remote: ${remoteUrl}\n`));
  } else {
    console.log(chalk.yellow('\nPush failed. Check your git credentials or remote URL.'));
    console.log(chalk.dim(`   Remote: ${remoteUrl}`));
    console.log(chalk.dim('   Try: git push --set-upstream origin main\n'));
    process.exit(1);
  }

} catch (err) {
  console.error(chalk.red('Error exporting to GitHub:'), err.message);
  console.log(chalk.dim('Make sure you have push access to the remote.'));
  process.exit(1);
}
