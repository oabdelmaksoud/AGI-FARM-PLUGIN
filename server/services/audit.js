import fs from 'fs';
import path from 'path';
import { appendJsonl } from './storage.js';

const MAX_AUDIT_SIZE = 5 * 1024 * 1024; // 5MB

export class AuditService {
  constructor(workspace) {
    this.workspace = workspace;
    this.auditPath = path.join(workspace, 'AUDIT_LOG.jsonl');
    this.writeCount = 0;
  }

  log(event, payload = {}) {
    appendJsonl(this.auditPath, {
      timestamp: new Date().toISOString(),
      event,
      payload,
    });
    this.writeCount++;
    if (this.writeCount % 1000 === 0) {
      this._tryRotate();
    }
  }

  _tryRotate() {
    try {
      if (!fs.existsSync(this.auditPath)) return;
      const stat = fs.statSync(this.auditPath);
      if (stat.size < MAX_AUDIT_SIZE) return;
      const text = fs.readFileSync(this.auditPath, 'utf-8');
      const lines = text.split('\n').filter((l) => l.trim());
      // Keep the most recent half
      const kept = lines.slice(-Math.floor(lines.length / 2));
      fs.writeFileSync(this.auditPath, kept.join('\n') + '\n', 'utf-8');
    } catch {
      // rotation failure is non-fatal
    }
  }
}
