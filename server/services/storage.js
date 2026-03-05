import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

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
