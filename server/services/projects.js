import crypto from 'crypto';
import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson, withFileLockSync } from './storage.js';
import { enrichProjects } from '../utils.js';

const DEFAULT_STORE = {
  version: 1,
  defaults: {
    auto_project_channel: true,
    execution_path: 'agi-farm-first',
  },
  projects: [],
};

function nowIso() {
  return new Date().toISOString();
}

function toSlug(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'project';
}

function normalizeStore(raw) {
  if (Array.isArray(raw)) {
    return {
      ...DEFAULT_STORE,
      version: 1,
      projects: raw,
    };
  }

  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STORE };

  const hasLegacyItems = Array.isArray(raw.items);

  return {
    version: Number(raw.version) || 1,
    defaults: {
      auto_project_channel: raw?.defaults?.auto_project_channel !== false,
      execution_path: raw?.defaults?.execution_path || 'agi-farm-first',
    },
    projects: Array.isArray(raw.projects)
      ? raw.projects
      : (hasLegacyItems ? raw.items : []),
  };
}

function normalizeProject(project, defaults = DEFAULT_STORE.defaults) {
  const created = project?.created_at || nowIso();
  const updated = project?.updated_at || created;
  return {
    id: String(project?.id || `proj-${toSlug(project?.name || '')}-${crypto.randomUUID().slice(0, 8)}`),
    name: String(project?.name || 'Untitled Project'),
    description: String(project?.description || ''),
    status: String(project?.status || 'active'),
    owner: String(project?.owner || 'main'),
    team: Array.isArray(project?.team) ? project.team : ['main'],
    created_at: created,
    updated_at: updated,
    objective: String(project?.objective || project?.description || ''),
    target_completion: project?.target_completion || null,
    tags: Array.isArray(project?.tags) ? project.tags : [],
    priority_weight: Number(project?.priority_weight || 0),
    budget: {
      allocated_usd: Number(project?.budget?.allocated_usd || 0),
      spent_usd: Number(project?.budget?.spent_usd || 0),
      forecast_usd: Number(project?.budget?.forecast_usd || 0),
      alert_threshold: Number(project?.budget?.alert_threshold || 0.8),
    },
    okr_refs: {
      objective_id: project?.okr_refs?.objective_id || null,
      kr_ids: Array.isArray(project?.okr_refs?.kr_ids) ? project.okr_refs.kr_ids : [],
    },
    task_ids: Array.isArray(project?.task_ids) ? project.task_ids : [],
    job_ids: Array.isArray(project?.job_ids) ? project.job_ids : [],
    milestones: Array.isArray(project?.milestones) ? project.milestones : [],
    risks: Array.isArray(project?.risks) ? project.risks : [],
    decisions: Array.isArray(project?.decisions) ? project.decisions : [],
    auto_project_channel: project?.auto_project_channel ?? defaults.auto_project_channel ?? true,
    execution_path: project?.execution_path || defaults.execution_path || 'agi-farm-first',
  };
}

export class ProjectService {
  constructor(workspace) {
    this.projectsPath = path.join(workspace, 'PROJECTS.json');
    ensureJsonFile(this.projectsPath, DEFAULT_STORE);
  }

  _readStore() {
    return normalizeStore(safeReadJson(this.projectsPath, DEFAULT_STORE));
  }

  _writeStore(store) {
    const normalized = normalizeStore(store);
    safeWriteJson(this.projectsPath, {
      version: Number(normalized.version) || 1,
      defaults: {
        auto_project_channel: normalized.defaults?.auto_project_channel !== false,
        execution_path: normalized.defaults?.execution_path || 'agi-farm-first',
      },
      projects: (Array.isArray(normalized.projects) ? normalized.projects : [])
        .map((p) => normalizeProject(p, normalized.defaults)),
    });
  }

  listRaw() {
    const store = this._readStore();
    return store.projects.map((p) => normalizeProject(p, store.defaults));
  }

