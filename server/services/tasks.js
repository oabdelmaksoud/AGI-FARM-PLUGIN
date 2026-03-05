import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const VALID_STATUS = new Set(['pending', 'in-progress', 'needs_human_decision', 'blocked', 'failed', 'complete', 'cancelled']);
const STATUS_FLOW = {
  pending: new Set(['in-progress', 'needs_human_decision', 'blocked', 'cancelled', 'complete']),
  'in-progress': new Set(['needs_human_decision', 'blocked', 'failed', 'complete', 'cancelled', 'pending']),
  needs_human_decision: new Set(['pending', 'blocked', 'failed', 'complete', 'cancelled']),
  blocked: new Set(['pending', 'in-progress', 'cancelled', 'failed']),
  failed: new Set(['pending', 'in-progress', 'cancelled']),
  complete: new Set([]),
  cancelled: new Set([]),
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeTask(task) {
  return {
    id: String(task?.id || `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`),
    title: String(task?.title || 'Untitled task'),
    description: String(task?.description || ''),
    type: String(task?.type || 'dev'),
    priority: String(task?.priority || 'P2'),
    status: VALID_STATUS.has(String(task?.status || 'pending')) ? String(task?.status || 'pending') : 'pending',
    assigned_to: task?.assigned_to || '',
    depends_on: Array.isArray(task?.depends_on) ? task.depends_on.map(String) : [],
    project_id: task?.project_id || null,
    proc_id: task?.proc_id || null,
    sla: task?.sla || null,
    estimate: task?.estimate || null,
    actual: task?.actual || null,
    created_at: task?.created_at || nowIso(),
    updated_at: task?.updated_at || nowIso(),
    completed_at: task?.completed_at || null,
  };
}

function buildGraph(tasks) {
  const graph = new Map();
  for (const task of tasks) {
    graph.set(task.id, new Set(task.depends_on || []));
  }
  return graph;
}

function hasCycle(graph) {
  const visiting = new Set();
  const visited = new Set();

  function dfs(node) {
    if (visited.has(node)) return false;
    if (visiting.has(node)) return true;
    visiting.add(node);
    const edges = graph.get(node) || new Set();
    for (const next of edges) {
      if (!graph.has(next)) continue;
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}

export class TaskService {
  constructor(workspace) {
    this.tasksPath = path.join(workspace, 'TASKS.json');
    ensureJsonFile(this.tasksPath, []);
  }

  _read() {
    const raw = safeReadJson(this.tasksPath, []);
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
    return list.map((t) => normalizeTask(t));
  }

  _write(tasks) {
    safeWriteJson(this.tasksPath, tasks.map((t) => normalizeTask(t)));
  }

  list(filters = {}) {
    let rows = this._read();
    if (filters.project_id) rows = rows.filter((t) => t.project_id === filters.project_id);
    if (filters.status) rows = rows.filter((t) => t.status === filters.status);
    if (filters.assigned_to) rows = rows.filter((t) => t.assigned_to === filters.assigned_to);
    return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  get(id) {
    return this._read().find((t) => t.id === id) || null;
  }

  create(payload = {}) {
    const tasks = this._read();
    const next = normalizeTask({
      ...payload,
      status: payload.status || 'pending',
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    if (tasks.some((t) => t.id === next.id)) {
      throw new Error('task_id_conflict');
    }
    const graph = buildGraph([...tasks, next]);
    if (hasCycle(graph)) throw new Error('invalid_dependencies_cycle');
    tasks.push(next);
    this._write(tasks);
    return next;
  }

  update(id, patch = {}) {
    const tasks = this._read();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return null;

    const prev = tasks[idx];
    const targetStatus = patch.status ? String(patch.status) : prev.status;
    if (patch.status && !VALID_STATUS.has(targetStatus)) throw new Error('invalid_status');
    if (patch.status && prev.status !== targetStatus && !STATUS_FLOW[prev.status]?.has(targetStatus)) {
      throw new Error('invalid_status_transition');
    }

    const next = normalizeTask({
      ...prev,
      ...patch,
      updated_at: nowIso(),
      completed_at: targetStatus === 'complete'
        ? (prev.completed_at || nowIso())
        : (patch.completed_at || null),
    });
    tasks[idx] = next;
    const graph = buildGraph(tasks);
    if (hasCycle(graph)) throw new Error('invalid_dependencies_cycle');
    this._write(tasks);
    return next;
  }

  syncFromJob(job) {
    if (!job?.rootTaskId) return null;
    const statusMap = {
      pending: 'pending',
      running: 'in-progress',
      waiting_approval: 'needs_human_decision',
      blocked: 'blocked',
      failed: 'failed',
      complete: 'complete',
      cancelled: 'cancelled',
    };
    const mapped = statusMap[job.status] || 'pending';
    try {
      return this.update(job.rootTaskId, { status: mapped, actual: { jobId: job.id, updatedAt: job.updatedAt || nowIso() } });
    } catch {
      return null;
    }
  }
}
