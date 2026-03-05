import fs from 'fs';
import os from 'os';
import path from 'path';
import { JobsService } from '../server/services/jobs.js';

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agi-farm-jobs-'));
}

describe('JobsService', () => {
  test('create and complete a job', () => {
    const ws = makeWorkspace();
    const svc = new JobsService(ws);
    const job = svc.create({ intent: 'research release notes', tags: ['research'] });
    expect(job.id).toBeTruthy();
    expect(job.steps.length).toBe(3);

    let loaded = svc.get(job.id);
    const step = loaded.steps[0];
    svc.beginStep(job.id, step.id);
    svc.completeStep(job.id, step.id, { result: 'ok' });

    loaded = svc.get(job.id);
    expect(loaded.steps[0].status).toBe('complete');
  });

  test('cancel and retry behavior', () => {
    const ws = makeWorkspace();
    const svc = new JobsService(ws);
    const job = svc.create({ intent: 'build project' });
    const step = job.steps[0];

    svc.beginStep(job.id, step.id);
    svc.failStep(job.id, step.id, 'boom');
    svc.beginStep(job.id, step.id);
    svc.failStep(job.id, step.id, 'boom2');

    let loaded = svc.get(job.id);
    expect(loaded.status).toBe('failed');

    const retried = svc.retry(job.id);
    expect(retried.ok).toBe(true);
    loaded = svc.get(job.id);
    expect(loaded.status).toBe('pending');

    const cancelled = svc.cancel(job.id);
    expect(cancelled.ok).toBe(true);
    expect(svc.get(job.id).status).toBe('cancelled');
  });
});
