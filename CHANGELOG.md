# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

## [1.3.3] - 2026-03-06

### Added
- **Enhanced Status CLI** — `agi-farm status` now shows the current plugin version and performs an automated remote check against the NPM registry to notify you of available updates.
- **Version Sync** — synchronized `openclaw.plugin.json` and `package.json` metadata for better discovery in OpenClaw.

## [1.3.2] - 2026-03-06

### Added
- **CI/CD Enhancements** — added manual publish workflow dispatch for granular control over release cycles.
- **Production Build Sync** — verified and synchronized latest `dashboard-dist` artifacts with Mission Control UI optimizations.

## [1.3.1] - 2026-03-05

### Fixed
- Fixed publish workflow preflight checks and metadata alignment.

## [1.3.0] - 2026-03-05

### Added
- **Mission Control Dashboard UI** — complete visual overhaul of all dashboard tabs with a futuristic "Mission Control" aesthetic featuring neon accents, glassmorphism, JetBrains Mono typography, and high-density data visualizations.
- **Project Command Board** — new hero section on the Overview tab showing every project as a card with health indicator, animated progress bar, task/milestone stats, live active task titles, team avatar row, and deadline countdown.
- **Agent Activity Matrix** — full-width agent list on Overview showing real-time active task per agent, HITL alerts, project assignment, heartbeat freshness, and task counts. Agents are sorted: HITL → Active → Error → Idle.
- **Agents tab enhancements** — each agent card now shows: active task badge (or IDLE), HITL gate alert, workload ring (animated SVG), heartbeat health bar (color-coded), collapsible recent cycles feed, and status filter dropdown.
- **Velocity tab charts** — added per-agent stacked workload bar chart (done/active/blocked/failed), throughput vs quality scatter plot with emoji agent markers, and enhanced leaderboard with failure rate % and heartbeat indicator.
- **Autonomous Task Intake** — new intake form on the Projects tab to submit work items that are automatically routed to new or existing projects via the AGI planner.
- **Project actions** — EXECUTE_NOW and REPLAN buttons in project detail view; inline budget and OKR link editors.
- **New server services** — `intake.js`, `projects.js`, `tasks.js`, `timeline.js` for project lifecycle management.

### Changed
- Overview tab is now project-centered: Project Command Board is the primary hero section; task count stats and agent activity are secondary.
- Agent activity rows on Overview now display the current project each agent is serving.
- Recent tasks feed shows agent emoji for instant agent identification.
- Projects tab accepts `data` prop for consistency with other tabs; fetches its own project list via `listProjects()` API helper.

## [1.2.1] - 2026-03-05

### Fixed
- **Critical**: Rewrote `dispatch.js` in pure Node.js — no Python dependency. Now reads `TASKS.json` directly, handles HITL, stale resets, dependency checking, and fires `openclaw sessions start`.
- **Critical**: Rewrote `rebuild.js` in pure Node.js — reconstructs all workspace files (TASKS.json, AGENT_STATUS.json, SOUL.md personas, comms) from `team.json` without Python.
- **High**: Replaced hardcoded `gateway_online: true` in dashboard with a real `openclaw --version` probe via `spawnSync`.
- **High**: Added OpenClaw availability check at start of `agi-farm setup` — exits with a friendly error if `openclaw` is not installed.
- **Medium**: `teardown.js` now deletes `agents-workspaces/` directory and all 12 shared registry files.
- **Medium**: Replaced raw ANSI escape codes in `status.js` with chalk. Added comms health check section.
- **Medium**: `export.js` now detects missing git remote and prints exact commands to resolve it.

## [1.2.0] - 2026-03-05

First public production release.

### Changed
- Enabled all feature flags by default (`featureJobs`, `featureSkills`, `featureMemory`, `featurePolicy`, `featureMetering`, `featureApprovals`). Users no longer need manual configuration to access the full feature set.
- Synced `openclaw.plugin.json` version with `package.json`.
- Replaced hardcoded stray agent name patterns in teardown with a dynamic set derived from all roster presets (3, 5, and 11 agents). Ensures a clean uninstall regardless of the preset chosen.
- Removed all hardcoded model IDs. Agents use OpenClaw's configured default model (no `--model` flag passed).

