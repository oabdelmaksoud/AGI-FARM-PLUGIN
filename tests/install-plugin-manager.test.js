import fs from 'fs';
import path from 'path';
import { describe, expect, test } from '@jest/globals';
import {
  makeTempDir,
  createMockOpenClawEnv,
  runCommand,
  readLogLines,
} from './helpers/install-harness.js';

const REPO_ROOT = process.cwd();

describe('install path: openclaw plugin manager', () => {
  test('plugin metadata contract is valid', () => {
    const pkgPath = path.join(REPO_ROOT, 'package.json');
    const pluginPath = path.join(REPO_ROOT, 'openclaw.plugin.json');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));

    expect(pkg.name).toBe('agi-farm');
    expect(pkg.openclaw?.extensions).toContain('dist/index.js');

    expect(plugin.id).toBe('agi-farm');
    expect(plugin.version).toBe(pkg.version);

    const handlers = (plugin.commands || []).map((c) => c.handler);
    expect(handlers.length).toBeGreaterThan(0);

    for (const handler of handlers) {
      const clean = String(handler).replace(/^\.\//, '');
      expect(fs.existsSync(path.join(REPO_ROOT, clean))).toBe(true);
    }
  });

  test('openclaw plugins install agi-farm is invoked and logged via mock gateway', () => {
    const tempRoot = makeTempDir('agi-farm-plugin-manager-');
    const { env, logFile, markerFile } = createMockOpenClawEnv({
      repoRoot: REPO_ROOT,
      tempRoot,
    });

    const result = runCommand('openclaw', ['plugins', 'install', 'agi-farm'], {
      env,
      timeoutMs: 30000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Installed plugin agi-farm');
    expect(fs.existsSync(markerFile)).toBe(true);
    expect(fs.readFileSync(markerFile, 'utf-8')).toBe('agi-farm');

    const logs = readLogLines(logFile);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((entry) => Array.isArray(entry.args)
      && entry.args[0] === 'plugins'
      && entry.args[1] === 'install'
      && entry.args[2] === 'agi-farm')).toBe(true);
  });
});
