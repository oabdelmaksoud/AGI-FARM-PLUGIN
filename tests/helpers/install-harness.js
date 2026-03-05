import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

export function makeTempDir(prefix = 'agi-farm-install-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function runCommand(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd,
    env: opts.env,
    input: opts.input,
    timeout: opts.timeoutMs ?? 120000,
    encoding: 'utf-8',
  });

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
  };
}

export function createMockOpenClawEnv({
  repoRoot,
  tempRoot,
  baseEnv = process.env,
  failVersion = false,
}) {
  const binDir = path.join(tempRoot, 'mock-bin');
  fs.mkdirSync(binDir, { recursive: true });

  const logFile = path.join(tempRoot, 'mock-openclaw.log');
  const markerFile = path.join(tempRoot, 'mock-plugin-install.marker');
  const fixturePath = path.join(repoRoot, 'tests', 'fixtures', 'mock-openclaw.js');
  const wrapperPath = path.join(binDir, 'openclaw');

  const wrapper = `#!/usr/bin/env bash\nnode "${fixturePath}" "$@"\n`;
  fs.writeFileSync(wrapperPath, wrapper, { mode: 0o755 });

  const env = {
    ...baseEnv,
    PATH: `${binDir}:${baseEnv.PATH || ''}`,
    MOCK_OPENCLAW_LOG: logFile,
    MOCK_OPENCLAW_PLUGIN_MARKER: markerFile,
  };

  if (failVersion) {
    env.MOCK_OPENCLAW_FAIL_VERSION = '1';
  }

  return { env, logFile, markerFile, binDir };
}

export function npmPackToDir({ repoRoot, outDir, env }) {
  const packed = runCommand('npm', ['pack', '--json', '--pack-destination', outDir], {
    cwd: repoRoot,
    env,
    timeoutMs: 180000,
  });

  if (packed.status !== 0) {
    throw new Error(`npm pack failed: ${packed.stderr || packed.stdout}`);
  }

  const parsed = JSON.parse(packed.stdout);
  const fileName = parsed?.[0]?.filename;
  if (!fileName) {
    throw new Error(`npm pack output missing filename: ${packed.stdout}`);
  }

  return path.join(outDir, fileName);
}

export function binPath(prefix, binaryName) {
  return path.join(prefix, 'bin', binaryName);
}

export function readLogLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parseError: true, line };
      }
    });
}
