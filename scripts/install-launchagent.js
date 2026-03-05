#!/usr/bin/env node

/**
 * install-launchagent.js
 *
 * Installs a macOS LaunchAgent so the AGI Farm dashboard starts automatically
 * on login and stays alive independent of the OpenClaw gateway lifecycle.
 *
 * Usage:
 *   node scripts/install-launchagent.js [--uninstall] [--port 8080] [--host 127.0.0.1]
 *
 * Options:
 *   --uninstall   Remove the LaunchAgent and stop the dashboard
 *   --port PORT   Dashboard port (default: 8080)
 *   --host HOST   Dashboard bind address (default: 127.0.0.1)
 *   --workspace   OpenClaw workspace path (default: ~/.openclaw/workspace)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LABEL = 'ai.openclaw.agi-farm-dashboard';
const PLIST_NAME = `${LABEL}.plist`;
const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_PATH = path.join(LAUNCH_AGENTS_DIR, PLIST_NAME);
const LOG_DIR = '/tmp/openclaw';

// ── Parse CLI args ──────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    uninstall: false,
    port: '8080',
    host: '127.0.0.1',
    workspace: path.join(os.homedir(), '.openclaw', 'workspace'),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--uninstall') opts.uninstall = true;
    if (args[i] === '--port' && args[i + 1]) opts.port = args[++i];
    if (args[i] === '--host' && args[i + 1]) opts.host = args[++i];
    if (args[i] === '--workspace' && args[i + 1]) opts.workspace = args[++i];
  }

  return opts;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getNodePath() {
  try {
    return execFileSync('which', ['node'], { encoding: 'utf-8' }).trim();
  } catch {
    return '/opt/homebrew/opt/node/bin/node';
  }
}

function getSystemPath() {
  const defaults = '/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin';
  const nodeBin = path.dirname(getNodePath());
  if (defaults.includes(nodeBin)) return defaults;
  return `${nodeBin}:${defaults}`;
}

function getUid() {
  try {
    return execFileSync('id', ['-u'], { encoding: 'utf-8' }).trim();
  } catch {
    return String(process.getuid?.() ?? 501);
  }
}

function bootout() {
  try {
    execFileSync('launchctl', ['bootout', `gui/${getUid()}`, LABEL], { stdio: 'ignore' });
  } catch {
    // already unloaded
  }
}

// ── Uninstall ───────────────────────────────────────────────────────────────

function uninstall() {
  console.log(`\u{1F5D1}\uFE0F  Uninstalling LaunchAgent: ${LABEL}`);

  bootout();

  if (fs.existsSync(PLIST_PATH)) {
    fs.unlinkSync(PLIST_PATH);
    console.log(`   Removed ${PLIST_PATH}`);
  } else {
    console.log('   Plist not found (already removed)');
  }

  console.log('\u2705 LaunchAgent uninstalled. Dashboard will no longer auto-start.');
}

// ── Install ─────────────────────────────────────────────────────────────────

function install(opts) {
  console.log(`\u{1F680} Installing LaunchAgent: ${LABEL}`);

  const pluginDir = path.resolve(__dirname, '..');
  const dashboardScript = path.join(pluginDir, 'server', 'dashboard.js');

  if (!fs.existsSync(dashboardScript)) {
    console.error(`\u274C Dashboard script not found: ${dashboardScript}`);
    process.exit(1);
  }

  const nodePath = getNodePath();
  const systemPath = getSystemPath();

  // Read template
  const templatePath = path.join(pluginDir, 'templates', 'ai.openclaw.agi-farm-dashboard.plist.template');
  let plistContent;

  if (fs.existsSync(templatePath)) {
    plistContent = fs.readFileSync(templatePath, 'utf-8')
      .replace(/<%= nodePath %>/g, nodePath)
      .replace(/<%= dashboardScript %>/g, dashboardScript)
      .replace(/<%= port %>/g, opts.port)
      .replace(/<%= host %>/g, opts.host)
      .replace(/<%= workspace %>/g, opts.workspace)
      .replace(/<%= systemPath %>/g, systemPath)
      .replace(/<%= pluginDir %>/g, pluginDir)
      .replace(/<%= logDir %>/g, LOG_DIR);
  } else {
    // Fallback: generate plist inline
    plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${LABEL}</string>
    <key>ProgramArguments</key>
    <array>
      <string>${nodePath}</string>
      <string>${dashboardScript}</string>
      <string>--no-browser</string>
      <string>--port</string>
      <string>${opts.port}</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PATH</key>
      <string>${systemPath}</string>
      <key>AGI_FARM_DASHBOARD_PORT</key>
      <string>${opts.port}</string>
      <key>AGI_FARM_DASHBOARD_HOST</key>
      <string>${opts.host}</string>
      <key>AGI_FARM_WORKSPACE</key>
      <string>${opts.workspace}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${pluginDir}</string>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/agi-farm-dashboard.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/agi-farm-dashboard.err.log</string>
  </dict>
</plist>`;
  }

  // Ensure directories exist
  fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });

  // Unload existing if any
  bootout();

  // Write plist
  fs.writeFileSync(PLIST_PATH, plistContent, 'utf-8');
  console.log(`   Wrote ${PLIST_PATH}`);

  // Load
  const uid = getUid();
  try {
    execFileSync('launchctl', ['bootstrap', `gui/${uid}`, PLIST_PATH], { stdio: 'inherit' });
    console.log(`   Bootstrapped into gui/${uid}`);
  } catch {
    console.warn('   \u26A0\uFE0F  Bootstrap failed \u2014 trying legacy load...');
    try {
      execFileSync('launchctl', ['load', PLIST_PATH], { stdio: 'inherit' });
    } catch {
      console.error('   \u274C Failed to load LaunchAgent');
      process.exit(1);
    }
  }

  // Kickstart
  try {
    execFileSync('launchctl', ['kickstart', '-k', `gui/${uid}/${LABEL}`], { stdio: 'ignore' });
  } catch {
    // not critical
  }

  console.log('');
  console.log(`\u2705 Dashboard LaunchAgent installed!`);
  console.log(`   URL:       http://${opts.host}:${opts.port}`);
  console.log(`   Logs:      ${LOG_DIR}/agi-farm-dashboard.log`);
  console.log(`   Errors:    ${LOG_DIR}/agi-farm-dashboard.err.log`);
  console.log(`   Uninstall: node scripts/install-launchagent.js --uninstall`);
}

// ── Main ────────────────────────────────────────────────────────────────────

if (process.platform !== 'darwin') {
  console.error('\u274C LaunchAgent is macOS-only. On Linux, use systemd instead.');
  console.error('   See README for systemd instructions.');
  process.exit(1);
}

const opts = parseArgs();

if (opts.uninstall) {
  uninstall();
} else {
  install(opts);
}