  getDefaults() {
    return this._readStore().defaults;
  }

  setDefaults(patch = {}) {
    return withFileLockSync(this.projectsPath, () => {
      const store = this._readStore();
      store.defaults = {
        auto_project_channel: patch.auto_project_channel ?? store.defaults.auto_project_channel ?? true,
        execution_path: patch.execution_path || store.defaults.execution_path || 'agi-farm-first',
      };
      this._writeStore(store);
      return store.defaults;
    });
  }

  list({ status, owner, search, sort = 'updated_desc', risk }, tasks = [], agentPerf = {}) {
    let rows = enrichProjects(this.listRaw(), tasks, agentPerf);
    if (status) rows = rows.filter((p) => String(p.status) === String(status));
    if (owner) rows = rows.filter((p) => String(p.owner) === String(owner));
    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter((p) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.description || '').toLowerCase().includes(q) ||
        String(p.objective || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => String(t).toLowerCase().includes(q))
      );
    }
    if (risk) {
      rows = rows.filter((p) => (p._risks || []).some((r) =>
        String(r.severity || '').toLowerCase() === String(risk).toLowerCase() &&
        !r.resolved
      ));
    }

    if (sort === 'progress_desc') rows.sort((a, b) => (b._progress_pct || 0) - (a._progress_pct || 0));
    else if (sort === 'deadline_asc') rows.sort((a, b) => new Date(a.target_completion || '9999-12-31') - new Date(b.target_completion || '9999-12-31'));
    else if (sort === 'name_asc') rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    else rows.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    return rows;
  }

  get(id, tasks = [], agentPerf = {}) {
    const target = this.listRaw().find((p) => p.id === id);
    if (!target) return null;
    return enrichProjects([target], tasks, agentPerf)[0] || null;
  }

  create(payload = {}) {
    return withFileLockSync(this.projectsPath, () => {
      const store = this._readStore();
      const project = normalizeProject({
        ...payload,
        auto_project_channel: payload.auto_project_channel ?? store.defaults.auto_project_channel,
        execution_path: payload.execution_path || store.defaults.execution_path,
        id: payload.id || `proj-${toSlug(payload.name || payload.title || 'project')}-${crypto.randomUUID().slice(0, 6)}`,
        created_at: nowIso(),
        updated_at: nowIso(),
        milestones: Array.isArray(payload.milestones) ? payload.milestones : [
          { id: crypto.randomUUID(), title: 'Discovery', status: 'pending', due: null, task_ids: [] },
          { id: crypto.randomUUID(), title: 'Implementation', status: 'pending', due: null, task_ids: [] },
          { id: crypto.randomUUID(), title: 'Validation', status: 'pending', due: null, task_ids: [] },
        ],
      }, store.defaults);
      store.projects.push(project);
      this._writeStore(store);
      return project;
    });
  }

  update(id, patch = {}) {
    return withFileLockSync(this.projectsPath, () => {
      const store = this._readStore();
      const idx = store.projects.findIndex((p) => p.id === id);
      if (idx < 0) return null;
      const prev = normalizeProject(store.projects[idx], store.defaults);
      const next = normalizeProject({
        ...prev,
        ...patch,
        budget: { ...prev.budget, ...(patch.budget || {}) },
        okr_refs: { ...prev.okr_refs, ...(patch.okr_refs || {}) },
        updated_at: nowIso(),
      }, store.defaults);
      store.projects[idx] = next;
      this._writeStore(store);
      return next;
    });
  }

  linkTask(projectId, taskId) {
    const current = this.get(projectId) || { task_ids: [] };
    return this.update(projectId, {
      task_ids: Array.from(new Set([...(current.task_ids || []), taskId])),
    });
  }

  linkJob(projectId, jobId) {
    const current = this.get(projectId) || { job_ids: [] };
    return this.update(projectId, {
      job_ids: Array.from(new Set([...(current.job_ids || []), jobId])),
    });
  }
}
