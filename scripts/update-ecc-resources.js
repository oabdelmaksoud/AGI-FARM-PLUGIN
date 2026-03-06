#!/usr/bin/env node
/**
 * ECC Resources Update Script
 *
 * Updates the plugin's ECC resources to the latest version from the upstream repository.
 *
 * Usage:
 *   node scripts/update-ecc-resources.js [--dry-run] [--version=<commit-sha>]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --version    Sync to specific commit SHA (default: latest main)
 *
 * This script:
 * 1. Clones/pulls the latest ECC repo
 * 2. Compares current resources with upstream
 * 3. Updates changed files
 * 4. Reports what was added/modified/removed
 * 5. Updates ECC_VERSION file
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGIN_DIR = path.resolve(__dirname, '..');
const ECC_RESOURCES_DIR = path.join(PLUGIN_DIR, 'ecc-resources');
const TEMP_DIR = path.join(os.tmpdir(), 'agi-farm-ecc-update');
const ECC_REPO = 'https://github.com/affaan-m/everything-claude-code.git';
const VERSION_FILE = path.join(ECC_RESOURCES_DIR, 'ECC_VERSION');

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const versionArg = args.find(arg => arg.startsWith('--version='));
const targetVersion = versionArg ? versionArg.split('=')[1] : 'main';

console.log(chalk.cyan.bold('\n🔄 AGI Farm — ECC Resources Updater\n'));

if (dryRun) {
  console.log(chalk.yellow('🏃 DRY RUN MODE — No changes will be made\n'));
}

// ── Step 1: Clone/Update ECC Repo ─────────────────────────────────────────────
console.log(chalk.dim('→ Fetching ECC repository...'));

if (fs.existsSync(TEMP_DIR)) {
  console.log(chalk.dim('  Using existing clone, pulling latest...'));
  try {
    execSync('git pull origin main', { cwd: TEMP_DIR, stdio: 'pipe' });
  } catch (err) {
    console.log(chalk.yellow('  Failed to pull, removing and re-cloning...'));
    execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'pipe' });
    execSync(`git clone "${ECC_REPO}" "${TEMP_DIR}"`, { stdio: 'pipe' });
  }
} else {
  execSync(`git clone "${ECC_REPO}" "${TEMP_DIR}"`, { stdio: 'pipe' });
}

// Checkout specific version if requested
if (targetVersion !== 'main') {
  console.log(chalk.dim(`  Checking out version: ${targetVersion}`));
  execSync(`git checkout ${targetVersion}`, { cwd: TEMP_DIR, stdio: 'pipe' });
}

// Get current commit SHA
const currentCommit = execSync('git rev-parse HEAD', {
  cwd: TEMP_DIR,
  encoding: 'utf-8'
}).trim();
const currentDate = execSync('git log -1 --format=%ci', {
  cwd: TEMP_DIR,
  encoding: 'utf-8'
}).trim();

console.log(chalk.green(`✓ ECC repo fetched (${currentCommit.substring(0, 8)})`));
console.log(chalk.dim(`  Date: ${currentDate}\n`));

// ── Step 2: Get Current Version ───────────────────────────────────────────────
let installedVersion = 'unknown';
if (fs.existsSync(VERSION_FILE)) {
  try {
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
    installedVersion = versionData.commit || 'unknown';
  } catch (err) {
    console.log(chalk.yellow('⚠ Could not read ECC_VERSION file'));
  }
}

console.log(chalk.dim('Current ECC version:'), installedVersion.substring(0, 8));
console.log(chalk.dim('Latest ECC version: '), currentCommit.substring(0, 8));

if (installedVersion === currentCommit) {
  console.log(chalk.green('\n✅ ECC resources are already up-to-date!\n'));
  process.exit(0);
}

console.log(chalk.yellow('\n⚡ Updates available\n'));

// ── Step 3: Map Source → Target Directories ───────────────────────────────────
const SYNC_MAP = [
  { src: 'agents', dest: 'agents', desc: 'Agent templates' },
  { src: 'skills', dest: 'skills', desc: 'Production skills' },
  { src: 'commands', dest: 'commands', desc: 'Slash commands' },
  { src: 'docs', dest: 'docs', desc: 'Documentation guides' },
  { src: 'rules', dest: 'rules', desc: 'Coding rules' },
  { src: 'examples', dest: 'examples', desc: 'Example configurations' },
  { src: 'schemas', dest: 'schemas', desc: 'JSON schemas' },
  { src: 'contexts', dest: 'contexts', desc: 'Context templates' },
];

const stats = {
  added: 0,
  modified: 0,
  removed: 0,
  unchanged: 0,
  errors: 0,
};

// ── Step 4: Sync Each Directory ───────────────────────────────────────────────
for (const { src, dest, desc } of SYNC_MAP) {
  const srcDir = path.join(TEMP_DIR, src);
  const destDir = path.join(ECC_RESOURCES_DIR, dest);

  if (!fs.existsSync(srcDir)) {
    console.log(chalk.dim(`  ↷ Skipping ${desc} (not in upstream)`));
    continue;
  }

  console.log(chalk.white(`\n📂 Syncing ${desc}...`));

  // Ensure destination exists
  if (!dryRun && !fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Get all .md files from source
  const srcFiles = getAllMarkdownFiles(srcDir);
  const destFiles = fs.existsSync(destDir) ? getAllMarkdownFiles(destDir) : [];

  // Check each source file
  for (const srcFile of srcFiles) {
    const relPath = path.relative(srcDir, srcFile);
    const destFile = path.join(destDir, relPath);
    const srcContent = fs.readFileSync(srcFile, 'utf-8');

    if (!fs.existsSync(destFile)) {
      // New file
      console.log(chalk.green(`  + ${relPath}`));
      if (!dryRun) {
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        fs.writeFileSync(destFile, srcContent, 'utf-8');
      }
      stats.added++;
    } else {
      // Check if modified
      const destContent = fs.readFileSync(destFile, 'utf-8');
      if (srcContent !== destContent) {
        console.log(chalk.yellow(`  ~ ${relPath}`));
        if (!dryRun) {
          fs.writeFileSync(destFile, srcContent, 'utf-8');
        }
        stats.modified++;
      } else {
        stats.unchanged++;
      }
    }
  }

  // Check for removed files
  for (const destFile of destFiles) {
    const relPath = path.relative(destDir, destFile);
    const srcFile = path.join(srcDir, relPath);

    if (!fs.existsSync(srcFile)) {
      console.log(chalk.red(`  - ${relPath}`));
      if (!dryRun) {
        fs.unlinkSync(destFile);
      }
      stats.removed++;
    }
  }
}

// ── Step 5: Update README and CHANGELOG Files ─────────────────────────────────
console.log(chalk.white('\n📄 Syncing meta files...'));

const metaFiles = [
  { src: 'README.md', dest: 'ECC_README.md' },
  { src: 'CHANGELOG.md', dest: 'ECC_CHANGELOG.md' },
  { src: 'AGENTS.md', dest: 'AGENTS.md' },
];

for (const { src, dest } of metaFiles) {
  const srcFile = path.join(TEMP_DIR, src);
  const destFile = path.join(ECC_RESOURCES_DIR, dest);

  if (fs.existsSync(srcFile)) {
    const srcContent = fs.readFileSync(srcFile, 'utf-8');

    if (!fs.existsSync(destFile)) {
      console.log(chalk.green(`  + ${dest}`));
      if (!dryRun) {
        fs.writeFileSync(destFile, srcContent, 'utf-8');
      }
      stats.added++;
    } else {
      const destContent = fs.readFileSync(destFile, 'utf-8');
      if (srcContent !== destContent) {
        console.log(chalk.yellow(`  ~ ${dest}`));
        if (!dryRun) {
          fs.writeFileSync(destFile, srcContent, 'utf-8');
        }
        stats.modified++;
      } else {
        stats.unchanged++;
      }
    }
  }
}

// ── Step 6: Update Version File ───────────────────────────────────────────────
if (!dryRun) {
  const versionData = {
    commit: currentCommit,
    date: currentDate,
    updated_at: new Date().toISOString(),
    previous_commit: installedVersion,
  };

  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2), 'utf-8');
  console.log(chalk.green(`\n✓ Updated ECC_VERSION file`));
}

// ── Step 7: Summary ────────────────────────────────────────────────────────────
console.log(chalk.cyan.bold('\n── Update Summary ──\n'));
console.log(chalk.green(`  Added:     ${stats.added} files`));
console.log(chalk.yellow(`  Modified:  ${stats.modified} files`));
console.log(chalk.red(`  Removed:   ${stats.removed} files`));
console.log(chalk.dim(`  Unchanged: ${stats.unchanged} files`));

if (stats.errors > 0) {
  console.log(chalk.red(`  Errors:    ${stats.errors}`));
}

if (dryRun) {
  console.log(chalk.yellow('\n🏃 DRY RUN — No changes were made'));
  console.log(chalk.dim('Run without --dry-run to apply changes\n'));
} else {
  console.log(chalk.green('\n✅ ECC resources updated successfully!'));
  console.log(chalk.dim(`From: ${installedVersion.substring(0, 8)}`));
  console.log(chalk.dim(`To:   ${currentCommit.substring(0, 8)}\n`));

  if (stats.added > 0 || stats.modified > 0 || stats.removed > 0) {
    console.log(chalk.yellow('⚠  Next steps:'));
    console.log(chalk.dim('   1. Review changes with: git diff ecc-resources/'));
    console.log(chalk.dim('   2. Test agents with new resources'));
    console.log(chalk.dim('   3. Update plugin version if needed'));
    console.log(chalk.dim('   4. Commit changes: git add ecc-resources/ && git commit'));
    console.log(chalk.dim('   5. Update CHANGELOG.md with ECC updates\n'));
  }
}

// Cleanup
console.log(chalk.dim('Cleaning up temp directory...'));
execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'pipe' });
console.log(chalk.green('✓ Done\n'));

process.exit(0);

// ── Helper Functions ───────────────────────────────────────────────────────────
function getAllMarkdownFiles(dir) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }

  return files;
}
