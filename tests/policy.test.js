import fs from 'fs';
import os from 'os';
import path from 'path';
import { PolicyService } from '../server/services/policy.js';

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-policy-'));
}

describe('PolicyService', () => {
  test('evaluates and resolves approvals', () => {
    const ws = makeWorkspace();
    const svc = new PolicyService(ws);

    const evalRes = svc.evaluate({ action: 'delete:resource', agentId: 'main' });
    expect(evalRes.requiresApproval).toBe(true);

    const approval = svc.createApproval({ jobId: 'job1', action: 'delete:resource', payload: { a: 1 }, reason: 'test' });
    expect(approval.status).toBe('pending');

    const approved = svc.resolveApproval(approval.id, 'approved', 'tester', 'ok');
    expect(approved.ok).toBe(true);
    expect(svc.getJobApprovalState('job1')).toBe('approved');
  });
});
