import fs from 'fs';
import path from 'path';
import { describe, expect, test, jest } from '@jest/globals';
import {
  makeTempDir,
  runCommand,
  createMockOpenClawEnv,
  npmPackToDir,
  binPath,
} from './helpers/install-harness.js';

const REPO_ROOT = process.cwd();

describe('install path: npm global', () => {
  jest.setTimeout(240000);

  test('packs, installs globally to isolated prefix, exposes CLIs, and runs setup guarded cancel path', () => {
    const tempRoot = makeTempDir('agi-farm-install-global-');
    const prefix = path.join(tempRoot, 'prefix');
    const workspace = path.join(tempRoot, 'workspace');

    fs.mkdirSync(prefix, { recursive: true });
    fs.mkdirSync(path.join(workspace, 'agi-farm-bundle'), { recursive: true });
    fs.writeFileSync(
      path.join(workspace, 'agi-farm-bundle', 'team.json'),
      JSON.stringify({ team_name: 'ExistingTeam' }, null, 2),
      'utf-8'
    );

    const { env } = createMockOpenClawEnv({
      repoRoot: REPO_ROOT,
      tempRoot,
    });

    const tarballPath = npmPackToDir({
      repoRoot: REPO_ROOT,
      outDir: tempRoot,
      env,
    });
    expect(fs.existsSync(tarballPath)).toBe(true);

    const installed = runCommand('npm', ['install', '-g', '--prefix', prefix, tarballPath], {
      env,
      timeoutMs: 240000,
    });
    expect(installed.status).toBe(0);

    const requiredBins = ['agi-farm', 'agi-farm-status', 'agi-farm-dashboard', 'agi-farm-dispatch'];
    for (const bin of requiredBins) {
      expect(fs.existsSync(binPath(prefix, bin))).toBe(true);
    }

    const statusCmd = runCommand(binPath(prefix, 'agi-farm-status'), [], {
      env: {
        ...env,
        AGI_FARM_WORKSPACE: workspace,
      },
      timeoutMs: 30000,
    });
    expect(statusCmd.status).toBe(0);
    expect(statusCmd.stdout).toContain('AGI Farm');

    const setupCmd = runCommand(binPath(prefix, 'agi-farm'), [], {
      env: {
        ...env,
        AGI_FARM_WORKSPACE: workspace,
      },
      input: '\n',
      timeoutMs: 30000,
    });

    expect(setupCmd.status).toBe(0);
    expect(setupCmd.stdout).toContain('Setup cancelled');
    expect(setupCmd.stdout).toContain('active AGI Farm team');
  });

  test('setup preflight fails cleanly when OpenClaw is missing', () => {
    const tempRoot = makeTempDir('agi-farm-install-global-fail-');
    const prefix = path.join(tempRoot, 'prefix');
    fs.mkdirSync(prefix, { recursive: true });

    const { env } = createMockOpenClawEnv({
      repoRoot: REPO_ROOT,
      tempRoot,
      failVersion: true,
    });

    const tarballPath = npmPackToDir({
      repoRoot: REPO_ROOT,
      outDir: tempRoot,
      env,
    });

    const installed = runCommand('npm', ['install', '-g', '--prefix', prefix, tarballPath], {
      env,
      timeoutMs: 240000,
    });
    expect(installed.status).toBe(0);

    const setupCmd = runCommand(binPath(prefix, 'agi-farm'), [], {
      env,
      timeoutMs: 30000,
    });

    expect(setupCmd.status).toBe(1);
    expect(setupCmd.stderr).toContain('OpenClaw not found');
  });
});
