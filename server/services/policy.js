import crypto from 'crypto';
import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const DEFAULT_POLICIES = {
  rules: [
    {
      id: 'default-low-risk',
      actionPattern: '*',
      requiresApproval: false,
      allowedAgents: ['*'],
      deny: false,
      reason: 'default allow',
    },
    {
      id: 'sensitive-delete',
      actionPattern: 'delete:*',
      requiresApproval: true,
      allowedAgents: ['main', 'vigil'],
      deny: false,
      reason: 'delete actions require approval',
    },
  ],
};

const DEFAULT_APPROVALS = { approvals: [] };

function wildcardMatch(text, pattern) {
  if (pattern === '*' || !pattern) return true;
  const rx = new RegExp(`^${String(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
  return rx.test(text);
}

export class PolicyService {
  constructor(workspace) {
    this.policiesPath = path.join(workspace, 'POLICIES.json');
    this.approvalsPath = path.join(workspace, 'APPROVALS.json');
    ensureJsonFile(this.policiesPath, DEFAULT_POLICIES);
    ensureJsonFile(this.approvalsPath, DEFAULT_APPROVALS);
  }

  getPolicies() {
    return safeReadJson(this.policiesPath, DEFAULT_POLICIES);
  }

  evaluate({ action, agentId }) {
    const rules = (this.getPolicies().rules || []).slice();
    const matching = rules
      .filter((rule) => wildcardMatch(action, rule.actionPattern))
      .map((rule) => ({
        rule,
        // Prefer more specific action patterns over catch-all rules.
        score: String(rule.actionPattern || '').replace(/\*/g, '').length,
      }))
      .sort((a, b) => b.score - a.score);

    for (const row of matching) {
      const rule = row.rule;
      const allowed = Array.isArray(rule.allowedAgents) ? rule.allowedAgents : ['*'];
      if (!allowed.includes('*') && !allowed.includes(agentId)) {
        return { allowed: false, denied: true, requiresApproval: false, rule, reason: 'agent_not_allowed' };
      }
      return {
        allowed: !rule.deny,
        denied: !!rule.deny,
        requiresApproval: !!rule.requiresApproval,
        rule,
        reason: rule.reason || '',
      };
    }
    return { allowed: true, denied: false, requiresApproval: false, rule: null, reason: 'no_matching_rule' };
  }

  listApprovals() {
    const data = safeReadJson(this.approvalsPath, DEFAULT_APPROVALS);
    return Array.isArray(data.approvals) ? data.approvals : [];
  }

  createApproval({ jobId, action, payload, reason }) {
    const data = safeReadJson(this.approvalsPath, DEFAULT_APPROVALS);
    const approvals = Array.isArray(data.approvals) ? data.approvals : [];
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    const approval = {
      id: crypto.randomUUID(),
      jobId,
      action,
      payloadHash,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
      resolver: null,
      note: reason || '',
    };
    approvals.push(approval);
    safeWriteJson(this.approvalsPath, { approvals });
    return approval;
  }

  resolveApproval(id, status, resolver, note) {
    const data = safeReadJson(this.approvalsPath, DEFAULT_APPROVALS);
    const approvals = Array.isArray(data.approvals) ? data.approvals : [];
    const idx = approvals.findIndex((a) => a.id === id);
    if (idx < 0) return { ok: false, error: 'approval_not_found' };
    if (approvals[idx].status !== 'pending') return { ok: false, error: 'approval_already_resolved' };

    approvals[idx] = {
      ...approvals[idx],
      status,
      resolvedAt: new Date().toISOString(),
      resolver: resolver || 'human',
      note: note || approvals[idx].note || '',
    };
    safeWriteJson(this.approvalsPath, { approvals });
    return { ok: true, approval: approvals[idx] };
  }

  getJobApprovalState(jobId) {
    const approvals = this.listApprovals().filter((a) => a.jobId === jobId);
    if (approvals.some((a) => a.status === 'rejected')) return 'rejected';
    if (approvals.some((a) => a.status === 'pending')) return 'pending';
    if (approvals.some((a) => a.status === 'approved')) return 'approved';
    return 'none';
  }
}