## [1.1.5] - 2026-03-05

### Changed
- Removed hardcoded model IDs from agent roster. All agents now use `manifest/auto`, deferring model selection to the user's configured providers in the OpenClaw gateway.

## [1.1.4] - 2026-03-05

### Changed
- Improved `teardown.js` to proceed with stray agent detection and `comms` cleanup even if `team.json` is missing.
- Enhanced robustness of the uninstallation flow for partially initialized systems.

## [1.1.3] - 2026-03-05

### Fixed
- Fixed robust teardown by implementing live agent detection (removes stray agents not listed in `team.json`).
- Added automatic `comms` directory cleanup during teardown.
- Hardened uninstallation flow to ensure a completely clean workspace.

## [1.1.2] - 2026-03-05

### Fixed
- Fixed `agi-farm setup` failure by correcting `openclaw agents add` command flags.
- Fixed health check failure by properly initializing the `comms` directory and agent inboxes/outboxes.
- Improved agent creation logic with better error handling and name-to-ID normalization awareness.

## [1.0.3] - 2026-03-05

### Added
- Added feature-flagged core runtime services for jobs, worker execution, skills, memory index, policies, approvals, audit, metering, and encrypted secrets.
- Added new dashboard APIs: jobs, skills, memory search, policies, approvals, and usage.
- Added dashboard tabs for Jobs, Approvals, and Usage with live SSE updates.
- Added API integration smoke test coverage for dashboard server runtime and policy-gated flows.

### Changed
- Added policy-gate middleware for high-impact mutation routes (cron trigger/toggle, HITL actions, job control, skill toggles).
- Added dispatch step mode support with `--job-id` and `--step-id`.
- Added plugin configuration flags for runtime module enablement.
- Improved dashboard frontend load performance via lazy-loaded tabs and Vite chunk splitting.

### Fixed
- Fixed build reproducibility by clearing stale TypeScript incremental metadata in prebuild.

## [1.0.2] - 2026-03-04

### Added
- Added Origin header validation on all mutation endpoints (only localhost origins accepted).
- Added 22 new unit tests: extension lifecycle, security (timing-safe compare, origin validation), and shared utility tests (28 total, was 6).
- Added shared `scripts/lib/run-command.js` utility to eliminate code duplication.

### Changed
- Extension version is now read dynamically from `package.json` instead of being hardcoded.
- `src/index.ts` uses proper ESM `__dirname` via `import.meta.dirname` with `fileURLToPath` fallback.
- `export.js` and `status.js` now respect the `AGI_FARM_WORKSPACE` environment variable.

### Fixed
- Fixed timing-safe CSRF comparison leaking token length (now pads buffers to equal length).

### Removed
- Removed unused `sse.js` dependency from `package.json`.
- Removed duplicated `runCommand` functions from `setup.js` and `teardown.js`.

## [1.0.1] - 2026-03-04

### Added
- Added CSRF session endpoint (`GET /api/session`) and token validation for dashboard mutation APIs.
- Added frontend API helper for authenticated dashboard POST calls.
- Added ESLint v9 flat configuration (`eslint.config.js`).
- Added a "Recent Updates" section in README.

### Changed
- Dashboard cron and HITL mutation endpoints now wait for `openclaw` command completion and return real status/errors.
- Implemented real cron toggle persistence by updating OpenClaw cron jobs metadata.
- Hardened dashboard snapshot loading with defensive object/array coercion for malformed JSON files.
- Updated dashboard launcher path resolution to prefer packaged local server path with legacy extension fallback.
- Updated npm test command for ESM Jest execution and fixed lint script flags.
- Rebuilt dashboard production assets after frontend API changes.

### Fixed
- Fixed non-functional cron toggle behavior in dashboard backend.
- Fixed lint command failure under ESLint v9.
- Fixed Jest ESM test execution failure.
