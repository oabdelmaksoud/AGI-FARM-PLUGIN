import fs from 'fs';
import os from 'os';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';
import { jest } from '@jest/globals';

function mkWorkspace() {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-intake-'));
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

describe('Intake + Projects APIs', () => {
  jest.setTimeout(30000);

  test('intake creates/links projects, tasks, jobs, and timeline', async () => {
    const ws = mkWorkspace();
    const port = await freePort();
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

    const baseUrl = `http://127.0.0.1:${port}`;
    try {
      await waitForServer(baseUrl);
      const sess = await fetch(`${baseUrl}/api/session`);
      const csrf = (await sess.json()).csrfToken;

      const intakeRes = await fetch(`${baseUrl}/api/intake/task`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({
          title: 'Build onboarding flow',
          intent: 'Design and implement onboarding with analytics',
          description: 'enterprise onboarding epic',
          priority: 'P1',
          tags: ['product', 'frontend'],
          constraints: { budget_usd: 1000 },
        }),
      });
      expect(intakeRes.status).toBe(200);
      const intake = await intakeRes.json();
      expect(intake.projectId).toBeTruthy();
      expect(intake.taskIds.length).toBeGreaterThan(0);
      expect(intake.jobId).toBeTruthy();

      const projectsRes = await fetch(`${baseUrl}/api/projects`);
      const projectsBody = await projectsRes.json();
      const project = (projectsBody.projects || []).find((p) => p.id === intake.projectId);
      expect(project).toBeTruthy();

      const addTaskRes = await fetch(`${baseUrl}/api/projects/${intake.projectId}/tasks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({ title: 'Implement UI workflow', priority: 'P2' }),
      });
      expect(addTaskRes.status).toBe(200);

      const budgetRes = await fetch(`${baseUrl}/api/projects/${intake.projectId}/budget`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify({ allocated_usd: 2000, forecast_usd: 1500, spent_usd: 300 }),
      });
      expect(budgetRes.status).toBe(200);

      const timelineRes = await fetch(`${baseUrl}/api/projects/${intake.projectId}/timeline?limit=50`);
      expect(timelineRes.status).toBe(200);
      const timeline = await timelineRes.json();
      expect(Array.isArray(timeline.events)).toBe(true);
      expect(timeline.events.length).toBeGreaterThan(0);
    } finally {
      proc.kill('SIGTERM');
      await new Promise((resolve) => proc.on('close', resolve));
    }
  });
});
