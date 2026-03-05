import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { appendJsonl, ensureJsonFile, safeReadJson } from './storage.js';

const DEFAULT_TIMELINE = { events: [] };

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
    return row;
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
