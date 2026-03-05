import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Robustly parses OpenClaw agents JSON output.
 * @param {string} stdout - Raw JSON string from `openclaw agents list --json`.
 * @returns {Object} Map of agentId to agent details.
 */
export function parseAgentsJson(stdout) {
    try {
        const agents = JSON.parse(stdout);
        const map = {};
        if (Array.isArray(agents)) {
            for (const a of agents) {
                if (a && a.id) map[a.id] = a;
            }
        }
        return map;
    } catch (err) {
        console.warn('[utils] Failed to parse agents JSON:', err.message);
        return {};
    }
}

/**
 * Robustly parses the `openclaw cron list` table output.
 * @param {string} stdout - Raw string output from the CLI.
 * @returns {Object} Map of agentId to status ('busy', 'error', etc.).
 */
export function parseCronList(stdout) {
    const statuses = {};
    if (!stdout) return statuses;

    const lines = stdout.split('\n').filter(l => l.trim().length > 0);
    // Skip header if it looks like a header (contains 'ID' or 'STATUS')
    const startIndex = (lines[0] && (lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('status'))) ? 1 : 0;

    for (const line of lines.slice(startIndex)) {
        const parts = line.split(/\s+/).filter(p => p.length > 0);
        if (parts.length < 5) continue;

        const statusKeywords = ['running', 'ok', 'error', 'idle'];
        const foundStatus = parts.find(p => statusKeywords.includes(p.toLowerCase()));

        // In OpenClaw cron list, the last part is usually the agentId or similar identifying tag
        const agentId = parts[parts.length - 1];

        if (foundStatus && agentId) {
            const s = foundStatus.toLowerCase();
            if (s === 'running') statuses[agentId] = 'busy';
            else if (s === 'error') statuses[agentId] = 'error';
        }
    }
    return statuses;
}

/**
 * Calculates heartbeat age in minutes from file content.
 * @param {string} content - HEARTBEAT.md content.
 * @returns {number} Age in minutes.
 */
export function calculateHeartbeatAge(content) {
    if (!content) return 999;
    // Regex to match ISO 8601 timestamps with optional timezone
    const matches = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g);
    if (matches) {
        const lastTs = new Date(matches[matches.length - 1]);
        const age = Math.floor((Date.now() - lastTs.getTime()) / 60000);
        return isNaN(age) ? 999 : age;
    }
    return 999;
}

/**
 * Counts entries in an inbox markdown file.
 * @param {string} content - Inbox .md content.
 * @returns {number} Count of '##' task headers.
 */
export function countInboxEntries(content) {
    if (!content) return 0;
    return content.split('\n').filter(l => l.startsWith('##')).length;
}

/**
 * Extracts experiments array from EXPERIMENTS.json (may be wrapped in { experiments: [] }).
 * @param {*} raw - Parsed JSON content.
 * @returns {Array} Array of experiment objects.
 */
export function extractExperiments(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (Array.isArray(raw.experiments)) return raw.experiments;
  }
  return [];
}

/**
 * Extracts backlog items from IMPROVEMENT_BACKLOG.json (may be wrapped in { items: [] }).
 * @param {*} raw - Parsed JSON content.
 * @returns {Array} Array of backlog items.
 */
export function extractBacklogItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.backlog)) return raw.backlog;
  }
  return [];
}

/**
 * Extracts processes from PROCESSES.json (may be wrapped in { processes: [] }).
 * @param {*} raw - Parsed JSON content.
 * @returns {Array} Array of process objects.
 */
export function extractProcesses(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (Array.isArray(raw.processes)) return raw.processes;
  }
  return [];
}

/**
 * Enriches projects with computed fields that the frontend expects.
 * @param {Array} projects - Raw projects array.
 * @param {Array} tasks - All tasks array.
 * @param {Object} agentPerf - Agent performance map { [agentId]: { quality_score, ... } }.
 * @returns {Array} Enriched projects.
 */
export function enrichProjects(projects, tasks, agentPerf) {
  if (!Array.isArray(projects)) return [];
  return projects.map(p => {
    const taskIds = p.task_ids || [];
    const projTasks = tasks.filter(t => taskIds.includes(t.id));
    const milestones = p.milestones || [];

    const _task_counts = {
      total: projTasks.length,
      done: projTasks.filter(t => t.status === 'complete').length,
      active: projTasks.filter(t => t.status === 'in-progress').length,
      pending: projTasks.filter(t => t.status === 'pending').length,
      blocked: projTasks.filter(t => t.status === 'blocked').length,
      failed: projTasks.filter(t => t.status === 'failed').length,
      hitl: projTasks.filter(t => t.status === 'needs_human_decision').length,
    };

    const _milestone_counts = {
      total: milestones.length,
      done: milestones.filter(m => m.status === 'complete').length,
    };

    const _progress_pct = _task_counts.total > 0
      ? Math.round((_task_counts.done / _task_counts.total) * 100)
      : 0;

    const teamPerf = (p.team || []).map(aid => agentPerf[aid]).filter(Boolean);
    const _quality_score = teamPerf.length > 0
      ? parseFloat((teamPerf.reduce((s, perf) => s + (perf.quality_score || 0), 0) / teamPerf.length).toFixed(1))
      : null;

    const createdAt = p.created_at ? new Date(p.created_at) : null;
    const daysSince = createdAt ? Math.max(1, (Date.now() - createdAt.getTime()) / 86400000) : null;
    const _velocity = daysSince !== null ? parseFloat((_task_counts.done / daysSince).toFixed(1)) : null;

    const completedTasks = projTasks
      .filter(t => t.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    const _last_activity = completedTasks[0]?.completed_at || null;

    const _risks = (p.risks || []).map(r => ({ ...r, resolved: r.resolved || false }));

    const _activity = projTasks
      .filter(t => t.completed_at)
      .map(t => ({
        type: t.status === 'failed' ? 'task_failed' : 'task_complete',
        text: `${t.title} (${t.status})`,
        agent: t.assigned_to,
        ts: t.completed_at,
      }))
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 20);

    const _sessions = projTasks
      .filter(t => t.proc_id)
      .map(t => ({
        task_id: t.id,
        assigned_to: t.assigned_to,
        proc_id: t.proc_id,
        status: t.status,
        completed_at: t.completed_at,
      }));

    return {
      ...p,
      _task_counts,
      _milestone_counts,
      _progress_pct,
      _quality_score,
      _velocity,
      _last_activity,
      _risks,
      _activity,
      _sessions,
    };
  });
}
