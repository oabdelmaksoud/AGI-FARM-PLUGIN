/**
 * AGI Farm - OpenClaw Plugin
 *
 * Multi-agent AI team builder powered by Paperclip dashboard.
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

export interface PluginContext {
  logger: Logger;
  pluginConfig?: Partial<AGIFarmConfig>;
  registerService?: (service: {
    id: string;
    start: () => Promise<void> | void;
    stop: () => Promise<void> | void;
  }) => void;
}

export interface OpenClawExtension {
  id: string;
  name: string;
  version: string;
  onLoad(context: ExtensionContext): Promise<void>;
  onUnload(): Promise<void>;
}

export interface AGIFarmConfig {
  /** Port for Paperclip dashboard */
  paperclipPort: number;
  /** Host to bind Paperclip server */
  paperclipHost: string;
  /** Auto-start Paperclip on plugin load */
  autoStartPaperclip: boolean;
  /** Check GitHub for plugin updates on startup */
  autoCheckUpdates: boolean;
  /** Path to OpenClaw workspace */
  workspacePath?: string;
  /** Path to AGI Farm bundle */
  bundlePath?: string;
  /** Paperclip deployment mode */
  paperclipDeploymentMode?: "local_trusted" | "authenticated";
  /** Feature flags */
  featureJobs?: boolean;
  featureSkills?: boolean;
  featureMemory?: boolean;
  featurePolicy?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AGIFarmConfig = {
  paperclipPort: 3100,
  paperclipHost: "127.0.0.1",
  autoStartPaperclip: true,
  autoCheckUpdates: true,
  paperclipDeploymentMode: "local_trusted",
  featureJobs: true,
  featureSkills: true,
  featureMemory: true,
  featurePolicy: true,
};

const GITHUB_RELEASES_URL = "https://api.github.com/repos/oabdelmaksoud/AGI-FARM-PLUGIN/releases/latest";

// ── AGI Farm Extension ────────────────────────────────────────────────────────

/**
 * AGI Farm Plugin Extension
 *
 * Provides multi-agent team bootstrapping with Paperclip-powered dashboard.
 */
class AGIFarmExtension implements OpenClawExtension {
  id = "agi-farm";
  name = "AGI Farm — Multi-Agent Team Builder";
  version = PKG_VERSION;

  private config: AGIFarmConfig;
  private context: ExtensionContext | null = null;
  private paperclipProcess: ChildProcess | null = null;

  constructor(config: Partial<AGIFarmConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Called when plugin is loaded by OpenClaw
   */
  async onLoad(context: ExtensionContext): Promise<void> {
    this.context = context;
    context.logger.info(`[agi-farm] Plugin loaded (v${this.version})`);
    context.logger.info(`[agi-farm] Paperclip: port=${this.config.paperclipPort}, autoStart=${this.config.autoStartPaperclip}`);

    if (this.config.autoStartPaperclip) {
      await this.startPaperclip();
    }

    this.registerCommands(context);

    if (this.config.autoCheckUpdates) {
      this.checkForUpdates().catch(() => { });
    }
  }

  /**
   * Called when OpenClaw is shutting down
   */
  async onUnload(): Promise<void> {
    if (this.paperclipProcess) {
      this.context?.logger.info("[agi-farm] Stopping Paperclip server...");
      this.paperclipProcess.kill("SIGTERM");
      this.paperclipProcess = null;
    }
  }

  /**
   * Start the Paperclip server as a child process
   */
  private async startPaperclip(): Promise<void> {
    const { spawn } = await import("child_process");
    const { join } = await import("path");

    const paperclipDir = join(__dirname, "..", "paperclip");
    const paperclipEntry = join(paperclipDir, "server", "src", "index.ts");

    this.context?.logger.info(`[agi-farm] Starting Paperclip on ${this.config.paperclipHost}:${this.config.paperclipPort}`);

    this.paperclipProcess = spawn(
      "node",
      ["--import", "tsx/esm", paperclipEntry],
      {
        cwd: paperclipDir,
        env: {
          ...process.env,
          PAPERCLIP_HOST: this.config.paperclipHost,
          PORT: String(this.config.paperclipPort),
          PAPERCLIP_PORT: String(this.config.paperclipPort),
          PAPERCLIP_DEPLOYMENT_MODE: this.config.paperclipDeploymentMode || "local_trusted",
          PAPERCLIP_DEPLOYMENT_EXPOSURE: "private",
          SERVE_UI: "true",
          PAPERCLIP_MIGRATION_AUTO_APPLY: "true",
          PAPERCLIP_MIGRATION_PROMPT: "never",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    this.paperclipProcess.stdout?.on("data", (data: Buffer) => {
      this.context?.logger.debug(`[agi-farm:paperclip] ${data.toString().trim()}`);
    });

    this.paperclipProcess.stderr?.on("data", (data: Buffer) => {
      this.context?.logger.error(`[agi-farm:paperclip] ${data.toString().trim()}`);
    });

    this.paperclipProcess.on("error", (err) => {
      this.context?.logger.error(`[agi-farm:paperclip] Failed to start: ${err.message}`);
    });

    this.paperclipProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        this.context?.logger.warn(`[agi-farm:paperclip] Exited with code ${code}`);
      }
      this.paperclipProcess = null;
    });
  }

  private registerCommands(context: ExtensionContext): void {
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

      const cur = this.version.split(".").map(Number);
      const lat = latest.split(".").map(Number);
      let isNewer = false;
      for (let i = 0; i < 3; i++) {
        if ((lat[i] || 0) > (cur[i] || 0)) { isNewer = true; break; }
        if ((lat[i] || 0) < (cur[i] || 0)) break;
      }

      if (isNewer) {
        this.context?.logger.info(
          `[agi-farm] Update available: v${this.version} -> v${latest}`
        );
        if (data.html_url) {
          this.context?.logger.info(`[agi-farm]    Release: ${data.html_url}`);
        }
        this.context?.logger.info(
          `[agi-farm]    Run: npm update -g agi-farm`
        );
      }
    } catch {
      // Network errors silently ignored
    }
  }

  getDashboardUrl(): string {
    return `http://${this.config.paperclipHost}:${this.config.paperclipPort}`;
  }

  isDashboardRunning(): boolean {
    return this.paperclipProcess !== null;
  }
}

/**
 * Extension factory - called by OpenClaw to instantiate the plugin
 */
export default function createExtension(config: Partial<AGIFarmConfig>): OpenClawExtension {
  return new AGIFarmExtension(config);
}

/**
 * OpenClaw plugin registration entrypoint for runtimes that expect `register`.
 */
export function register(context: PluginContext): void {
  const extension = new AGIFarmExtension(context.pluginConfig ?? {});

  const start = async () => {
    await extension.onLoad({
      logger: context.logger,
      config: {},
    });
    context.logger.info(`[agi-farm] Paperclip URL: ${extension.getDashboardUrl()}`);
  };

  const stop = async () => {
    await extension.onUnload();
  };

  if (typeof context.registerService === "function") {
    context.registerService({
      id: "agi-farm-paperclip",
      start,
      stop,
    });
    return;
  }

  start().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    context.logger.error(`[agi-farm] Failed to initialize: ${message}`);
  });
}

export { AGIFarmExtension };
