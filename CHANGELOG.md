# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

## [1.5.1] - 2026-03-06

### 🔬 Enhanced OpenClaw Compatibility System

#### Multi-Version Testing
- **New Workflow** — `.github/workflows/openclaw-compatibility-enhanced.yml` (650 lines)
  - Tests against **4 OpenClaw versions**: latest, previous, oldest-supported (1.0.0), beta
  - Matrix strategy with fail-fast: false for comprehensive coverage
  - Smart beta detection (skips if no beta release available)
  - Critical version flagging (latest + oldest marked as critical)

#### Performance Regression Testing
- **Automated Benchmarking** — Monitors plugin performance over time
  - Plugin load time threshold: <5000ms (warns if exceeded)
  - Validation time threshold: <3000ms (warns if exceeded)
  - Command execution threshold: <2000ms (warns if exceeded)
  - Performance reports uploaded as GitHub Actions artifacts
  - Regression detection with historical comparison

#### API Deprecation Scanning
- **Proactive API Monitoring** — Detects usage of deprecated OpenClaw APIs
  - Scans `scripts/` and `dist/` directories
  - Configurable deprecated API list with replacement suggestions
  - Inline suggestions provided in workflow output
  - Fails on critical deprecated APIs
  - Warns on soft-deprecated APIs

#### Automated Fix Generation
- **Auto-PR Creation** — Generates pull requests with compatibility fixes
  - Optional via `create_pr_on_failure` workflow input
  - Includes suggested fixes from API deprecation scanner
  - Links to compatibility report artifacts
  - Requires manual review before merge
  - Created only when tests fail and input is enabled

#### Enhanced Documentation
- **Updated** — `OPENCLAW_COMPATIBILITY.md`
  - Multi-version testing procedures documented
  - Performance benchmarking thresholds explained
  - API deprecation scanning guide added
  - Automated PR workflow documented
  - Moved roadmap items from "Planned" to "Completed (v1.5.1)"
- **Updated** — `README.md`
  - Added "OpenClaw Compatibility" section
  - User guide for checking compatibility
  - Maintainer notes on enhanced testing system

### 📊 Statistics
- **Total Workflow Lines**: 650 (enhanced) + 250 (basic) = 900 lines
- **Test Coverage**: 4 OpenClaw versions tested weekly
- **Performance Thresholds**: 3 metrics monitored
- **Automation Level**: Auto-detection, auto-reporting, auto-fix PRs

### 🎯 Benefits
- **Early Detection** — Breaking changes discovered before user impact
- **Performance Monitoring** — Regressions caught automatically
- **Migration Assistance** — Automated suggestions for deprecated APIs
- **Reduced Manual Work** — Less time spent on compatibility testing
- **Clear Upgrade Paths** — Documentation auto-generated from test results

### 🔧 Workflow Inputs
- `test_beta_versions` (boolean) - Include beta/RC releases in testing
- `create_pr_on_failure` (boolean) - Auto-create fix PR when tests fail
- `performance_threshold_ms` (number) - Custom performance threshold

## [1.5.0] - 2026-03-06

### 🌍 Internationalization & Content Expansion
- **ECC Resources Updated** — Synced to latest upstream (commit `03b3e0d0`)
  - Added **316 new files** (Japanese, Chinese Simplified, Chinese Traditional translations)
  - Removed **5 deprecated files** (migrated to i18n structure)
  - **i18n Support**: Japanese (ja-JP), Chinese Simplified (zh-CN), Chinese Traditional (zh-TW)
  - Complete translations of agents, skills, commands, rules, examples
  - Business materials: metrics, sponsorship, social launch copy
  - ECC v1.8.0 release documentation

### 🔄 ECC Update Automation
- **Update Script** — New `scripts/update-ecc-resources.js` (330 lines)
  - Automated sync from upstream ECC repository
  - Dry-run mode for safe preview (`--dry-run`)
  - Version pinning support (`--version=<commit-sha>`)
  - Detailed change reporting (added/modified/removed/unchanged)
  - Smart content-based comparison (not timestamp-based)
- **Version Tracking** — New `ecc-resources/ECC_VERSION` file
  - Tracks current commit SHA and update history
  - Supports rollback to previous versions
  - Audit trail for ECC integration changes
- **Documentation** — New `ECC_UPDATE_GUIDE.md` (450 lines)
  - Complete maintainer workflow (8-step update process)
  - Testing procedures and troubleshooting
  - FAQ and integration notes
  - Future automation roadmap (GitHub Actions)

### ✨ Setup Wizard Enhancements
- **ECC Awareness** — Wizard now highlights included ECC features
  - Welcome banner mentions 69 skills, 7 hooks, 33 commands
  - Informational display of @ shorthand system
  - ECC status in configuration summary
  - Active features shown in success message
- **Better Onboarding** — Users immediately understand production-ready capabilities

### 📝 Documentation
- **README Updates** — Added "Acknowledgments" section
  - Credits Everything Claude Code (@affaan-m)
  - Lists integrated resources (194 → 510 files)
  - Links to upstream repository
- **CI Improvements** — Fixed validation script for CI environments
  - Detects GitHub Actions/CI environment
  - Treats missing OpenClaw as warning (not error) in CI
  - Allows tests to run without OpenClaw installation

### 📊 Statistics
- **Total ECC Files**: 510 (was 194)
- **ECC Resources Size**: 4.0 MB (was 1.5 MB)
- **Supported Languages**: English, Japanese, Chinese (Simplified & Traditional)
- **Integration Commit**: `03b3e0d0` (2026-03-05)

### Changed
- Bumped version to 1.5.0 (minor release for new features)
- ECC resources now include comprehensive i18n support

## [1.4.0] - 2026-03-06

### Added
- **Project Defaults** — new setup wizard prompts for `auto_project_channel` and `execution_path` preferences.
- **Settings Tab** — dashboard UI to view/edit project defaults in real time.
- **API Endpoint** — `PATCH /api/projects/defaults` to update defaults programmatically.
- **Snapshot Exposure** — `/api/data` and `/api/projects` responses now include `project_defaults`.

### Changed
- Setup now defaults new projects to `agi-farm-first` execution path.
- Project creation (API + intake) inherits defaults from `PROJECTS.json`.
- `PROJECTS.json` upgraded to structured store with `defaults` + `projects` fields.
- **SPA Route Fallback** — direct URLs like `/projects` no longer return 404.

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
