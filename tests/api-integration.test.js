import fs from 'fs';
import os from 'os';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';
import { jest } from '@jest/globals';

function mkWorkspace() {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-api-'));
  fs.mkdirSync(path.join(ws, 'comms', 'inboxes'), { recursive: true });
  fs.mkdirSync(path.join(ws, 'comms', 'outboxes'), { recursive: true });
  fs.writeFileSync(path.join(ws, 'TASKS.json'), '[]');
  fs.writeFileSync(path.join(ws, 'AGENT_STATUS.json'), '{}');
  fs.writeFileSync(path.join(ws, 'AGENT_PERFORMANCE.json'), '{}');
  fs.writeFileSync(path.join(ws, 'BUDGET.json'), '{}');
  fs.writeFileSync(path.join(ws, 'VELOCITY.json'), '{}');
  fs.writeFileSync(path.join(ws, 'OKRs.json'), '{}');
  fs.writeFileSync(path.join(ws, 'EXPERIMENTS.json'), '{}');
  fs.writeFileSync(path.join(ws, 'IMPROVEMENT_BACKLOG.json'), '{}');
  fs.writeFileSync(path.join(ws, 'SHARED_KNOWLEDGE.json'), '[]');
  fs.writeFileSync(path.join(ws, 'ALERTS.json'), '[]');
  fs.writeFileSync(path.join(ws, 'PROJECTS.json'), '[]');
  fs.writeFileSync(path.join(ws, 'MEMORY.md'), 'seed memory');
  return ws;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

async function waitForServer(baseUrl, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/session`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server_start_timeout');
}

async function waitFor(conditionFn, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await conditionFn();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

describe('Dashboard API integration', () => {
  jest.setTimeout(30000);

  test('jobs + approvals + usage + policy gate', async () => {
    const ws = mkWorkspace();
    const port = await freePort();

    fs.writeFileSync(path.join(ws, 'POLICIES.json'), JSON.stringify({
      rules: [
        { id: 'deny-cron-toggle', actionPattern: 'cron:toggle:*', requiresApproval: false, allowedAgents: ['*'], deny: true, reason: 'deny_test' },
        { id: 'sensitive-delete', actionPattern: 'delete:*', requiresApproval: true, allowedAgents: ['*'], deny: false, reason: 'approval_needed' },
        { id: 'default', actionPattern: '*', requiresApproval: false, allowedAgents: ['*'], deny: false, reason: 'allow' },
      ],
    }, null, 2));

    const proc = spawn('node', ['server/dashboard.js', '--no-browser', '--port', String(port), '--workspace', ws], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AGI_FARM_FEATURE_JOBS: '1',
        AGI_FARM_FEATURE_SKILLS: '1',
        AGI_FARM_FEATURE_MEMORY: '1',
        AGI_FARM_FEATURE_POLICY: '1',
        AGI_FARM_FEATURE_METERING: '1',
        AGI_FARM_FEATURE_APPROVALS: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stderr = [];
    proc.stderr.on('data', (d) => stderr.push(d.toString()));

    const baseUrl = `http://127.0.0.1:${port}`;
    try {
      await waitForServer(baseUrl);

      const sess = await fetch(`${baseUrl}/api/session`);
      const sessJson = await sess.json();
      const csrf = sessJson.csrfToken;

      const createRes = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({ intent: 'delete stale resources', priority: 'P1', tags: ['cleanup'] }),
      });
      expect(createRes.status).toBe(200);
      const createJson = await createRes.json();
      expect(createJson.jobId).toBeTruthy();

      const approval = await waitFor(async () => {
        const res = await fetch(`${baseUrl}/api/approvals`);
        const body = await res.json();
        return (body.approvals || []).find((a) => a.status === 'pending') || null;
      }, 12000);
      expect(approval).toBeTruthy();

      const approveRes = await fetch(`${baseUrl}/api/approvals/${approval.id}/approve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({ note: 'approved in test' }),
      });
      expect(approveRes.status).toBe(200);

      const meteringJobRes = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({ intent: 'research release readiness', priority: 'P2' }),
      });
      expect(meteringJobRes.status).toBe(200);

      const usageReady = await waitFor(async () => {
        const res = await fetch(`${baseUrl}/api/usage`);
        const body = await res.json();
        return (body?.totals?.tokensIn || 0) > 0 ? body : null;
      }, 12000);
      expect(usageReady).toBeTruthy();
      expect(usageReady.totals.estimatedCostUsd).toBeGreaterThan(0);

      const policyBlocked = await fetch(`${baseUrl}/api/cron/some-id/toggle`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
      });
      expect(policyBlocked.status).toBe(403);
      const blockedJson = await policyBlocked.json();
      expect(blockedJson.error).toBe('policy_denied');

      const listRes = await fetch(`${baseUrl}/api/jobs`);
      const listJson = await listRes.json();
      expect(Array.isArray(listJson.jobs)).toBe(true);
      expect(listJson.jobs.length).toBeGreaterThan(0);
    } finally {
      proc.kill('SIGTERM');
      await new Promise((resolve) => proc.on('close', resolve));
      if (stderr.length > 0) {
        const joined = stderr.join('');
        expect(joined).not.toContain('Unhandled');
      }
    }
  });
});
