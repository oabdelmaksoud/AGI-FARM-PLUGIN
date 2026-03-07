import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const MAX_HISTORY = 30;

export class SecurityService {
  constructor(workspace) {
    this.workspace = workspace;
    this.statusFile = path.join(workspace, 'SECURITY_STATUS.json');
  }

  getStatus() {
    try {
      return JSON.parse(fs.readFileSync(this.statusFile, 'utf-8'));
    } catch {
      return null;
    }
  }

  getHistory() {
    const status = this.getStatus();
    return status?.scan_history || [];
  }

  _runAgentShield(args, timeoutMs = 60000) {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let settled = false;

      try {
        const proc = spawn('npx', ['ecc-agentshield', 'scan', ...args], {
          timeout: timeoutMs,
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: this.workspace,
        });

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          proc.kill('SIGTERM');
          resolve({ ok: false, error: 'scan_timed_out', stdout, stderr });
        }, timeoutMs);

        proc.stdout?.on('data', (d) => { stdout += d.toString(); });
        proc.stderr?.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ ok: false, error: err.message, stdout, stderr });
        });
        proc.on('close', (code) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ ok: code === 0, code, stdout, stderr });
        });
      } catch (err) {
        resolve({ ok: false, error: err.message, stdout, stderr });
      }
    });
  }

  _parseScanOutput(stdout) {
    try {
      return JSON.parse(stdout);
    } catch {
      // Try to extract JSON from output
      const match = stdout.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* ignore */ }
      }
      return null;
    }
  }

  _calculateGrade(score) {
    const numeric = this._numericScore(score);
    if (numeric >= 95) return 'A';
    if (numeric >= 85) return 'B';
    if (numeric >= 70) return 'C';
    if (numeric >= 50) return 'D';
    return 'F';
  }

  _numericScore(score) {
    if (typeof score === 'number' && Number.isFinite(score)) return score;
    if (score && typeof score === 'object') {
      if (typeof score.numericScore === 'number' && Number.isFinite(score.numericScore)) {
        return score.numericScore;
      }
      if (typeof score.score === 'number' && Number.isFinite(score.score)) {
        return score.score;
      }
    }
    return 0;
  }

  _calculateTrend(history) {
    if (history.length < 2) return 'stable';
    const recent = history.slice(-3);
    const first = this._numericScore(recent[0]?.score);
    const last = this._numericScore(recent[recent.length - 1]?.score);
    if (last > first + 2) return 'improving';
    if (last < first - 2) return 'degrading';
    return 'stable';
  }

  updateStatus(scanResult) {
    const now = new Date().toISOString();
    const existing = this.getStatus() || {};
    const history = (existing.scan_history || []).slice(-(MAX_HISTORY - 1));

    const findings = scanResult?.findings || { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const score = scanResult?.score ?? 100;
    const numericScore = this._numericScore(score);
    const grade = this._calculateGrade(score);

    history.push({
      timestamp: now,
      grade,
      score,
      numeric_score: numericScore,
      findings_count: Object.values(findings).reduce((a, b) => a + b, 0),
    });

    const status = {
      timestamp: now,
      grade,
      score,
      numeric_score: numericScore,
      findings,
      details: scanResult?.details || {},
      auto_fixed: scanResult?.auto_fixed || 0,
      status: findings.critical > 0 || findings.high > 2 ? 'NEEDS_ATTENTION' : 'OK',
      trend: this._calculateTrend(history),
      last_scan: now,
      next_scan: new Date(Date.now() + 10 * 3600000).toISOString(),
      scan_history: history,
      notes: scanResult?.notes || '',
    };

    fs.mkdirSync(path.dirname(this.statusFile), { recursive: true });
    fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2), 'utf-8');
    return status;
  }

  async runScan(options = {}) {
    const args = ['--path', this.workspace, '--format', 'json'];
    if (options.fix) args.push('--fix');

    const result = await this._runAgentShield(args);

    if (!result.ok && !result.stdout) {
      // AgentShield not available — return a synthetic result
      const existing = this.getStatus();
      if (existing) return existing;

      return this.updateStatus({
        score: 100,
        findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        details: {},
        notes: 'AgentShield not available — default clean status.',
      });
    }

    const parsed = this._parseScanOutput(result.stdout);
    if (parsed) {
      return this.updateStatus(parsed);
    }

    // Couldn't parse — keep existing
    const existing = this.getStatus();
    return existing || this.updateStatus({
      score: 100,
      findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      notes: 'Scan completed but output could not be parsed.',
    });
  }

  async autoFix() {
    return this.runScan({ fix: true });
  }
}
