/**
 * Paperclip Sync Service
 *
 * Watches the AGI Farm workspace JSON files and syncs changes
 * to Paperclip's REST API. This bridges the file-based AGI Farm
 * services (jobs, tasks, worker, policy) into Paperclip's PostgreSQL.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { PaperclipBridge } from './paperclip-bridge.js';

const WORKSPACE = process.env.AGI_FARM_WORKSPACE ||
  path.join(os.homedir(), '.openclaw', 'workspace');

const SYNC_INTERVAL_MS = 10_000; // 10 seconds

export class PaperclipSyncService {
  #bridge;
  #companyId;
  #intervalHandle = null;
  #lastSyncHash = {};

  constructor(paperclipBaseUrl = 'http://127.0.0.1:3100') {
    this.#bridge = new PaperclipBridge(paperclipBaseUrl);
    this.#companyId = null;
  }

  /**
   * Start the sync loop.
   * @param {string} companyId - The Paperclip company ID to sync into
   */
  async start(companyId) {
    this.#companyId = companyId;

    // Initial sync
    await this.syncAll();

    // Periodic sync
    this.#intervalHandle = setInterval(() => {
      this.syncAll().catch(err => {
        console.warn('[paperclip-sync] Sync error:', err.message);
      });
    }, SYNC_INTERVAL_MS);
  }

  stop() {
    if (this.#intervalHandle) {
      clearInterval(this.#intervalHandle);
      this.#intervalHandle = null;
    }
  }

  async syncAll() {
    await this.syncTasks();
    await this.syncAgentStatus();
  }

  /**
   * Sync TASKS.json to Paperclip issues.
   */
  async syncTasks() {
    const tasksPath = path.join(WORKSPACE, 'TASKS.json');
    if (!fs.existsSync(tasksPath)) return;

    const content = fs.readFileSync(tasksPath, 'utf-8');
    const hash = simpleHash(content);
    if (hash === this.#lastSyncHash.tasks) return;

    try {
      const tasks = JSON.parse(content);
      if (!Array.isArray(tasks)) return;

      for (const task of tasks) {
        if (task._synced) continue;

        await this.#bridge.createIssue(this.#companyId, {
          title: task.title || task.id,
          description: task.description || '',
          assigneeAgentId: task.assigned_to,
          priority: task.priority || 'medium',
          status: mapTaskStatus(task.status),
        });
      }

      this.#lastSyncHash.tasks = hash;
    } catch (err) {
      console.warn('[paperclip-sync] Tasks sync failed:', err.message);
    }
  }

  /**
   * Sync AGENT_STATUS.json to Paperclip agent state.
   */
  async syncAgentStatus() {
    const statusPath = path.join(WORKSPACE, 'AGENT_STATUS.json');
    if (!fs.existsSync(statusPath)) return;

    const content = fs.readFileSync(statusPath, 'utf-8');
    const hash = simpleHash(content);
    if (hash === this.#lastSyncHash.agentStatus) return;

    this.#lastSyncHash.agentStatus = hash;
    // Agent status is displayed in Paperclip via its own heartbeat system.
    // This is a placeholder for future bidirectional sync.
  }
}

function mapTaskStatus(agiFarmStatus) {
  const statusMap = {
    'pending': 'backlog',
    'in-progress': 'in_progress',
    'complete': 'done',
    'failed': 'cancelled',
    'blocked': 'backlog',
    'needs_human_decision': 'in_progress',
  };
  return statusMap[agiFarmStatus] || 'backlog';
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export default PaperclipSyncService;
