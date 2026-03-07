import crypto from 'crypto';
import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson, withFileLockSync } from './storage.js';

const DEFAULT_INDEX = { entries: [] };

export class MemoryService {
  constructor(workspace) {
    this.filePath = path.join(workspace, 'MEMORY_INDEX.json');
    ensureJsonFile(this.filePath, DEFAULT_INDEX);
  }

  list() {
    const data = safeReadJson(this.filePath, DEFAULT_INDEX);
    return Array.isArray(data.entries) ? data.entries : [];
  }

  upsert(entry) {
    const data = safeReadJson(this.filePath, DEFAULT_INDEX);
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const id = entry.id || crypto.randomUUID();
    const normalized = {
      id,
      sourceType: entry.sourceType || 'note',
      sourcePath: entry.sourcePath || '',
      summary: entry.summary || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      createdAt: entry.createdAt || new Date().toISOString(),
      lastUsedAt: entry.lastUsedAt || null,
      weight: Number.isFinite(entry.weight) ? entry.weight : 1,
      hash: entry.hash || crypto.createHash('sha256').update(`${entry.summary || ''}:${entry.sourcePath || ''}`).digest('hex'),
    };

    return withFileLockSync(this.filePath, () => {
      const freshData = safeReadJson(this.filePath, DEFAULT_INDEX);
      const freshEntries = Array.isArray(freshData.entries) ? freshData.entries : [];
      const idx2 = freshEntries.findIndex((e) => e.id === id || e.hash === normalized.hash);
      if (idx2 >= 0) freshEntries[idx2] = { ...freshEntries[idx2], ...normalized };
      else freshEntries.push(normalized);
      safeWriteJson(this.filePath, { entries: freshEntries });
      return normalized;
    });
  }

  search({ q = '', tags = [] } = {}) {
    const query = String(q || '').toLowerCase();
    const tagsLower = (Array.isArray(tags) ? tags : []).map((t) => String(t).toLowerCase());

    return this.list()
      .map((entry) => {
        const text = `${entry.summary} ${(entry.tags || []).join(' ')}`.toLowerCase();
        let score = 0;
        if (query && text.includes(query)) score += 4;
        for (const tag of tagsLower) {
          if ((entry.tags || []).map((t) => String(t).toLowerCase()).includes(tag)) score += 2;
        }
        if (entry.lastUsedAt) {
          const ageHours = Math.max(1, (Date.now() - new Date(entry.lastUsedAt).getTime()) / 3600000);
          score += Math.max(0, 2 - ageHours / 72);
        }
        score += Number(entry.weight || 0);
        return { entry, score };
      })
      .filter((row) => row.score > 0 || (!query && tagsLower.length === 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
      .map((row) => row.entry);
  }
}
