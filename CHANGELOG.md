# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

## [1.6.0] - 2026-03-07

### 🎭 Agency-Agents Integration: The Largest Agent Library Expansion

AGI Farm now includes **59 specialized agent personalities** from the battle-tested [Agency-Agents](https://github.com/msitarzewski/agency-agents) repository by [@msitarzewski](https://github.com/msitarzewski), bringing the total agent library to **91 agents**.

#### Agent Library Expansion
- **59 New Agent Templates** — Specialized personalities across 11 categories
- **11 Categories** — Engineering (7), Design (7), Marketing (8), Product (3), Project Management (5), Testing (7), Support (6), Spatial Computing (6), Specialized (7), Strategy (3)
- **Total Library** — **91 agents** (16 AGI Farm + 16 ECC + 59 Agency-Agents)
- **10,000+ Lines** — Production-tested workflows, personality definitions, and code examples
- **Zero Dependencies** — Pure markdown templates, instantly usable

#### Standout Agent Personalities

**Agents Orchestrator** (specialized/)
- Meta-agent for multi-agent pipeline orchestration
- Workflow: PM → Architect → [Dev ↔ QA Loop] → Integration
- Features: Phase-based pipeline, continuous quality loops, intelligent retry logic, quality gate enforcement
- **Perfect for**: Enhancing Cooper (orchestrator) with autonomous pipeline capabilities

**Evidence Collector** (testing/)
- Screenshot-obsessed QA specialist
- Philosophy: "I default to finding 3-5 issues and require visual proof for everything"
- Features: Screenshot capture, visual evidence requirements, PASS/FAIL decisions with specific feedback
- **Perfect for**: Enhancing Vigil (QA) with evidence-based validation

**Reality Checker** (testing/)
- Production readiness certification specialist
- Philosophy: Default to "NEEDS WORK" unless overwhelming evidence proves readiness
- Features: Evidence-based certification, comprehensive validation, final release approval
- **Perfect for**: Final release approval gates

**Whimsy Injector** (design/)
- Delightful UX enhancement specialist
- Philosophy: "Every playful element must serve a functional or emotional purpose"
- Features: Micro-interactions, playful error messages, brand personality, celebration animations
- **Perfect for**: Dashboard UX enhancements that reduce user anxiety and increase delight

**Reddit Community Builder** (marketing/)
- Authentic community engagement specialist
- Philosophy: "You're not marketing on Reddit - you're becoming a valued community member"
- Features: Value-driven content, genuine participation, helpful expertise sharing, trust building
- **Perfect for**: Community-driven growth strategies and authentic engagement

#### Conversion Infrastructure
- **Conversion Script** — `scripts/convert-agency-agent.js` (380 lines)
  - Converts Agency-Agents markdown → AGI Farm SOUL.md format
  - Batch conversion support for entire library
  - Preserves personality, workflows, code examples
  - Adds AGI Farm metadata, usage instructions, attribution

- **Batch Conversion Results**:
  - Total Agents Converted: 59
  - Categories Processed: 11
  - Conversion Errors: 0
  - Success Rate: 100%

#### Documentation
- **Agency-Agents Integration Guide** — `AGENCY_AGENTS_GUIDE.md` (650 lines)
  - Complete agent library breakdown (11 categories)
  - Quick start guide with 3 usage options
  - 4 recommended starter packs (Startup MVP, Marketing Campaign, Enterprise Feature, Quality-First)
  - Standout agent profiles with workflows and use cases
  - Customization guide
  - Attribution and licensing information

- **Deep Analysis** — `AGENCY_AGENTS_INTEGRATION_ANALYSIS.md` (550 lines)
  - Executive summary with synergy score (5/5)
  - Repository structure analysis
  - 5 integration opportunities (Easy to Advanced)
  - 4-phase implementation roadmap (9-15 days)
  - Success metrics and challenges
  - Synergies with ECC/AgentShield
  - Top 10 agents to import first

#### Categories and Agent Counts

| Category | Count | Notable Agents |
|----------|-------|----------------|
| Engineering | 7 | Frontend Developer, Backend Architect, DevOps Automator, AI Engineer |
| Design | 7 | UI Designer, UX Researcher, Whimsy Injector, Brand Guardian |
| Marketing | 8 | Growth Hacker, Content Creator, Reddit Community Builder, TikTok Strategist |
| Product | 3 | Sprint Prioritizer, Trend Researcher, Feedback Synthesizer |
| Project Management | 5 | Senior PM, Project Shepherd, Studio Producer, Experiment Tracker |
| Testing | 7 | Evidence Collector, Reality Checker, Performance Benchmarker, API Tester |
| Support | 6 | Support Responder, Analytics Reporter, Finance Tracker, Infrastructure Maintainer |
| Spatial Computing | 6 | XR Interface Architect, visionOS Engineer, WebXR Developer |
| Specialized | 7 | Agents Orchestrator, Data Analytics Reporter, LSP/Index Engineer |
| Strategy | 3 | Executive Brief, Nexus Strategy, Quickstart |

#### Recommended Starter Packs

**Startup MVP Team** (5 agents):
- Frontend Developer, Backend Architect, Growth Hacker, Rapid Prototyper, Reality Checker
- **Use Case**: Ship faster with specialized expertise at every stage

**Marketing Campaign Team** (5 agents):
- Content Creator, Twitter Engager, Instagram Curator, Reddit Community Builder, Analytics Reporter
- **Use Case**: Multi-channel coordinated campaign with platform-specific expertise

**Enterprise Feature Team** (6 agents):
- Senior Project Manager, Senior Developer, UI Designer, Experiment Tracker, Evidence Collector, Reality Checker
- **Use Case**: Enterprise-grade delivery with quality gates and documentation

**Quality-First Team** (4 agents):
- Evidence Collector, Reality Checker, Performance Benchmarker, API Tester
- **Use Case**: Rigorous quality standards prevent production bugs

### Files Added (63 files)

- `scripts/convert-agency-agent.js` — Conversion script
- `AGENCY_AGENTS_GUIDE.md` — User guide (650 lines)
- `AGENCY_AGENTS_INTEGRATION_ANALYSIS.md` — Deep analysis (550 lines)
- `templates/agency-agents/` — 59 agent templates + 1 category directory

**Template Breakdown**:
```
templates/agency-agents/
├── engineering/        7 agent templates
├── design/             7 agent templates
├── marketing/          8 agent templates
├── product/            3 agent templates
├── project-management/ 5 agent templates
├── testing/            7 agent templates
├── support/            6 agent templates
├── spatial-computing/  6 agent templates
├── specialized/        7 agent templates
└── strategy/           3 agent templates
```

### Files Modified (2 files)

- `README.md` — Updated "What's New", added Agency-Agents to acknowledgments, expanded Combined Impact section
- `CHANGELOG.md` — This entry

### Statistics

- **Total Agents Available**: 91 (16 AGI Farm + 16 ECC + 59 Agency-Agents)
- **Categories Supported**: 19 total (8 AGI Farm + 11 Agency-Agents overlap)
- **Lines Added**: ~1,800 (380 conversion script + 650 guide + 550 analysis + 220 agent metadata)
- **Agent Templates**: 59 fully converted templates
- **Code Examples**: Extensive (10,000+ lines in original repository)
- **Workflow Templates**: Production-tested patterns from real-world usage

### Benefits

✅ **Massive Library Expansion** — From 32 agents to 91 agents (184% increase)
✅ **Battle-Tested Workflows** — Proven patterns from months of production iteration
✅ **Rich Code Examples** — Extensive technical deliverables and concrete outputs
✅ **Community-Driven** — 50+ requests in first 12 hours on Reddit
✅ **Zero Dependencies** — Pure markdown, no additional tools required
✅ **Production-Ready** — Strong personalities with clear deliverables and success metrics
✅ **Instant Usability** — Copy templates directly to agent workspaces

### Synergies with Existing Integrations

**With ECC (Everything Claude Code)**:
- ECC provides production skills (@tdd-workflow, @security-scan)
- Agency-Agents provides specialized personalities (Agents Orchestrator, Evidence Collector)
- Combined: Complete AI coding framework (skills + personalities)

**With AgentShield**:
- AgentShield provides security scanning
- Evidence Collector provides visual proof requirements
- Reality Checker provides production readiness certification
- Combined: Complete quality assurance system (security + QA + certification)

### Attribution

**Original Repository**: https://github.com/msitarzewski/agency-agents
**Author**: [@msitarzewski](https://github.com/msitarzewski)
**License**: MIT License
**Community**: 50+ requests in first 12 hours on Reddit

**Special thanks to @msitarzewski for creating and sharing these exceptional agent personalities with the community.**

### Migration Guide

**For New Users**:
1. Install: `openclaw plugins install agi-farm`
2. Run wizard: `agi-farm setup`
3. Access all 91 agents in agent library

**For Existing Users**:
1. Update: `openclaw plugins update agi-farm`
2. Browse new agents: `ls templates/agency-agents/`
3. Copy to workspaces: `cp templates/agency-agents/<category>/<agent>.md ~/.openclaw/workspace/agents-workspaces/<name>/SOUL.md`

### Next Steps

- **Phase 2**: Enhance Cooper with Agents Orchestrator pattern (3-5 days)
- **Phase 3**: Implement Quality Gates with Evidence Collector + Reality Checker (3-5 days)
- **Phase 4**: Add workflow templates for common use cases (2-3 days)
- **Future**: Agent Marketplace for community contributions (1-2 weeks)

---

## [1.5.2] - 2026-03-07

### 🛡️ Security Dashboard Integration

#### New Security Tab
- **Visual Security Monitoring** — Comprehensive security dashboard in Ops Room
  - **Security Grade Display** — Letter grade (A-F) with color-coded indicators
  - **Numeric Score** — 0-100 scale with progress bar visualization
  - **Trend Indicator** — Shows improving (↗), stable (→), or degrading (↘) trends
  - **Findings Summary** — 5 severity-level cards (Critical, High, Medium, Low, Info)
  - **Action Buttons** — "Scan Now" and "Auto-Fix" with loading states
  - **Status Messages** — Current security posture and next scan time
  - **Scan Categories** — Explains 5 AgentShield scan categories

#### Backend Services
- **Security Service** — `server/services/security.js` (380 lines)
  - `runSecurityScan()` — Execute AgentShield scans
  - `updateSecurityStatus()` — Maintain SECURITY_STATUS.json
  - `getSecurityStatus()` — Read current security posture
  - `scanAndUpdate()` — Combined scan + update operation
  - `autoFixSecurityIssues()` — Run scan with --fix flag
  - `getSecurityHistory()` — Retrieve last 30 scans
  - Trend calculation (improving/stable/degrading)
  - Scan history tracking with timestamps

#### API Endpoints
- **4 New REST Endpoints** — Added to `server/dashboard.js`
  - `GET /api/security/status` — Get current security status
  - `POST /api/security/scan` — Trigger manual scan (optional auto-fix)
  - `POST /api/security/fix` — Auto-fix security issues
  - `GET /api/security/history` — Get scan history (last 30)
  - CSRF protection on all POST endpoints
  - Rate limiting (5 requests/minute) on action endpoints

#### Frontend Components
- **Security Tab Component** — `dashboard-react/src/components/tabs/Security.jsx` (350+ lines)
  - Real-time security status display
  - Interactive scan and auto-fix buttons
  - Error handling with user-friendly messages
  - Loading states for async operations
  - Responsive layout with gradient backgrounds
  - Integration with existing API client (`apiGet`, `apiPost`)

#### Documentation
- **Complete Integration Guide** — `SECURITY_DASHBOARD.md` (550 lines)
  - Architecture overview (backend + frontend)
  - Data flow diagrams for all operations
  - File structure and component hierarchy
  - Security status JSON schema
  - Manual testing checklist (6 test cases)
  - Troubleshooting guide (4 common issues)
  - Performance benchmarks
  - Future enhancement roadmap (3 phases)

#### Integration with Daily Cron
- **Seamless Coordination** — Dashboard displays results from Vigil's daily scan
  - Cron job updates SECURITY_STATUS.json at 9 AM EST
  - Dashboard reads and displays latest scan results
  - Manual scans also update the same status file
  - Consistent data source for all security visibility

### Files Added (3 files)

- `server/services/security.js` — Security operations backend service
- `dashboard-react/src/components/tabs/Security.jsx` — Security tab React component
- `SECURITY_DASHBOARD.md` — Complete integration documentation

### Files Modified (2 files)

- `server/dashboard.js` — Added 4 security API endpoints
- `dashboard-react/src/App.jsx` — Added Security tab to navigation

### Statistics

- **Lines Added**: ~1,200 (380 backend + 350 frontend + 550 docs)
- **API Endpoints**: 4 new REST endpoints
- **React Components**: 1 new tab component
- **Build Size**: Security tab bundle ~9.24 KB (2.67 KB gzipped)
- **Performance**: Initial load ~100-200ms, manual scan ~15-30s

### Benefits

✅ **Real-time Visibility** — View security posture at a glance from dashboard
✅ **On-Demand Scanning** — Trigger security scans anytime, not just daily cron
✅ **Auto-Fix Capability** — One-click automated fixes for safe issues
✅ **Trend Tracking** — Monitor security improvements or degradations over time
✅ **User-Friendly UI** — Visual, color-coded interface for non-technical users
✅ **Zero Config** — Works out-of-box with existing AgentShield integration

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
