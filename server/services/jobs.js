import crypto from 'crypto';
import path from 'path';
import { appendJsonl, ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_TIMEOUT_MS = 300000;

const DEFAULT_JOBS = { jobs: [] };

function nowIso() {
  return new Date().toISOString();
}

function makeStep(kind, intent, idx) {
  return {
    id: crypto.randomUUID(),
    kind,
    skillId: null,
    assignedAgent: idx === 1 ? 'main' : 'forge',
    inputs: { intent },
    outputs: null,
    status: 'pending',
    attempt: 0,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    startedAt: null,
    endedAt: null,
    error: null,
  };
}

export function buildStepsFromIntent(intent) {
  return [
    makeStep('analyze', intent, 0),
    makeStep('execute', intent, 1),
    makeStep('finalize', intent, 2),
  ];
}

export class JobsService {
  constructor(workspace, auditService = null) {
    this.jobsPath = path.join(workspace, 'JOBS.json');
    this.runsPath = path.join(workspace, 'JOB_RUNS.jsonl');
    this.audit = auditService;
    this.onJobUpdated = null;
    ensureJsonFile(this.jobsPath, DEFAULT_JOBS);
  }

  setUpdateHook(fn) {
    this.onJobUpdated = typeof fn === 'function' ? fn : null;
  }

  _read() {
    return safeReadJson(this.jobsPath, DEFAULT_JOBS);
  }

  _write(data) {
    safeWriteJson(this.jobsPath, data);
  }

  _logRun(jobId, stepId, event, payload = {}) {
    appendJsonl(this.runsPath, { timestamp: nowIso(), jobId, stepId, event, payload });
  }

  list({ status, agent, createdAfter, projectId } = {}) {
    let jobs = this._read().jobs || [];
    if (status) jobs = jobs.filter((j) => j.status === status);
    if (agent) jobs = jobs.filter((j) => j.steps?.some((s) => s.assignedAgent === agent));
    if (createdAfter) jobs = jobs.filter((j) => new Date(j.createdAt) >= new Date(createdAfter));
    if (projectId) jobs = jobs.filter((j) => j.projectId === projectId);
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  get(jobId) {
    return (this._read().jobs || []).find((j) => j.id === jobId) || null;
  }

  create({ title, intent, priority = 'P2', requestedBy = 'human', tags = [], rootTaskId = null, projectId = null }) {
    const data = this._read();
    const job = {
      id: crypto.randomUUID(),
      title: title || `Job: ${String(intent || '').slice(0, 72)}`,
      intent: intent || '',
      status: 'pending',
      priority,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      requestedBy,
      rootTaskId,
      projectId,
      steps: buildStepsFromIntent(intent || ''),
      currentStep: 0,
      error: null,
      tags: Array.isArray(tags) ? tags : [],
      policyState: 'none',
    };
    data.jobs = Array.isArray(data.jobs) ? data.jobs : [];
    data.jobs.push(job);
    this._write(data);
    try { this.onJobUpdated?.(job, null); } catch { }
    this._logRun(job.id, null, 'job_created', { status: job.status });
    this.audit?.log('job_created', { jobId: job.id });
    return job;
  }

  update(jobId, updater) {
    const data = this._read();
    const idx = (data.jobs || []).findIndex((j) => j.id === jobId);
    if (idx < 0) return null;
    const prev = data.jobs[idx];
    const next = updater(data.jobs[idx]);
    data.jobs[idx] = { ...next, updatedAt: nowIso() };
    this._write(data);
    try { this.onJobUpdated?.(data.jobs[idx], prev); } catch { }
    return data.jobs[idx];
  }

  cancel(jobId) {
    const updated = this.update(jobId, (job) => {
      if (['complete', 'failed', 'cancelled', 'blocked'].includes(job.status)) return job;
      return { ...job, status: 'cancelled', error: job.error || null };
    });
    if (!updated) return { ok: false, error: 'job_not_found' };
    this._logRun(jobId, null, 'job_cancelled');
    this.audit?.log('job_cancelled', { jobId });
    return { ok: true, job: updated };
  }

  retry(jobId) {
    const updated = this.update(jobId, (job) => {
      if (job.status !== 'failed' && job.status !== 'blocked') return job;
      const steps = (job.steps || []).map((s, idx) => {
        if (idx < job.currentStep) return s;
        return {
          ...s,
          status: 'pending',
          startedAt: null,
          endedAt: null,
          error: null,
        };
      });
      return { ...job, status: 'pending', steps, error: null, policyState: 'none' };
    });

    if (!updated) return { ok: false, error: 'job_not_found' };
    this._logRun(jobId, null, 'job_retried');
    this.audit?.log('job_retried', { jobId });
    return { ok: true, job: updated };
  }

  getRunnableJobs(limit = 2) {
    return this.list().filter((j) => ['pending', 'running', 'waiting_approval'].includes(j.status)).slice(0, limit);
  }

  beginStep(jobId, stepId) {
    return this.update(jobId, (job) => {
      const stepIndex = (job.steps || []).findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return job;
      const step = job.steps[stepIndex];
      // Idempotent: if step already complete, don't duplicate state changes.
      if (step.status === 'complete') return job;
      const nextStep = {
        ...step,
        status: 'running',
        attempt: Number(step.attempt || 0) + 1,
        startedAt: nowIso(),
      };
      const steps = job.steps.slice();
      steps[stepIndex] = nextStep;
      this._logRun(jobId, stepId, 'step_started', { attempt: nextStep.attempt });
      return { ...job, status: 'running', currentStep: stepIndex, steps };
    });
  }

  completeStep(jobId, stepId, outputs = {}) {
    return this.update(jobId, (job) => {
      const stepIndex = (job.steps || []).findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return job;
      const step = job.steps[stepIndex];
      if (step.status === 'complete') return job;
      const nextStep = {
        ...step,
        status: 'complete',
        endedAt: nowIso(),
        outputs,
        error: null,
      };
      const steps = job.steps.slice();
      steps[stepIndex] = nextStep;
      const done = steps.every((s) => s.status === 'complete');
      this._logRun(jobId, stepId, 'step_completed');
      return {
        ...job,
        status: done ? 'complete' : 'pending',
        currentStep: done ? stepIndex : Math.min(stepIndex + 1, steps.length - 1),
        steps,
      };
    });
  }

  failStep(jobId, stepId, error) {
    return this.update(jobId, (job) => {
      const stepIndex = (job.steps || []).findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return job;
      const step = job.steps[stepIndex];
      const exceeded = Number(step.attempt || 0) >= Number(step.maxAttempts || DEFAULT_MAX_ATTEMPTS);
      const nextStep = {
        ...step,
        status: exceeded ? 'failed' : 'pending',
        endedAt: nowIso(),
        error: String(error || 'step_failed'),
      };
      const steps = job.steps.slice();
      steps[stepIndex] = nextStep;
      this._logRun(jobId, stepId, 'step_failed', { exceeded, error: nextStep.error });
      return {
        ...job,
        status: exceeded ? 'failed' : 'pending',
        error: exceeded ? nextStep.error : null,
        steps,
      };
    });
  }

  setWaitingApproval(jobId, reason) {
    return this.update(jobId, (job) => ({ ...job, status: 'waiting_approval', policyState: 'pending', error: reason || null }));
  }

  setBlocked(jobId, reason) {
    return this.update(jobId, (job) => ({ ...job, status: 'blocked', policyState: 'rejected', error: reason || 'blocked' }));
  }

  setApproved(jobId) {
    return this.update(jobId, (job) => ({ ...job, status: 'pending', policyState: 'approved', error: null }));
  }
}
