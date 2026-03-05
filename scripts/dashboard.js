#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DASHBOARD_JS = path.join(__dirname, '..', 'server', 'dashboard.js');
const LEGACY_EXT_DASHBOARD_JS = path.join(os.homedir(), '.openclaw', 'extensions', 'agi-farm', 'server', 'dashboard.js');
const DASHBOARD_JS = fs.existsSync(LOCAL_DASHBOARD_JS) ? LOCAL_DASHBOARD_JS : LEGACY_EXT_DASHBOARD_JS;

const args = process.argv.slice(2);
const noBrowser = args.includes('--no-browser');
const portIndex = args.indexOf('--port');
const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) || 8080 : 8080;

// ANSI color codes
const cyan = '\x1b[36m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

console.log(`\n${cyan}📊 AGI Farm — Dashboard${reset}\n`);

// Build args for dashboard.js
const dashboardArgs = [];
if (noBrowser) dashboardArgs.push('--no-browser');
if (portIndex !== -1) {
  dashboardArgs.push('--port', String(port));
}

console.log(`${dim}Starting dashboard on http://127.0.0.1:${port}${reset}`);
console.log(`${dim}Press Ctrl+C to stop${reset}\n`);

// Run dashboard server
const proc = spawn('node', [DASHBOARD_JS, ...dashboardArgs], { stdio: 'inherit' });

proc.on('error', (err) => {
  console.error(`\x1b[31mError:${reset}`, err.message);
  process.exit(1);
});

proc.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[31m\nDashboard exited with code ${code}${reset}\n`);
  }
});
