import crypto from 'crypto';

function tokenize(input) {
  return new Set(
    String(input || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3)
  );
}

function overlapScore(a, b) {
  if (!a.size || !b.size) return 0;
  let match = 0;
  for (const token of a) if (b.has(token)) match += 1;
  return match / Math.max(a.size, b.size);
}

function toSafeName(input) {
  const text = String(input || '').trim();
  return text.length > 0 ? text : 'Untitled Initiative';
}

export class IntakeService {
  constructor({ projects, tasks, jobs, timeline }) {
    this.projects = projects;
    this.tasks = tasks;
    this.jobs = jobs;
    this.timeline = timeline;
  }

  decideProject(payload) {
    const projects = this.projects.listRaw();
    const hint = String(payload.project_hint || '').trim().toLowerCase();
    if (hint) {
      const byId = projects.find((p) => String(p.id).toLowerCase() === hint);
      if (byId) {
        return { decision: 'attach_existing', confidence: 1, matched_project_id: byId.id, reasons: ['project_hint_exact_id'] };
      }
      const byName = projects.find((p) => String(p.name).toLowerCase() === hint);
      if (byName) {
        return { decision: 'attach_existing', confidence: 0.98, matched_project_id: byName.id, reasons: ['project_hint_exact_name'] };
      }
    }

    const intentTokens = tokenize(`${payload.title || ''} ${payload.intent || ''} ${(payload.tags || []).join(' ')}`);
    let best = null;
    for (const project of projects) {
      if (String(project.status || '').toLowerCase() === 'archived') continue;
      const projectTokens = tokenize(`${project.name || ''} ${project.description || ''} ${project.objective || ''} ${(project.tags || []).join(' ')}`);
      const score = overlapScore(intentTokens, projectTokens);
      if (!best || score > best.score) best = { project, score };
    }
    if (best && best.score >= 0.25) {
      return {
        decision: 'attach_existing',
        confidence: Number(best.score.toFixed(2)),
        matched_project_id: best.project.id,
        reasons: ['semantic_overlap'],
      };
    }
    return { decision: 'create_new', confidence: best ? Number(best.score.toFixed(2)) : 0, matched_project_id: null, reasons: ['no_strong_match'] };
  }

  submit(rawPayload = {}) {
    const payload = {
      title: toSafeName(rawPayload.title || rawPayload.intent),
      intent: String(rawPayload.intent || rawPayload.title || ''),
      description: String(rawPayload.description || ''),
      priority: String(rawPayload.priority || 'P2'),
      tags: Array.isArray(rawPayload.tags) ? rawPayload.tags.map(String) : [],
      project_hint: rawPayload.project_hint || null,
      constraints: rawPayload.constraints && typeof rawPayload.constraints === 'object' ? rawPayload.constraints : {},
    };
    if (!payload.intent.trim()) throw new Error('intent_required');

    const intakeId = crypto.randomUUID();
    const decision = this.decideProject(payload);

    let project;
    let createdProject = false;
    if (decision.decision === 'attach_existing' && decision.matched_project_id) {
      project = this.projects.get(decision.matched_project_id) || this.projects.listRaw().find((p) => p.id === decision.matched_project_id);
    }
    if (!project) {
      project = this.projects.create({
        name: payload.title,
        description: payload.description || payload.intent,
        objective: payload.intent,
        status: 'active',
        owner: 'main',
        team: ['main', 'forge', 'sage'],
        target_completion: payload.constraints.deadline || null,
        tags: payload.tags,
        budget: {
          allocated_usd: Number(payload.constraints.budget_usd || 0),
          spent_usd: 0,
          forecast_usd: Number(payload.constraints.budget_usd || 0),
          alert_threshold: 0.8,
        },
      });
      createdProject = true;
    }

    const task = this.tasks.create({
      title: payload.title,
      description: payload.description || payload.intent,
      type: 'project',
      priority: payload.priority,
      status: 'pending',
      assigned_to: project.owner || 'main',
      depends_on: [],
      project_id: project.id,
      sla: payload.constraints.deadline ? { deadline: payload.constraints.deadline } : null,
      estimate: null,
    });
    this.projects.linkTask(project.id, task.id);

    const job = this.jobs.create({
      title: payload.title,
      intent: payload.intent,
      priority: payload.priority,
      requestedBy: 'human',
      tags: payload.tags,
      rootTaskId: task.id,
      projectId: project.id,
    });
    this.projects.linkJob(project.id, job.id);

    this.timeline?.append({
      project_id: project.id,
      entity_type: 'intake',
      entity_id: intakeId,
      event_type: 'intake_submitted',
      summary: payload.title,
      payload: { payload, decision },
    });

    return {
      intakeId,
      decision: decision.decision,
      confidence: decision.confidence,
      matched_project_id: decision.matched_project_id,
      reasons: decision.reasons,
      fallback_created: createdProject,
      projectId: project.id,
      createdProject,
      jobId: job.id,
      taskIds: [task.id],
    };
  }
}
