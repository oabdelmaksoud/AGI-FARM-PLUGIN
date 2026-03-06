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

  describe('wildcardMatch via evaluate()', () => {
    test('wildcard pattern * matches any action', () => {
      const ws = makeWorkspace();
      fs.writeFileSync(path.join(ws, 'POLICIES.json'), JSON.stringify({
        rules: [{ id: 'all', actionPattern: '*', requiresApproval: false, allowedAgents: ['*'], deny: false }],
      }));
      const svc = new PolicyService(ws);
      expect(svc.evaluate({ action: 'anything:here', agentId: 'main' }).allowed).toBe(true);
    });

    test('specific pattern does not match other actions', () => {
      const ws = makeWorkspace();
      fs.writeFileSync(path.join(ws, 'POLICIES.json'), JSON.stringify({
        rules: [{ id: 'delete', actionPattern: 'delete:*', requiresApproval: true, allowedAgents: ['*'], deny: false }],
      }));
      const svc = new PolicyService(ws);
      expect(svc.evaluate({ action: 'delete:resource', agentId: 'main' }).requiresApproval).toBe(true);
      expect(svc.evaluate({ action: 'create:resource', agentId: 'main' }).requiresApproval).toBe(false);
    });

    test('pattern with regex-special chars in literal prefix is matched exactly', () => {
      const ws = makeWorkspace();
      // Pattern contains a dot — should be treated as a literal dot, not a regex wildcard
      fs.writeFileSync(path.join(ws, 'POLICIES.json'), JSON.stringify({
        rules: [
          { id: 'dotted', actionPattern: 'a.b:*', requiresApproval: true, allowedAgents: ['*'], deny: false },
          { id: 'default', actionPattern: '*', requiresApproval: false, allowedAgents: ['*'], deny: false },
        ],
      }));
      const svc = new PolicyService(ws);
      // 'a.b:thing' should match 'a.b:*' (literal dot)
      expect(svc.evaluate({ action: 'a.b:thing', agentId: 'main' }).requiresApproval).toBe(true);
      // 'aXb:thing' should NOT match 'a.b:*' (dot is literal, not wildcard)
      expect(svc.evaluate({ action: 'aXb:thing', agentId: 'main' }).requiresApproval).toBe(false);
    });

    test('deny rule blocks action', () => {
      const ws = makeWorkspace();
      fs.writeFileSync(path.join(ws, 'POLICIES.json'), JSON.stringify({
        rules: [
          { id: 'deny-delete', actionPattern: 'delete:*', requiresApproval: false, allowedAgents: ['*'], deny: true },
          { id: 'default', actionPattern: '*', requiresApproval: false, allowedAgents: ['*'], deny: false },
        ],
      }));
      const svc = new PolicyService(ws);
      expect(svc.evaluate({ action: 'delete:resource', agentId: 'main' }).denied).toBe(true);
      expect(svc.evaluate({ action: 'create:resource', agentId: 'main' }).denied).toBe(false);
    });
  });
});
