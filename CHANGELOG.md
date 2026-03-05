# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

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
