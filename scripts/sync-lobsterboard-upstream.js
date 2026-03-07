#!/usr/bin/env node

/**
 * LobsterBoard Upstream Sync Script
 *
 * Tracks upstream changes from https://github.com/Curbob/LobsterBoard and
 * snapshots selected upstream files into this repository for parity work.
 *
 * Usage:
 *   node scripts/sync-lobsterboard-upstream.js
 *   node scripts/sync-lobsterboard-upstream.js --dry-run
 *   node scripts/sync-lobsterboard-upstream.js --force
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPO_URL = 'https://github.com/Curbob/LobsterBoard.git';
const VERSION_FILE = path.join(PLUGIN_ROOT, 'lobsterboard-resources', 'LOBSTERBOARD_VERSION');
const SNAPSHOT_ROOT = path.join(PLUGIN_ROOT, 'upstream', 'lobsterboard');
const META_FILE = path.join(SNAPSHOT_ROOT, 'SYNC_META.json');

const SNAPSHOT_PATHS = [
  'README.md',
  'WIDGETS-STATUS.md',
  'server.cjs',
  'config.example.json',
  'js/widgets.js',
  'pages/README.md',
  'templates/README.md',
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

function parseTrackedCommit(versionFileContent = '') {
  const m = versionFileContent.match(/COMMIT:\s*([a-f0-9]+)/i);
  return m ? m[1] : null;
}

async function readTrackedCommit() {
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf-8');
    return parseTrackedCommit(content);
  } catch {
    return null;
  }
}

function cloneUpstreamToTemp() {
  const tempDir = path.join(os.tmpdir(), `lobsterboard-sync-${Date.now()}`);
  execSync(`git clone --depth 1 ${REPO_URL} "${tempDir}"`, { stdio: 'pipe' });
  const commit = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  const commitDate = execSync('git log -1 --format=%cd --date=iso-strict', { cwd: tempDir, encoding: 'utf-8' }).trim();
  return { tempDir, commit, commitDate };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copySnapshotFiles(srcRoot) {
  for (const rel of SNAPSHOT_PATHS) {
    const src = path.join(srcRoot, rel);
    const dest = path.join(SNAPSHOT_ROOT, rel);
    await ensureDir(path.dirname(dest));
    const content = await fs.readFile(src, 'utf-8');
    await fs.writeFile(dest, content, 'utf-8');
  }
}

async function writeTrackingFiles(commit, commitDate) {
  await ensureDir(path.dirname(VERSION_FILE));
  await ensureDir(SNAPSHOT_ROOT);

  const versionBody = `# LobsterBoard Upstream Tracking
#
# Tracks which LobsterBoard commit is mirrored for feature-parity work.

REPOSITORY: ${REPO_URL}
COMMIT: ${commit}
COMMIT_DATE: ${commitDate}
SYNCED_AT: ${new Date().toISOString()}
`;

  const meta = {
    repository: REPO_URL,
    commit,
    commitDate,
    syncedAt: new Date().toISOString(),
    files: SNAPSHOT_PATHS,
  };

  await fs.writeFile(VERSION_FILE, versionBody, 'utf-8');
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

async function main() {
  const tracked = await readTrackedCommit();
  const { tempDir, commit, commitDate } = cloneUpstreamToTemp();

  const changed = tracked !== commit;
  console.log(`[lobsterboard-sync] tracked=${tracked ? tracked.slice(0, 7) : 'none'} latest=${commit.slice(0, 7)}`);

  if (!changed && !isForce) {
    console.log('[lobsterboard-sync] Upstream unchanged. No snapshot update needed.');
    await fs.rm(tempDir, { recursive: true, force: true });
    return;
  }

  if (isDryRun) {
    console.log('[lobsterboard-sync] Dry run: upstream changes detected; snapshot not written.');
    await fs.rm(tempDir, { recursive: true, force: true });
    return;
  }

  await copySnapshotFiles(tempDir);
  await writeTrackingFiles(commit, commitDate);
  await fs.rm(tempDir, { recursive: true, force: true });

  console.log('[lobsterboard-sync] Snapshot updated successfully.');
}

main().catch((err) => {
  console.error(`[lobsterboard-sync] Failed: ${err.message}`);
  process.exit(1);
});
