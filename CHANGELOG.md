# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

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
