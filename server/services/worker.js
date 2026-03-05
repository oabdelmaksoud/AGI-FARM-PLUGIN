import { getFeatureFlags } from './feature-flags.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('step_timeout')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function inferActionForStep(step, job) {
  const text = `${job.intent || ''} ${step.kind || ''}`.toLowerCase();
  if (text.includes('delete')) return 'delete:resource';
  if (text.includes('export')) return 'export:bundle';
  return `job:${step.kind}`;
}

async function executeStepAdapter(step, job, skill, memoryHints) {
  const kind = String(step.kind || 'execute');
  if (kind === 'analyze') {
    await sleep(50);
    return {
      result: 'analysis_complete',
      summary: `Intent analyzed: ${String(job.intent || '').slice(0, 120)}`,
      skillId: skill?.id || null,
      memoryHints,
    };
  }
  if (kind === 'execute') {
    await sleep(80);
    return {
      result: 'execution_complete',
      artifact: `artifact://${job.id}/${step.id}`,
      skillId: skill?.id || null,
      memoryHints,
    };
  }
  if (kind === 'finalize') {
    await sleep(40);
    return {
      result: 'finalized',
      note: 'Job finalized and ready for downstream consumption',
      skillId: skill?.id || null,
      memoryHints,
    };
  }
  await sleep(30);
  return {
    result: `${kind}_complete`,
    skillId: skill?.id || null,
    memoryHints,
  };
}

export class WorkerService {
  constructor({ jobs, skills, memory, policy, metering, audit, onUpdate, concurrency = 2 }) {
    this.jobs = jobs;
    this.skills = skills;
    this.memory = memory;
    this.policy = policy;
    this.metering = metering;
    this.audit = audit;
    this.onUpdate = onUpdate;
    this.concurrency = concurrency;
    this.running = new Set();
    this.stopped = true;
    this.timer = null;
  }

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.timer = setInterval(() => this.tick().catch(() => {}), 1500);
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick() {
    if (this.stopped) return;
    const flags = getFeatureFlags();
    if (!flags.jobs) return;

    const jobs = this.jobs.getRunnableJobs(this.concurrency * 2);
    for (const job of jobs) {
      if (this.running.size >= this.concurrency) break;
      if (this.running.has(job.id)) continue;

      if (job.status === 'waiting_approval') {
        const state = this.policy?.getJobApprovalState(job.id);
        if (state === 'approved') {
          this.jobs.setApproved(job.id);
          this.audit?.log('job_approval_resumed', { jobId: job.id });
        }
        if (state === 'rejected') {
          this.jobs.setBlocked(job.id, 'approval_rejected');
          this.audit?.log('job_blocked_rejected', { jobId: job.id });
        }
        continue;
      }

      this.running.add(job.id);
      this.executeJob(job)
        .catch((err) => {
          this.audit?.log('worker_job_error', { jobId: job.id, error: String(err?.message || err) });
        })
        .finally(() => {
          this.running.delete(job.id);
          this.onUpdate?.();
        });
    }
  }

  async executeJob(job) {
    const step = (job.steps || [])[job.currentStep];
    if (!step) return;
    if (step.status === 'complete') return;

    const flags = getFeatureFlags();
    const skill = flags.skills ? this.skills?.matchSkill(job.intent, step.kind) : null;

    this.jobs.beginStep(job.id, step.id);
    this.audit?.log('step_started', { jobId: job.id, stepId: step.id, kind: step.kind, skillId: skill?.id || null });
    this.onUpdate?.();

    const refreshed = this.jobs.get(job.id);
    const currentStep = (refreshed?.steps || []).find((s) => s.id === step.id) || step;

    const action = inferActionForStep(currentStep, refreshed || job);
    if (flags.policy && this.policy) {
      const evalRes = this.policy.evaluate({ action, agentId: currentStep.assignedAgent || 'main' });
      if (evalRes.denied || !evalRes.allowed) {
        this.jobs.setBlocked(job.id, evalRes.reason || 'policy_denied');
        this.audit?.log('policy_denied', { jobId: job.id, stepId: step.id, action, rule: evalRes.rule?.id || null });
        this.onUpdate?.();
        return;
      }
      if (flags.approvals && evalRes.requiresApproval) {
        this.policy.createApproval({
          jobId: job.id,
          action,
          payload: { jobId: job.id, stepId: step.id, attempt: currentStep.attempt },
          reason: evalRes.reason || 'approval_required',
        });
        this.jobs.setWaitingApproval(job.id, evalRes.reason || 'approval_required');
        this.audit?.log('approval_requested', { jobId: job.id, stepId: step.id, action, rule: evalRes.rule?.id || null });
        this.onUpdate?.();
        return;
      }
    }

    const memoryHints = flags.memory && this.memory
      ? this.memory.search({ q: job.intent, tags: job.tags || [] }).slice(0, 3).map((m) => m.summary)
      : [];

    const startedAt = Date.now();
    try {
      if ((job.intent || '').toLowerCase().includes('fail-step') && currentStep.attempt <= 1) {
        throw new Error('simulated_failure');
      }
      const outputs = await withTimeout(
        executeStepAdapter(currentStep, refreshed || job, skill, memoryHints),
        Number(currentStep.timeoutMs || 300000)
      );
      this.jobs.completeStep(job.id, step.id, outputs);
    } catch (err) {
      this.jobs.failStep(job.id, step.id, String(err?.message || err || 'step_failed'));
      this.audit?.log('step_failed', { jobId: job.id, stepId: step.id, reason: String(err?.message || err) });
      this.onUpdate?.();
      return;
    }

    if (flags.metering && this.metering) {
      this.metering.addRecord({
        jobId: job.id,
        agentId: currentStep.assignedAgent || 'main',
        model: skill?.entrypoint || 'internal:default',
        tokensIn: 120,
        tokensOut: 240,
        durationMs: Date.now() - startedAt,
        estimatedCostUsd: 0.0032,
      });
    }

    if (flags.memory && this.memory) {
      this.memory.upsert({
        sourceType: 'job',
        sourcePath: `JOBS.json#${job.id}`,
        summary: `${job.title}: ${step.kind} complete`,
        tags: [...(job.tags || []), step.kind],
        lastUsedAt: new Date().toISOString(),
      });
    }

    this.audit?.log('step_completed', { jobId: job.id, stepId: step.id });
    this.onUpdate?.();
  }
}
