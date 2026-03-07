import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// ── Per-file mutex for read-modify-write safety ──────────────────────────
const _locks = new Map();

function getLock(filePath) {
  if (!_locks.has(filePath)) {
    _locks.set(filePath, { queue: [], busy: false });
  }
  return _locks.get(filePath);
}

function acquireLock(filePath) {
  const lock = getLock(filePath);
  if (!lock.busy) {
    lock.busy = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => lock.queue.push(resolve));
}

function releaseLock(filePath) {
  const lock = getLock(filePath);
  if (lock.queue.length > 0) {
    const next = lock.queue.shift();
    next();
  } else {
    lock.busy = false;
  }
}

/**
 * Execute a synchronous read-modify-write callback while holding a per-file lock.
 * Prevents concurrent writes from overwriting each other.
 *   withFileLock(path, () => { const d = read(); modify(d); write(d); return d; })
 */
export function withFileLock(filePath, fn) {
  return acquireLock(filePath).then(() => {
    try {
      const result = fn();
      return result;
    } finally {
      releaseLock(filePath);
    }
  });
}

/**
 * Synchronous version for use in synchronous service methods.
 * Uses a simple busy-wait guard (Node.js is single-threaded so this
 * serialises within the same event-loop tick; the async version above
 * is needed only when callers are already async).
 */
export function withFileLockSync(filePath, fn) {
  const lock = getLock(filePath);
  if (lock.busy) {
    // Should not happen in single-tick sync paths, but guard anyway
    throw new Error(`concurrent_write_conflict: ${filePath}`);
  }
  lock.busy = true;
  try {
    return fn();
  } finally {
    releaseLock(filePath);
  }
}

// ── Core I/O ─────────────────────────────────────────────────────────────

export function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, `${filePath}.corrupt.${Date.now()}`);
      } catch {
        // best effort backup
      }
    }
    return fallback;
  }
}

export function safeWriteJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export function appendJsonl(filePath, row) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, 'utf-8');
}

export function ensureJsonFile(filePath, initialValue) {
  if (!fs.existsSync(filePath)) {
    safeWriteJson(filePath, initialValue);
  }
}

export function ensureDirPath(dirPath) {
  ensureDir(dirPath);
}
