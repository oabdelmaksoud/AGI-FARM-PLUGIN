#!/usr/bin/env node

/**
 * Agency-Agents Update Script
 *
 * Automatically checks for and applies updates from the Agency-Agents repository.
 *
 * Usage:
 *   node scripts/update-agency-agents.js           # Check and apply updates
 *   node scripts/update-agency-agents.js --dry-run # Check only, don't apply
 *   node scripts/update-agency-agents.js --force   # Force update even if no changes
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PLUGIN_ROOT, 'templates', 'agency-agents');
const VERSION_FILE = path.join(PLUGIN_ROOT, 'agency-agents-resources', 'AGENCY_VERSION');
const TEMP_DIR = '/tmp/agency-agents-update';
const REPO_URL = 'https://github.com/msitarzewski/agency-agents.git';

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

/**
 * Get current version from VERSION_FILE
 */
async function getCurrentVersion() {
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf-8');
    const match = content.match(/COMMIT:\s*([a-f0-9]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clone or update Agency-Agents repository
 */
async function cloneOrUpdateRepo() {
  console.log(chalk.cyan('\n📥 Fetching Agency-Agents repository...\n'));

  try {
    // Remove old temp directory
    try {
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch {}

    // Clone fresh copy
    execSync(`git clone ${REPO_URL} ${TEMP_DIR}`, {
      stdio: 'inherit',
    });

    // Get latest commit
    const commit = execSync('git rev-parse HEAD', {
      cwd: TEMP_DIR,
      encoding: 'utf-8',
    }).trim();

    const commitDate = execSync('git log -1 --format=%cd --date=short', {
      cwd: TEMP_DIR,
      encoding: 'utf-8',
    }).trim();

    return { commit, commitDate };
  } catch (error) {
    console.error(chalk.red('❌ Failed to clone repository:'), error.message);
    process.exit(1);
  }
}

/**
 * Compare versions
 */
async function compareVersions(currentCommit, latestCommit) {
  if (!currentCommit) {
    console.log(chalk.yellow('⚠️  No version file found - this appears to be a first-time setup'));
    return { hasUpdates: true, isFirstTime: true };
  }

  if (currentCommit === latestCommit) {
    console.log(chalk.green('✅ Already up to date!'));
    console.log(chalk.dim(`   Current: ${currentCommit.substring(0, 7)}`));
    return { hasUpdates: false, isFirstTime: false };
  }

  console.log(chalk.yellow('📊 Updates available:'));
  console.log(chalk.dim(`   Current:  ${currentCommit.substring(0, 7)}`));
  console.log(chalk.dim(`   Latest:   ${latestCommit.substring(0, 7)}`));

  // Show commits between versions
  try {
    const commits = execSync(
      `git log --oneline ${currentCommit}..${latestCommit}`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    ).trim();

    if (commits) {
      console.log(chalk.cyan('\n📝 Changes since last update:\n'));
      commits.split('\n').forEach(line => {
        console.log(chalk.dim(`   ${line}`));
      });
    }
  } catch (error) {
    console.log(chalk.dim('   (Unable to fetch commit history)'));
  }

  return { hasUpdates: true, isFirstTime: false };
}

/**
 * Run conversion script
 */
async function runConversion() {
  console.log(chalk.cyan('\n🔄 Converting agent templates...\n'));

  try {
    const conversionScript = path.join(__dirname, 'convert-agency-agent.js');
    execSync(
      `node "${conversionScript}" --batch "${TEMP_DIR}" "${TEMPLATES_DIR}"`,
      { stdio: 'inherit' }
    );
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Conversion failed:'), error.message);
    return false;
  }
}

/**
 * Update version file
 */
async function updateVersionFile(commit, commitDate) {
  const versionContent = `# Agency-Agents Version Tracking
#
# This file tracks which version of the Agency-Agents repository
# was last integrated into AGI Farm.

REPOSITORY: https://github.com/msitarzewski/agency-agents
COMMIT: ${commit}
DATE: ${commitDate}
UPDATED: ${new Date().toISOString()}

# To update to latest version:
#   node scripts/update-agency-agents.js
#
# To check for updates without applying:
#   node scripts/update-agency-agents.js --dry-run
`;

  try {
    await fs.mkdir(path.dirname(VERSION_FILE), { recursive: true });
    await fs.writeFile(VERSION_FILE, versionContent, 'utf-8');
    console.log(chalk.green(`\n✅ Updated version file: ${commit.substring(0, 7)}`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to update version file:'), error.message);
  }
}

/**
 * Main update process
 */
async function main() {
  console.log(chalk.bold.cyan('\n🎭 Agency-Agents Update Script\n'));

  if (isDryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be applied\n'));
  }

  // Step 1: Get current version
  const currentCommit = await getCurrentVersion();
  if (currentCommit) {
    console.log(chalk.dim(`Current version: ${currentCommit.substring(0, 7)}\n`));
  }

  // Step 2: Clone/update repository
  const { commit: latestCommit, commitDate } = await cloneOrUpdateRepo();

  // Step 3: Compare versions
  const { hasUpdates, isFirstTime } = await compareVersions(currentCommit, latestCommit);

  if (!hasUpdates && !isForce) {
    console.log(chalk.green('\n✨ No updates needed!\n'));
    return;
  }

  if (isForce) {
    console.log(chalk.yellow('\n⚠️  FORCE mode - updating anyway\n'));
  }

  if (isDryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN - Would have updated to:'));
    console.log(chalk.dim(`   Commit: ${latestCommit.substring(0, 7)}`));
    console.log(chalk.dim(`   Date: ${commitDate}`));
    console.log(chalk.yellow('\nRun without --dry-run to apply updates.\n'));
    return;
  }

  // Step 4: Run conversion
  const success = await runConversion();

  if (!success) {
    console.error(chalk.red('\n❌ Update failed during conversion\n'));
    process.exit(1);
  }

  // Step 5: Update version file
  await updateVersionFile(latestCommit, commitDate);

  // Step 6: Show summary
  console.log(chalk.green.bold('\n✅ Update Complete!\n'));
  console.log(chalk.white('Next steps:'));
  console.log(chalk.dim('   1. Review changes: git status'));
  console.log(chalk.dim('   2. Test converted templates'));
  console.log(chalk.dim('   3. Commit: git add . && git commit -m "chore: Update Agency-Agents templates"'));
  console.log(chalk.dim('   4. Push: git push origin main\n'));

  // Cleanup
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch {}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('\n💥 Fatal error:'), error);
    process.exit(1);
  });
}

export { main };
