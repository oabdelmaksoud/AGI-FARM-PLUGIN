import fs from 'fs';
import os from 'os';
import path from 'path';
import { MemoryService } from '../server/services/memory.js';
import { MeteringService } from '../server/services/metering.js';

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-mm-'));
}

describe('MemoryService', () => {
  test('upsert and search entries', () => {
    const ws = makeWorkspace();
    const svc = new MemoryService(ws);
    svc.upsert({ summary: 'Release notes analysis for v1.0', tags: ['release', 'analysis'] });
    svc.upsert({ summary: 'Build pipeline migration', tags: ['build'] });

    const found = svc.search({ q: 'release', tags: ['analysis'] });
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].summary.toLowerCase()).toContain('release');
  });
});

describe('MeteringService', () => {
  test('aggregates usage records', () => {
    const ws = makeWorkspace();
    const svc = new MeteringService(ws);
    svc.addRecord({ jobId: 'j1', agentId: 'main', model: 'm1', tokensIn: 10, tokensOut: 20, durationMs: 1000, estimatedCostUsd: 0.01 });
    svc.addRecord({ jobId: 'j2', agentId: 'main', model: 'm1', tokensIn: 5, tokensOut: 10, durationMs: 500, estimatedCostUsd: 0.02 });
    const usage = svc.getUsage();
    expect(usage.totals.tokensIn).toBe(15);
    expect(usage.totals.estimatedCostUsd).toBeCloseTo(0.03);
    expect(usage.perAgent.main.calls).toBe(2);
  });
});
