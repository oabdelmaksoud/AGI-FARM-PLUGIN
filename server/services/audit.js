import path from 'path';
import { appendJsonl } from './storage.js';

export class AuditService {
  constructor(workspace) {
    this.workspace = workspace;
    this.auditPath = path.join(workspace, 'AUDIT_LOG.jsonl');
  }

  log(event, payload = {}) {
    appendJsonl(this.auditPath, {
      timestamp: new Date().toISOString(),
      event,
      payload,
    });
  }
}
