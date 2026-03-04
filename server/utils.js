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
