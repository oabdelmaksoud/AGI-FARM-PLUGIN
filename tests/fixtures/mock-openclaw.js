#!/usr/bin/env node

import fs from 'fs';

function appendLog(entry) {
  const logPath = process.env.MOCK_OPENCLAW_LOG;
  if (!logPath) return;
  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf-8');
}

const args = process.argv.slice(2);
appendLog({ args, at: new Date().toISOString() });

if (process.env.MOCK_OPENCLAW_FAIL_VERSION === '1' && args[0] === '--version') {
  console.error('openclaw mock: version check failed');
  process.exit(1);
}

if (args[0] === '--version') {
  console.log('openclaw 0.0.0-mock');
  process.exit(0);
}

if (args[0] === 'plugins' && args[1] === 'install') {
  const pluginId = args[2] || '';
  const markerPath = process.env.MOCK_OPENCLAW_PLUGIN_MARKER;
  if (markerPath) {
    fs.writeFileSync(markerPath, pluginId, 'utf-8');
  }
  console.log(`Installed plugin ${pluginId} (mock)`);
  process.exit(0);
}

if (args[0] === 'plugins' && args[1] === 'list') {
  console.log('agi-farm\tinstalled');
  process.exit(0);
}

if (args[0] === 'agents' && args[1] === 'add') {
  const name = args.find((a) => !a.startsWith('--') && a !== 'agents' && a !== 'add') || 'agent';
  console.log(`Added agent ${name}`);
  process.exit(0);
}

if (args[0] === 'agents' && args[1] === 'list' && args.includes('--json')) {
  console.log(JSON.stringify([
    { id: 'sage', identityName: 'Sage', identityEmoji: '🔮', model: 'mock-model' },
    { id: 'forge', identityName: 'Forge', identityEmoji: '⚒️', model: 'mock-model' },
  ]));
  process.exit(0);
}

if (args[0] === 'cron' && args[1] === 'list') {
  console.log('ID STATUS SCHEDULE NEXT AGENT');
  console.log('daily-ok ok 0 0 sage');
  process.exit(0);
}

console.error(`openclaw mock: unsupported command: ${args.join(' ')}`);
process.exit(1);
