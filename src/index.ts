/**
 * AGI Farm - OpenClaw Plugin
 *
 * Multi-agent AI team builder with dashboard, auto-dispatcher, and infrastructure.
 *
 * @packageDocumentation
 */

import type { ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = import.meta.dirname ?? fileURLToPath(new URL(".", import.meta.url));

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (require("../package.json") as { version: string }).version;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Logger {
  info(message: string): void;
  debug(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface ExtensionContext {
  logger: Logger;
  config: Record<string, unknown>;
}

export interface OpenClawExtension {
  id: string;
  name: string;
  version: string;
  onLoad(context: ExtensionContext): Promise<void>;
  onUnload(): Promise<void>;
}

export interface AGIFarmConfig {
  /** Port for the live ops dashboard */
  dashboardPort: number;
  /** Host to bind dashboard server */
  dashboardHost: string;
  /** Auto-start dashboard on plugin load */
  autoStartDashboard: boolean;
  /** Check GitHub for plugin updates on startup */
  autoCheckUpdates: boolean;
  /** Path to OpenClaw workspace */
  workspacePath?: string;
  /** Path to AGI Farm bundle */
  bundlePath?: string;
  /** Feature flags */
  featureJobs?: boolean;
  featureSkills?: boolean;
  featureMemory?: boolean;
  featurePolicy?: boolean;
  featureMetering?: boolean;
  featureApprovals?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AGIFarmConfig = {
  dashboardPort: 8080,
  dashboardHost: "127.0.0.1",
  autoStartDashboard: true,
  autoCheckUpdates: true,
  featureJobs: false,
  featureSkills: false,
  featureMemory: false,
  featurePolicy: false,
  featureMetering: false,
  featureApprovals: false,
};

const GITHUB_RELEASES_URL = "https://api.github.com/repos/oabdelmaksoud/AGI-FARM-PLUGIN/releases/latest";

// ── AGI Farm Extension ────────────────────────────────────────────────────────

/**
 * AGI Farm Plugin Extension
 *
 * Provides multi-agent team bootstrapping, live dashboard, and auto-dispatcher.
 */
class AGIFarmExtension implements OpenClawExtension {
  id = "agi-farm";
  name = "AGI Farm — Multi-Agent Team Builder";
  version = PKG_VERSION;

  private config: AGIFarmConfig;
  private context: ExtensionContext | null = null;
  private dashboardProcess: ChildProcess | null = null;

  constructor(config: Partial<AGIFarmConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Called when plugin is loaded by OpenClaw
   */
  async onLoad(context: ExtensionContext): Promise<void> {
    this.context = context;
    context.logger.info(`[agi-farm] Plugin loaded (v${this.version})`);
    context.logger.info(`[agi-farm] Config: dashboardPort=${this.config.dashboardPort}, autoStart=${this.config.autoStartDashboard}`);

    if (this.config.autoStartDashboard) {
      await this.startDashboard();
    }

    // Register commands
    this.registerCommands(context);

    // Non-blocking update check
    if (this.config.autoCheckUpdates) {
      this.checkForUpdates().catch(() => {});
    }
  }

  /**
   * Called when OpenClaw is shutting down
   */
  async onUnload(): Promise<void> {
    if (this.dashboardProcess) {
      this.context?.logger.info("[agi-farm] Stopping dashboard server...");
      this.dashboardProcess.kill("SIGTERM");
      this.dashboardProcess = null;
    }
  }

  /**
   * Start the dashboard server
   */
  private async startDashboard(): Promise<void> {
    const { spawn } = await import("child_process");
    const { join } = await import("path");

    const dashboardScript = join(__dirname, "..", "server", "dashboard.js");

    this.context?.logger.info(`[agi-farm] Starting dashboard on ${this.config.dashboardHost}:${this.config.dashboardPort}`);

    this.dashboardProcess = spawn("node", [dashboardScript], {
      env: {
        ...process.env,
        AGI_FARM_DASHBOARD_PORT: String(this.config.dashboardPort),
        AGI_FARM_DASHBOARD_HOST: this.config.dashboardHost,
        AGI_FARM_WORKSPACE: this.config.workspacePath || "",
        AGI_FARM_FEATURE_JOBS: this.config.featureJobs ? "1" : "0",
        AGI_FARM_FEATURE_SKILLS: this.config.featureSkills ? "1" : "0",
        AGI_FARM_FEATURE_MEMORY: this.config.featureMemory ? "1" : "0",
        AGI_FARM_FEATURE_POLICY: this.config.featurePolicy ? "1" : "0",
        AGI_FARM_FEATURE_METERING: this.config.featureMetering ? "1" : "0",
        AGI_FARM_FEATURE_APPROVALS: this.config.featureApprovals ? "1" : "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.dashboardProcess.stdout?.on("data", (data) => {
      this.context?.logger.debug(`[agi-farm:dashboard] ${data.toString().trim()}`);
    });

    this.dashboardProcess.stderr?.on("data", (data) => {
      this.context?.logger.error(`[agi-farm:dashboard] ${data.toString().trim()}`);
    });

    this.dashboardProcess.on("error", (err) => {
      this.context?.logger.error(`[agi-farm:dashboard] Failed to start: ${err.message}`);
    });

    this.dashboardProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        this.context?.logger.warn(`[agi-farm:dashboard] Exited with code ${code}`);
      }
      this.dashboardProcess = null;
    });
  }

  /**
   * Register plugin commands (stub)
   */
  private registerCommands(context: ExtensionContext): void {
    // Commands in this plugin are statically defined in openclaw.plugin.json
    // This method stub exists for future programmatic runtime command registration if needed
    context.logger.debug("[agi-farm] Commands registered statically via openclaw.plugin.json");
  }

  /**
   * Check GitHub for plugin updates (non-blocking, best-effort)
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const res = await fetch(GITHUB_RELEASES_URL, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `agi-farm/${this.version}`,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) return;

      const data = (await res.json()) as {
        tag_name?: string;
        html_url?: string;
      };
      const latest = (data.tag_name || "").replace(/^v/, "");

      if (!latest) return;

      // Simple SemVer compare
      const cur = this.version.split(".").map(Number);
      const lat = latest.split(".").map(Number);
      let isNewer = false;
      for (let i = 0; i < 3; i++) {
        if ((lat[i] || 0) > (cur[i] || 0)) { isNewer = true; break; }
        if ((lat[i] || 0) < (cur[i] || 0)) break;
      }

      if (isNewer) {
        this.context?.logger.info(
          `[agi-farm] ⚡ Update available: v${this.version} → v${latest}`
        );
        if (data.html_url) {
          this.context?.logger.info(`[agi-farm]    Release: ${data.html_url}`);
        }
        this.context?.logger.info(
          `[agi-farm]    Run: npm update -g agi-farm`
        );
      }
    } catch {
      // Network errors silently ignored — update check is best-effort
    }
  }

  /**
   * Get dashboard URL
   */
  getDashboardUrl(): string {
    return `http://${this.config.dashboardHost}:${this.config.dashboardPort}`;
  }

  /**
   * Check if dashboard is running
   */
  isDashboardRunning(): boolean {
    return this.dashboardProcess !== null;
  }
}

/**
 * Extension factory - called by OpenClaw to instantiate the plugin
 */
export default function createExtension(config: Partial<AGIFarmConfig>): OpenClawExtension {
  return new AGIFarmExtension(config);
}

// Export types
export { AGIFarmExtension };
