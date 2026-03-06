#!/usr/bin/env node
/**
 * AGI Farm Plugin — Configuration Validation
 *
 * Validates that all prerequisites are met for plugin installation.
 * Runs automatically on `npm install` or `openclaw plugin install`.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

const errors = [];
const warnings = [];

console.log(chalk.cyan.bold('\n🔍 AGI Farm — Validating Configuration\n'));

// ── 1. Check OpenClaw Installation ────────────────────────────────────────────
const openclawDir = path.join(os.homedir(), '.openclaw');
if (!fs.existsSync(openclawDir)) {
  errors.push('OpenClaw not installed. Install from: https://github.com/openclaw/openclaw');
} else {
  console.log(chalk.green('✓ OpenClaw directory found'));
}

// ── 2. Check Node.js Version ──────────────────────────────────────────────────
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  errors.push(`Node.js ${nodeVersion} is too old. Requires Node.js 18+.`);
  errors.push('Install from: https://nodejs.org/');
} else {
  console.log(chalk.green(`✓ Node.js ${nodeVersion} (>= 18)`));
}

// ── 3. Check mcporter Installation ───────────────────────────────────────────
try {
  const mcporterVersion = execSync('mcporter --version', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(chalk.green(`✓ mcporter installed (${mcporterVersion.trim()})`));
} catch (err) {
  warnings.push('mcporter CLI not found. MCP servers will not be available.');
  warnings.push('Install with: npm install -g mcporter');
}

// ── 4. Check mcporter Configuration ──────────────────────────────────────────
const mcporterConfig = path.join(os.homedir(), '.openclaw', 'config', 'mcporter.json');
if (!fs.existsSync(mcporterConfig)) {
  warnings.push('mcporter config not found at ~/.openclaw/config/mcporter.json');
  warnings.push('ECC MCP servers (memory, sequential-thinking, context7) need manual setup.');
  warnings.push('See: ECC_MCP_SETUP_GUIDE.md for installation instructions');
} else {
  try {
    const config = JSON.parse(fs.readFileSync(mcporterConfig, 'utf-8'));
    const serverCount = Object.keys(config.mcpServers || {}).length;
    console.log(chalk.green(`✓ mcporter config found (${serverCount} servers configured)`));
  } catch (err) {
    warnings.push(`mcporter config exists but is invalid: ${err.message}`);
  }
}

// ── 5. Check Plugin Installation ─────────────────────────────────────────────
// Determine if running from development directory or installed location
const currentDir = process.cwd();
const isDevMode = fs.existsSync(path.join(currentDir, 'ecc-resources'));
const pluginDir = isDevMode
  ? currentDir
  : path.join(os.homedir(), '.openclaw', 'extensions', 'agi-farm');

if (!fs.existsSync(pluginDir) && !isDevMode) {
  // During npm install, plugin may not be installed yet — skip this check
  console.log(chalk.dim('  ↷ Plugin not yet installed (normal during first install)'));
} else {
  if (isDevMode) {
    console.log(chalk.cyan('ℹ  Running from development directory'));
  } else {
    console.log(chalk.green('✓ AGI Farm plugin directory found'));
  }

  // Check ECC resources
  const eccDir = path.join(pluginDir, 'ecc-resources');
  if (fs.existsSync(eccDir)) {
    const eccFiles = fs.readdirSync(eccDir).length;
    console.log(chalk.green(`✓ ECC resources found (${eccFiles} directories)`));
  } else {
    errors.push('ECC resources directory missing. Plugin installation may be incomplete.');
  }

  // Check hooks directory
  const hooksDir = path.join(pluginDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookCount = fs.readdirSync(hooksDir).length;
    console.log(chalk.green(`✓ Hooks directory found (${hookCount} hooks)`));
  } else {
    warnings.push('Hooks directory missing. Quality automation will not be available.');
  }

  // Check templates directory
  const templatesDir = path.join(pluginDir, 'templates');
  if (fs.existsSync(templatesDir)) {
    const templateCount = fs.readdirSync(templatesDir).filter(f => f.startsWith('SOUL.md.')).length;
    console.log(chalk.green(`✓ Templates directory found (${templateCount} agent templates)`));
  } else {
    errors.push('Templates directory missing. Cannot generate agent SOUL.md files.');
  }
}

// ── 6. Check Workspace Directory ─────────────────────────────────────────────
const workspace = process.env.AGI_FARM_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
if (!fs.existsSync(workspace)) {
  warnings.push(`Workspace directory not found: ${workspace}`);
  warnings.push('Will be created automatically on first use.');
} else {
  console.log(chalk.green('✓ Workspace directory exists'));
}

// ── 7. Check Required Dependencies ───────────────────────────────────────────
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const requiredDeps = ['chalk', 'express'];
    const missingDeps = requiredDeps.filter(dep =>
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      warnings.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      warnings.push('Run: npm install');
    } else {
      console.log(chalk.green('✓ Required npm dependencies found'));
    }
  } catch (err) {
    warnings.push(`Could not parse package.json: ${err.message}`);
  }
}

// ── 8. Check Optional Features ───────────────────────────────────────────────
// Check if git is installed (for export functionality)
try {
  execSync('git --version', { stdio: 'pipe' });
  console.log(chalk.green('✓ git installed (export feature available)'));
} catch (err) {
  warnings.push('git not found. Export functionality will not work.');
}

// Check if gh CLI is installed (for PR creation)
try {
  const ghVersion = execSync('gh --version', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(chalk.green('✓ gh CLI installed (PR automation available)'));
} catch (err) {
  warnings.push('gh CLI not found. PR automation will not work.');
  warnings.push('Install from: https://cli.github.com/');
}

// ── 9. Display Results ────────────────────────────────────────────────────────
console.log('');

if (warnings.length > 0) {
  console.log(chalk.yellow.bold('⚠  Warnings:\n'));
  warnings.forEach(warning => {
    console.log(chalk.yellow(`   ${warning}`));
  });
  console.log('');
}

if (errors.length > 0) {
  console.log(chalk.red.bold('❌ Configuration Validation Failed:\n'));
  errors.forEach(error => {
    console.log(chalk.red(`   • ${error}`));
  });
  console.log('');
  console.log(chalk.yellow('Fix the errors above and try again.\n'));
  process.exit(1);
}

// ── 10. Success ───────────────────────────────────────────────────────────────
console.log(chalk.green.bold('✅ Configuration Valid\n'));
console.log(chalk.cyan('AGI Farm plugin is ready to use!'));
console.log(chalk.dim('Run: openclaw run agi-farm setup\n'));

process.exit(0);
