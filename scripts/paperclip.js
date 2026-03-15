#!/usr/bin/env node
/**
 * AGI Farm — Paperclip Dashboard Launcher
 *
 * Starts the Paperclip server and opens the dashboard in a browser.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAPERCLIP_DIR = path.join(__dirname, '..', 'paperclip');
const PAPERCLIP_ENTRY = path.join(PAPERCLIP_DIR, 'server', 'src', 'index.ts');

const args = process.argv.slice(2);
const noBrowser = args.includes('--no-browser');
const portIndex = args.indexOf('--port');
const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) || 3100 : 3100;

const cyan = '\x1b[36m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

console.log(`\n${cyan}AGI Farm — Paperclip Dashboard${reset}\n`);
console.log(`${dim}Starting Paperclip on http://127.0.0.1:${port}${reset}`);
console.log(`${dim}Press Ctrl+C to stop${reset}\n`);

const proc = spawn('node', ['--import', 'tsx/esm', PAPERCLIP_ENTRY], {
  cwd: PAPERCLIP_DIR,
  env: {
    ...process.env,
    PAPERCLIP_HOST: '127.0.0.1',
    PORT: String(port),
    PAPERCLIP_PORT: String(port),
    PAPERCLIP_DEPLOYMENT_MODE: 'local_trusted',
    PAPERCLIP_DEPLOYMENT_EXPOSURE: 'private',
    SERVE_UI: 'true',
    PAPERCLIP_MIGRATION_AUTO_APPLY: 'true',
    PAPERCLIP_MIGRATION_PROMPT: 'never',
  },
  stdio: 'inherit',
});

if (!noBrowser) {
  // Wait a moment for Paperclip to start, then open browser
  setTimeout(async () => {
    try {
      const openModule = await import('open');
      await openModule.default(`http://127.0.0.1:${port}`);
    } catch {
      console.log(`${dim}Open http://127.0.0.1:${port} in your browser${reset}`);
    }
  }, 3000);
}

proc.on('error', (err) => {
  console.error(`\x1b[31mError:${reset}`, err.message);
  process.exit(1);
});

proc.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[31m\nPaperclip exited with code ${code}${reset}\n`);
  }
});
