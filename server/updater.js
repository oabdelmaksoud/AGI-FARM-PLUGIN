#!/usr/bin/env node
/**
 * Auto-update checker for AGI Farm plugin.
 *
 * Polls the GitHub Releases API to detect new versions and can perform
 * self-update via `npm install -g agi-farm@latest`.
 */
import { createRequire } from 'module';
import { execFile } from 'child_process';

const require = createRequire(import.meta.url);

const GITHUB_API_URL = 'https://api.github.com/repos/oabdelmaksoud/AGI-FARM-PLUGIN/releases/latest';
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours
const UPDATE_TIMEOUT_MS = 60_000;     // 60 seconds for npm install

/**
 * Compare two SemVer strings (e.g. "1.0.2" vs "1.1.0").
 * Returns  1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareSemVer(a, b) {
  const pa = (a || '0.0.0').split('.').map(Number);
  const pb = (b || '0.0.0').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export class UpdateChecker {
  constructor() {
    /** @type {string} */
    this.currentVersion = '0.0.0';
    try {
      const pkg = require('../package.json');
      this.currentVersion = pkg.version || '0.0.0';
    } catch { /* fallback */ }

    /** @type {string|null} */
    this.latestVersion = null;
    /** @type {string|null} */
    this.releaseUrl = null;
    /** @type {string|null} */
    this.releaseNotes = null;
    /** @type {string|null} */
    this.publishedAt = null;
    /** @type {Date|null} */
    this.lastCheck = null;
    /** @type {boolean} */
    this.updateAvailable = false;
    /** @type {boolean} */
    this.checking = false;
  }

  /**
   * Fetch latest release from GitHub and compare versions.
   * Results are cached for CACHE_MS. Network errors are silently caught.
   */
  async check() {
    // Return cached result if still fresh
    if (this.lastCheck && (Date.now() - this.lastCheck.getTime()) < CACHE_MS) {
      return this.getStatus();
    }

    // Prevent concurrent checks
    if (this.checking) return this.getStatus();
    this.checking = true;

    try {
      const res = await fetch(GITHUB_API_URL, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': `agi-farm/${this.currentVersion}`,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(`[updater] GitHub API returned ${res.status}`);
        return this.getStatus();
      }

      const data = await res.json();
      const tagName = (data.tag_name || '').replace(/^v/, '');

      this.latestVersion = tagName;
      this.releaseUrl = data.html_url || null;
      this.releaseNotes = data.body ? data.body.slice(0, 500) : null;
      this.publishedAt = data.published_at || null;
      this.lastCheck = new Date();
      this.updateAvailable = compareSemVer(tagName, this.currentVersion) > 0;

      if (this.updateAvailable) {
        console.log(`[updater] Update available: v${this.currentVersion} → v${tagName}`);
      }
    } catch (err) {
      // Network errors, timeouts, etc. — silently ignore
      console.warn(`[updater] Check failed: ${err.message}`);
    } finally {
      this.checking = false;
    }

    return this.getStatus();
  }

  /**
   * Return current update status (safe to call anytime).
   */
  getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      currentVersion: this.currentVersion,
      latestVersion: this.latestVersion,
      releaseUrl: this.releaseUrl,
      releaseNotes: this.releaseNotes,
      publishedAt: this.publishedAt,
      lastCheck: this.lastCheck ? this.lastCheck.toISOString() : null,
    };
  }

  /**
   * Perform self-update via npm install.
   * Uses execFile (NOT exec) to prevent shell injection.
   */
  async performUpdate() {
    return new Promise((resolve) => {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

      execFile(npmCmd, ['install', '-g', 'agi-farm@latest'], {
        timeout: UPDATE_TIMEOUT_MS,
        env: { ...process.env },
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[updater] Update failed: ${error.message}`);
          resolve({
            success: false,
            output: stderr || error.message,
            error: error.message,
          });
        } else {
          console.log(`[updater] Update complete: ${stdout.trim()}`);
          resolve({
            success: true,
            output: stdout.trim(),
            error: null,
          });
        }
      });
    });
  }
}
