import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { describe, expect, test, jest } from '@jest/globals';
import { makeTempDir, runCommand } from './helpers/install-harness.js';

const REPO_ROOT = process.cwd();

describe('install path: source build', () => {
  jest.setTimeout(300000);

  test('clean clone installs dependencies, builds dist, and loads extension factory', async () => {
    const tempRoot = makeTempDir('agi-farm-source-install-');
    const cloneDir = path.join(tempRoot, 'repo-clone');

    const cloned = runCommand('git', ['clone', '--depth', '1', REPO_ROOT, cloneDir], {
      timeoutMs: 120000,
    });
    expect(cloned.status).toBe(0);

    const install = runCommand('npm', ['install'], {
      cwd: cloneDir,
      timeoutMs: 240000,
    });
    expect(install.status).toBe(0);

    const build = runCommand('npm', ['run', 'build'], {
      cwd: cloneDir,
      timeoutMs: 180000,
    });
    expect(build.status).toBe(0);

    const distIndex = path.join(cloneDir, 'dist', 'index.js');
    expect(fs.existsSync(distIndex)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(cloneDir, 'package.json'), 'utf-8'));
    const plugin = JSON.parse(fs.readFileSync(path.join(cloneDir, 'openclaw.plugin.json'), 'utf-8'));

    const mod = await import(pathToFileURL(distIndex).href);
    expect(typeof mod.default).toBe('function');

    const ext = mod.default({ autoStartDashboard: false, autoCheckUpdates: false });
    expect(ext.id).toBe('agi-farm');
    expect(ext.version).toBe(pkg.version);

    for (const command of plugin.commands || []) {
      const handler = String(command.handler || '').replace(/^\.\//, '');
      expect(fs.existsSync(path.join(cloneDir, handler))).toBe(true);
    }
  });
});
