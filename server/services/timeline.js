import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { appendJsonl, ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const DEFAULT_TIMELINE = { events: [] };
const MAX_JSONL_LINES = 10000;

function nowIso() {
  return new Date().toISOString();
}

function safeParseJsonlLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export class TimelineService {
  constructor(workspace) {
    this.eventsJsonPath = path.join(workspace, 'PROJECT_EVENTS.json');
    this.eventsJsonlPath = path.join(workspace, 'PROJECT_EVENTS.jsonl');
    this.appendCount = 0;
    ensureJsonFile(this.eventsJsonPath, DEFAULT_TIMELINE);
  }

  append(event) {
    const row = {
      id: event?.id || crypto.randomUUID(),
      ts: event?.ts || nowIso(),
      project_id: event?.project_id || null,
      entity_type: event?.entity_type || 'system',
      entity_id: event?.entity_id || null,
      event_type: event?.event_type || 'event',
      severity: event?.severity || 'info',
      summary: event?.summary || '',
      payload: event?.payload || {},
    };
    appendJsonl(this.eventsJsonlPath, row);
    this.appendCount++;
    if (this.appendCount % 500 === 0) {
      this._tryRotate();
    }
    return row;
  }

  _tryRotate() {
    try {
      if (!fs.existsSync(this.eventsJsonlPath)) return;
      const stat = fs.statSync(this.eventsJsonlPath);
      // Rotate when file exceeds ~2MB
      if (stat.size < 2 * 1024 * 1024) return;
      const text = fs.readFileSync(this.eventsJsonlPath, 'utf-8');
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length <= MAX_JSONL_LINES) return;
      // Keep only the most recent half
      const kept = lines.slice(-Math.floor(MAX_JSONL_LINES / 2));
      fs.writeFileSync(this.eventsJsonlPath, kept.join('\n') + '\n', 'utf-8');
    } catch {
      // rotation failure is non-fatal
    }
  }

  list(projectId, { limit = 200 } = {}) {
    const rows = [];
    try {
      const raw = safeReadJson(this.eventsJsonPath, DEFAULT_TIMELINE);
      const fromJson = Array.isArray(raw?.events) ? raw.events : [];
      for (const row of fromJson) rows.push(row);
    } catch {
      // ignore
    }

    try {
      if (fs.existsSync(this.eventsJsonlPath)) {
        const text = fs.readFileSync(this.eventsJsonlPath, 'utf-8');
        for (const line of text.split('\n')) {
          if (!line.trim()) continue;
          const parsed = safeParseJsonlLine(line);
          if (parsed) rows.push(parsed);
        }
      }
    } catch {
      // ignore
    }

    const filtered = rows
      .filter((e) => !projectId || e.project_id === projectId)
      .sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
    return filtered.slice(0, Math.max(1, Math.min(Number(limit) || 200, 2000)));
  }
}
