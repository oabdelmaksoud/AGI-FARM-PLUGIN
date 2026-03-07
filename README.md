<div align="center">

# 🦅 AGI Farm

### One wizard. Full multi-agent AI team. Live in minutes.

**Build production-ready AI teams with a single command**

[![npm version](https://img.shields.io/npm/v/agi-farm.svg)](https://www.npmjs.com/package/agi-farm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Plugin-blue.svg)](https://docs.openclaw.ai)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)

[Quick Start](#-quick-start) • [Features](#-what-it-does) • [Documentation](#-commands) • [Architecture](#-architecture)

</div>

---

> [!WARNING]
> **Notice: AGI Farm is currently under active development and still has known bugs.** Please use with caution in production environments.

## 🎯 What It Does

**AGI Farm** is an [OpenClaw](https://docs.openclaw.ai) plugin that bootstraps a fully operational multi-agent AI system with everything you need:

| Feature | Description |
|---------|-------------|
| 🧙 **Interactive Wizard** | 6 questions → complete team setup in ~2 minutes |
| 🤖 **Multi-Agent Teams** | Choose 3, 5, or 11 pre-wired specialist agents |
| 📡 **Live Ops Dashboard** | React + SSE with real-time updates and interactive HITL/Cron controls |
| 🔄 **Auto-Dispatcher** | Smart task delegation with HITL, backoff & dependencies |
| 📦 **Portable Bundle** | Export your entire team to GitHub with one command |
| 🏗️ **ESM Native** | Built for Node 20+ with full ES Module support |
| 🛡️ **Production Hardened** | Security-audited with CSRF, Origin validation, CSP headers, input sanitization, and timing-safe auth |
| 🔐 **Security Dashboard** | Real-time vulnerability scanning, auto-fix, and security history tracking |
| 🔄 **Auto-Update** | Detects new releases on GitHub with one-click install from the dashboard |
| ⚙️ **Feature-Flagged Runtime** | Optional jobs, skills, memory, policy, approvals, and metering modules |
| 🧪 **103 Automated Tests** | Unit + integration + API smoke coverage with Jest/ESM |

---

## 🙏 Upstream Acknowledgement

Parts of AGI Farm dashboard direction are inspired by the excellent work in **LobsterBoard** by [Curbob](https://github.com/Curbob):

- Upstream repository: https://github.com/Curbob/LobsterBoard
- Upstream license: Business Source License 1.1 (BSL-1.1)

AGI Farm does not copy LobsterBoard code directly; features are re-implemented for AGI Farm architecture and compatibility.

### 🔄 Always-Sync Policy

To stay aligned with upstream updates, this repo now includes:

- Automated scheduled sync workflow: `.github/workflows/lobsterboard-upstream-sync.yml`
- Local sync script: `npm run sync:lobsterboard`
- Snapshot mirror for review/porting: `upstream/lobsterboard/`
- Tracking file: `lobsterboard-resources/LOBSTERBOARD_VERSION`
- Parity plan: `docs/LOBSTERBOARD_PARITY.md`

This keeps upstream diffs visible in PRs so feature ports can be done continuously.

---

## 🧙 What's New in v1.9.0

### 🚀 Advanced Wizard 2.0 — Industry-Driven Automation

The setup wizard has been completely overhauled from a basic 4-template system to a sophisticated, 6-phase onboarding experience that activates the full depth of the AGI Farm plugin.

#### 🏗️ 15 Industry-Specific Blueprints
Choose from professional team compositions across 5 major verticals:
- **Software Engineering**: Startup MVP, Full-Stack Product, Mobile-First App, AI/ML System.
- **Marketing & Growth**: Marketing Campaign, Brand Launch, Performance Marketing.
- **Enterprise & Regulated**: Enterprise Feature, Security-Critical, Compliance & Audit.
- **Research & Development**: Quality-First, Research & Discovery.
- **Creative & Content**: Content Studio, Product Design Sprint.

#### ⚙️ Deep Plugin Integration
The wizard now automates what used to be manual post-setup tasks:
- **Budget & OKRs**: Set monthly spend limits and seed your team with industry-specific OKRs immediately.
- **Operational Automation**: Select and activate pre-built cron jobs (daily security scans, weekly velocity reports, auto-dispatcher heartbeats).
- **HITL Security Policy**: Choose your "Human-in-the-Loop" sensitivity level (Low/Medium/High) during setup.
- **Project Seeding**: Start with a pre-populated project and task backlog tailored to your chosen blueprint.
- **AgentShield Integration**: One-click initial security scan to baseline your new workspace.

#### 🧹 Consolidated Architecture
- Legacy `setup-enhanced.js` has been consolidated into the main `setup.js`.
- Performance improvements in agent creation and SOUL.md template generation.
- Expanded `WORKFLOW_TEMPLATES.md` documentation covering all 15 new blueprints.

---

## 🆕 What's New in v1.8.0

### 🎨 Complete Dashboard Redesign — Day Theme (Minimalism 3.0 + Glassmorphism 2.0)

The AGI Farm dashboard has been **completely redesigned** with a modern, light-mode UI. Every single one of the 26 tabs has been rewritten from scratch with a premium day-themed aesthetic.

#### ✨ Design System
- **Off-white/pearl backgrounds** (`#F8FAFC` slate palette) with glassmorphism cards and subtle depth shadows
- **Premium typography** — Inter for UI, JetBrains Mono for technical values
- **Accent palette** — Indigo primary, Emerald mint for success, Amber for warnings, Violet for AI/HITL, Red for errors
- **Hover-lift animations**, smooth fade-in transitions, and pill-shaped status badges throughout
- **100% light mode** — All dark `#050505`/`#000`/`rgba(0,0,0)` backgrounds purged from every file

#### 📋 All 26 Tabs Redesigned

| Pillar | Tabs |
|--------|------|
| **Agent Intelligence** | Overview, Agents, Tasks, HITL, Alerts, Velocity, Budget |
| **Project Oversight** | Projects, OKRs, Approvals, Knowledge, Comms |
| **System** | Security, Jobs & Crons, Processes, Policies, Skills, Usage, Memory, Failures, Decisions, Audit Log, Settings, R&D |

#### 🏗️ Key Changes
- **Projects tab** — Full rewrite with light progress rings, health badges, tabbed detail view (Overview / Timeline / Tasks / Budget / OKRs / Logs), light Gantt chart and burndown chart
- **HITL tab** — Soft-purple glass cards with clear Approve/Reject actions and status banner
- **Velocity tab** — KPI cards + area chart + success rate trend line
- **Approvals tab** — Card layout matching HITL with optional notes field
- **Settings tab** — Toggle switches, budget limit inputs, workspace info grid
- **Crons tab** — Status-dot rows with Run / Pause / Resume action buttons
- **Knowledge tab** — Masonry card grid with tag pills and expand-to-read
- **Comms tab** — Agent list sidebar with Inbox / Outbox panels
- **OKRs tab** — Objective cards with animated KR progress bars
- **R&D tab** — Light experiment table, benchmark leaderboard, and evolution pipeline backlog

#### 🧹 Legacy Cleanup
- Deleted `TopBar.jsx` and `Sidebar.jsx` (unused dark-theme stubs)
- Removed all cyberpunk/neon language (`SYSTEM_LIVE`, `ENCRYPTED`, `VECTOR_ID`, `NEURAL`, etc.)
- All chart grid lines and tooltips updated to light theme

---

### Previous: v1.7.2 — Enhanced Wizard with Workflow Templates + Agent Browser
- **4 workflow templates** — Pre-built teams for common use cases: Startup MVP (5 agents), Marketing Campaign (5 agents), Enterprise Feature (6 agents), Quality-First (4 agents)
- **Agent browser** — Browse and select from all **91 agents** across 11 categories (AGI Farm + ECC + Agency-Agents)
- **Auto-template copying** — SOUL.md templates automatically copied to agent workspaces during setup
- **Workflow documentation** — Each template links to orchestration patterns and quick-start guides
- **Backward compatible** — Legacy wizard (3/5/11 fixed rosters) preserved
- **Zero manual setup** — Agency-Agents templates work out-of-box with no file copying required

Run enhanced wizard: `node scripts/setup-enhanced.js`

### Previous: v1.7.1 — Architectural Hardening

### 🔒 Architectural Hardening
- **Per-file mutex locking** — All service read-modify-write operations (`JobsService`, `ProjectService`, `TaskService`, `PolicyService`, `MeteringService`, `MemoryService`, `SkillsService`) now serialize concurrent writes via `withFileLockSync()`, preventing data loss from race conditions
- **CSRF token rotation** — Token rotates every 24 hours with 5-minute grace period for active connections; static tokens from env var exempt
- **Audit log pagination** — `/api/audit` now supports `offset` and `limit` query params with memory-efficient streaming; warns on malformed log lines
- **Session rate limiting** — `/api/session` endpoint has its own stricter rate limit (20 req/min) to prevent token enumeration
- **Knowledge/cron file locking** — Dashboard direct file operations (knowledge CRUD, cron toggle) now also use `withFileLockSync()`

### Previous: v1.7.0 — Dashboard Hardening & Security Overhaul

### 🛡️ Dashboard Hardening & Security Overhaul
- **Deep server-side audit** — 20 issues identified and remediated across data integrity, endpoint security, SSE reliability, and file I/O
- **SSE exponential backoff** — Reconnection now backs off 3s → 6s → 12s → ... → 60s max, resets on success (prevents server thrashing)
- **Input sanitization everywhere** — New `sanitizeText()` helper applied to broadcast, knowledge, comms, and approval endpoints; strips control characters
- **CSRF hardening** — `/api/stream` and `/api/data` now validate CSRF tokens; SSE accepts token via query parameter
- **Workspace validation** — Server validates workspace directory exists and is writable at startup, exits cleanly on failure
- **Broadcaster thread-safety** — Fixed Set mutation during iteration in SSE fan-out
- **Silent failure logging** — `readJson()`/`readMd()` now log warnings on file read failures instead of silently returning empty values
- **Null safety sweep** — Comprehensive guards across all 20+ dashboard tabs preventing crashes on missing/malformed data
- **Component prop consistency** — Fixed mismatched prop names between server snapshot and frontend components

### 🔧 5 New Dashboard Tabs + Security Dashboard
- **Decisions tab** — View and manage policy decisions and approval workflows
- **Failures tab** — Track and analyze job/task failures with error details
- **Processes tab** — Monitor running agent processes and system health
- **R&D tab** — Experiments tracking with status and results visualization
- **Settings tab** — Configure project defaults and feature flags from the UI
- **Security Dashboard** — Real-time vulnerability scanning, auto-fix capabilities, and security history

### 📊 Dashboard Data & API Completeness
- **Missing endpoint coverage** — Added server handlers for all frontend API calls (tasks, projects, jobs, intake, comms, knowledge)
- **Project enrichment** — Server-side project enrichment with task counts, progress, team agents, and risk indicators
- **Auto-derived tasks** — Tasks automatically derived from jobs with `rootTaskId` for complete task visibility
- **Error feedback** — User-facing error messages and loading states across all interactive components

### Previous: v1.6.0 — Agency-Agents Integration

### 🎭 Agency-Agents Integration: 59 Specialized Personalities
- **59 battle-tested agent templates** from [@msitarzewski's Agency-Agents](https://github.com/msitarzewski/agency-agents)
- **11 specializations**: Engineering, Design, Marketing, Product, PM, Testing, Support, Spatial Computing, Strategy, and more
- **Production-proven workflows** with 10,000+ lines of personality definitions and code examples
- **Standout agents**: Agents Orchestrator, Evidence Collector, Reality Checker, Whimsy Injector, Reddit Community Builder
- **Total library**: **91 agents** (16 AGI Farm + 16 ECC + 59 Agency-Agents)
- **Zero dependencies** — Pure markdown templates, instantly usable
- **See:** [Agency-Agents Integration Guide](AGENCY_AGENTS_GUIDE.md)

### 🔄 Enhanced Orchestration Patterns
- **Pipeline orchestration** for Cooper: PM → Architect → [Dev ↔ QA Loop] → Integration
- **Quality gate patterns** for Vigil: Evidence Collector + Reality Checker methodologies
- **4 workflow templates**: Startup MVP, Marketing Campaign, Enterprise Feature, Quality-First teams
- **Automated update system** for keeping Agency-Agents templates current
- **See:** [Orchestration Patterns](templates/ORCHESTRATION_PATTERNS.md) | [Quality Gates](templates/QUALITY_GATE_PATTERNS.md) | [Workflow Templates](templates/WORKFLOW_TEMPLATES.md)

### Previous: ECC Integration v1.5.0
- **69 specialized skills** from Everything Claude Code (Anthropic hackathon winner)
- **16 ECC agent templates** for domain-specific delegation
- **33 slash commands** for common workflows
- **TDD & Security-First** — 80%+ test coverage enforced, comprehensive security scans
- **See:** [ECC Integration Guide](docs/ECC_INTEGRATION_GUIDE.md)

### Previous: Dashboard UI v2: Agent OS Overhaul (v1.4.0)
- 🛰️ **Agent OS Aesthetic**: Professional, minimalist, and high-contrast obsidian design.
- 📉 **Strategic Command Matrix**: High-density project matrix with integrated Gantt and Burndown visualizations.
- 🧬 **Fleet Pulse signatures**: Minimalist neural activity and heartbeat monitoring for the entire fleet.
- 📊 **Efficiency Analytics**: Professional data visualizations for agent velocity and task throughput.
- ⚡ **Performance Optimization**: 60% reduction in dashboard asset size and faster SSE fan-out.

## 🆕 Previous Updates (v1.2.0 - v1.3.x)

### Previous Highlights (v1.1.x)
- 🔄 **GitHub release detection & Auto-Update system directly from dashboard**
- ⚙️ **Feature-Flagged Core Runtime** (Jobs, Approvals, Memory, Skills)
- 🛡️ **Extensive Security Hardening** (CSRF, CSP, token validation, atomic file writes)

---

## 📸 Preview

### Dashboard Overview
```
┌──────────────────────────────────────────────────────────────────────┐
│  🦅 AGI Ops Room   ● LIVE   Online: 8/11  Pending: 4  Budget: $45  │
├──────────────────────────────────────────────────────────────────────┤
│  🔄 Update available: v1.0.2 → v1.1.0  [Release Notes] [Update Now]│
├──────────────────────────────────────────────────────────────────────┤
│ Overview │ Agents │ Tasks │ Projects │ Crons │ HITL │ Alerts │ ...  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 📊 42    │  │ ✅ 38    │  │ ⏳ 4      │  │ 🚨 2     │            │
│  │ Tasks    │  │ Done     │  │ Active   │  │ HITL     │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 🔮 Sage    ✅ Ready  📨 3 msgs  ⭐ 94%  [Send Message]   │      │
│  │ ⚒️ Forge   🔄 Busy   📨 7 msgs  ⭐ 89%  [Send Message]   │      │
│  │ 🐛 Pixel   ✅ Ready  📨 2 msgs  ⭐ 96%  [Send Message]   │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Team Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    11-Agent Team (Full Stack)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      🦅 Cooper (Orchestrator)                   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              │               │               │                  │
│         🔮 Sage          ⚒️ Forge        🐛 Pixel              │
│      (Architect)     (Builder)      (Debugger)                 │
│              │               │               │                  │
│         🔭 Vista        🔊 Cipher       🛡️ Vigil               │
│       (Analyst)      (Knowledge)       (QA)                    │
│              │               │               │                  │
│         ⚓ Anchor        📡 Lens        🔄 Evolve               │
│      (Content)      (Multimodal)   (Process)                   │
│                              │                                  │
│                          🧪 Nova                                │
│                         (R&D Lead)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### One-Step Install & Setup

The recommended way to install and configure AGI Farm is with this single command. It will globally install the CLI and immediately launch the interactive setup wizard:

```bash
npm install -g agi-farm && agi-farm setup
```

### Alternative Installation

If you prefer to install it purely as an OpenClaw plugin (without the global CLI binary), you can use the built-in plugin manager, but you **must** use the `npx` runner to execute the setup wizard:

```bash
openclaw plugins install agi-farm
npx agi-farm setup
```

### Upgrade (Existing Install)

```bash
# Update an already installed OpenClaw plugin
openclaw plugins update agi-farm

# One-liner: install first, or update if already installed
openclaw plugins install agi-farm || openclaw plugins update agi-farm
```

### Run Setup Wizard

```bash
# Start the interactive wizard anytime
agi-farm setup
```

Answer the setup prompts and your team will be live in ~2 minutes:

```
🧙 AGI Farm Setup Wizard

? Team name (e.g., "CooperCorp"): MyTeam
? Orchestrator name: Cooper
? Team size: 11 agents (Full Stack)
? Domain: general
? Collaboration frameworks: langgraph
? Auto-create project channel per project: Yes
? Default execution path: AGI-Farm first
? Confirm setup? Yes

✅ Creating 11 agents...
✅ Setting up workspace...
✅ Initializing AGI Farm registries...

🎉 Your AI team is ready!
```

Setup now captures project defaults in `PROJECTS.json`, including:
- `auto_project_channel` (default: `true`)
- `execution_path` (default: `agi-farm-first`)

This makes AGI Farm the default execution path for newly created projects.

### Project Defaults

New projects inherit defaults from `PROJECTS.json`:
- **Auto Project Channel**: when enabled, each new project gets a dedicated channel
- **Execution Path**: choose `agi-farm-first` (multi-agent routing) or `direct-first` (immediate execution)

View and edit defaults via:
- Dashboard → Settings tab
- `GET /api/projects` → `defaults` field
- `PATCH /api/projects/defaults` API endpoint

---

## 📦 Commands

| Command | CLI Shortcut | Description |
|---------|-------------|-------------|
| 🎯 `agi-farm setup` | `agi-farm` | Full wizard — agents, workspace, crons (Classic mode: 3/5/11 agents) |
| ✨ `node scripts/setup-enhanced.js` | — | **Enhanced wizard (v1.7.0)** — Workflow templates + Agent browser (91 agents) |
| 🗑️ `agi-farm teardown` | `agi-farm-teardown` | Team teardown — removes AGI Farm agents, bundle, and workspace registries |
| 📊 `agi-farm status` | `agi-farm-status` | Team health: agents, tasks, cron status |
| 🔧 `agi-farm rebuild` | `agi-farm-rebuild` | Regenerate workspace from bundle |
| 📤 `agi-farm export` | `agi-farm-export` | Push bundle to GitHub |
| 🖥️ `agi-farm dashboard` | `agi-farm-dashboard` | Launch live ops room (SSE, :8080) |
| ⚡ `agi-farm dispatch` | `agi-farm-dispatch` | Run auto-dispatcher manually |
| 🍎 `agi-farm launchagent` | `agi-farm-launchagent` | Install/uninstall macOS LaunchAgent for persistent dashboard |

### 🆕 Enhanced Wizard (v1.7.0)

The enhanced wizard offers **4 workflow templates** and **agent browsing** for all 91 agents:

**Run it**:
```bash
cd ~/.openclaw/extensions/agi-farm  # or global npm path
node scripts/setup-enhanced.js
```

**Features**:
- 🚀 **Startup MVP** (5 agents, 1-2 weeks) — Cooper, Forge, Pixel, Vigil, Growth Hacker
- 📈 **Marketing Campaign** (5 agents, 2-4 weeks) — Cooper, Content Creator, Twitter Engager, Reddit Builder, Analytics
- 🏢 **Enterprise Feature** (6 agents, 4-8 weeks) — Cooper, Vista, Sage, Vigil, Experiment Tracker, Reality Checker
- 🔬 **Quality-First** (4 agents, quality-driven) — Cooper, Vigil (Evidence), Reality Checker, Performance Benchmarker
- 🎨 **Custom** — Browse all 91 agents by category and select your own team

**Automatic template copying**: Agency-Agents SOUL.md templates are copied to agent workspaces automatically.

---

## 🍎 Persistent Dashboard (macOS LaunchAgent)

The dashboard can run as a macOS LaunchAgent — it starts on login and auto-restarts if it crashes, independent of the OpenClaw gateway lifecycle.

### Install

```bash
# Install with defaults (port 8080, localhost)
agi-farm-launchagent

# Custom port and workspace
agi-farm-launchagent --port 9090 --workspace ~/my-workspace
```

### Uninstall

```bash
agi-farm-launchagent --uninstall
```

### Why use this?

The plugin lifecycle (`onLoad`) spawns the dashboard as a child process. If the gateway exits, restarts, or doesn't reliably complete the lifecycle, the dashboard dies with it. The LaunchAgent runs the dashboard as an independent OS-level service:

- **RunAtLoad** — starts automatically on login
- **KeepAlive** — restarts if it crashes
- **Logs** — stdout/stderr saved to `/tmp/openclaw/agi-farm-dashboard.log`

> **Linux users**: Use `systemd` with a similar service unit. See the plist template in `templates/` for reference.

---

## 🏗️ Architecture

### Plugin Structure

```
.openclaw/extensions/agi-farm/ (or global node_modules/agi-farm/)
├── 📦 package.json              Plugin manifest (ESM)
├── ⚙️ openclaw.plugin.json     Config schema & commands
├── 📂 dist/                    Compiled TypeScript (backend)
├── 📂 dashboard-dist/          Built React frontend (production)
├── 🌐 server/
│   ├── 🖥️ dashboard.js         SSE server + CRUD API (Node.js)
│   ├── 🔄 updater.js           GitHub release checker + auto-update
│   └── 🛠️ utils.js             Core parsing & logic (Unit Tested)
├── 📜 scripts/
│   ├── 🎯 setup.js             Setup wizard
│   ├── 🗑️ teardown.js          Uninstall mechanism
│   ├── 📊 status.js            Status checker
│   ├── 🔧 rebuild.js           Rebuilder
│   ├── 📤 export.js            GitHub exporter
│   ├── 🖥️ dashboard.js         Dashboard launcher
│   ├── ⚡ dispatch.js          Auto-dispatcher
│   └── 📂 lib/
│       └── 🛠️ run-command.js   Shared CLI utility
├── 📋 templates/               Agent & workspace templates
├── ⚛️ dashboard-react/         Vite + React 18 source (Dev)
└── 📚 skills/
    └── 📖 SKILL.md             Embedded documentation
```

### Dashboard Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Dashboard Data Flow                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📂 Workspace Files                                          │
│  ├── TASKS.json                                              │
│  ├── AGENT_STATUS.json                                       │
│  └── comms/broadcast.md                                      │
│           │                                                  │
│           │ file change (250ms debounce)                     │
│           ▼                                                  │
│  ┌─────────────────────┐                                    │
│  │ WorkspaceWatcher    │ 👁️ chokidar file watcher          │
│  └─────────────────────┘                                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────┐    ┌──────────────────┐           │
│  │ SlowDataCache       │    │ Broadcaster      │           │
│  │ (30s cache)         │───▶│ (SSE fan-out)    │           │
│  └─────────────────────┘    └──────────────────┘           │
│           │                          │                       │
│  ┌─────────────────────┐             │ SSE stream            │
│  │ UpdateChecker       │             ▼                       │
│  │ (6h GitHub cache)   │   ┌──────────────────┐             │
│  └─────────────────────┘   │ React Frontend   │             │
│                             │ (Vite + Recharts)│             │
│                             └──────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Real-time Data Flow

```
┌──────────────┐     250ms      ┌──────────────┐     SSE      ┌──────────────┐
│  Workspace   │ ──────────────▶│   Server     │ ───────────▶ │   Browser    │
│   Files      │    chokidar    │  dashboard.js│   ~350ms     │   React      │
└──────────────┘                └──────────────┘              └──────────────┘
     ▲                                                           │
     │                                                           │
     │                      ┌──────────────┐                     │
     └──────────────────────│   OpenClaw   │◀────────────────────┘
          CLI commands      │     CLI      │    User actions
                            └──────────────┘
```

---

## 🤖 Team Presets

### 3-Agent (Minimal) 🏃

Perfect for simple workflows and quick prototypes.

```
🦅 Orchestrator
    │
    ├──▶ 🔮 Researcher
    │        │
    └──▶ ⚒️ Builder
```

**Best for:** Quick prototypes, simple automation, learning

---

### 5-Agent (Standard) ⚡

Balanced team for production workloads.

```
                🦅 Orchestrator
                     │
         ┌───────────┼───────────┐
         │                       │
    🔮 Researcher           🛡️ QA
         │                       │
    ⚒️ Builder             ⚓ Content
```

**Best for:** Production apps, balanced workloads, medium complexity

---

### 11-Agent (Full Stack) 🚀

Complete team for complex systems - **RECOMMENDED**

```
                        🦅 Cooper
                      (Orchestrator)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   🔮 Sage            ⚒️ Forge           🐛 Pixel
 (Architect)        (Builder)         (Debugger)
        │                  │                  │
   🔭 Vista          🔊 Cipher         🛡️ Vigil
  (Analyst)        (Knowledge)           (QA)
        │                  │                  │
   ⚓ Anchor           📡 Lens          🔄 Evolve
  (Content)       (Multimodal)       (Process)
                           │
                       🧪 Nova
                      (R&D Lead)
```

**Best for:** Complex systems, enterprise, full-stack development

---

## 🧠 Model Selection Guide

Choose the right model for each role to optimize cost and quality:

| Role | Recommended Model | Why | Cost/Quality |
|------|-----------|-----|--------------|
| 🦅 Orchestrator | `anthropic/claude-3-5-sonnet` | High-level planning & delegation | 💰💰💰 / ⭐⭐⭐ |
| 🔮 Architect | `anthropic/claude-3-opus` | Deep reasoning & system design | 💰💰💰 / ⭐⭐⭐ |
| ⚒️ Engineer | `google/gemini-1.5-pro` | Reliable code gen & large context | 💰💰 / ⭐⭐ |
| 🐛 Debugger | `anthropic/claude-3-5-sonnet` | Precision logic & error analysis | 💰💰 / ⭐⭐⭐ |
| 🔭 Analyst | `google/gemini-2.0-flash` | Ultra-fast data synthesis | 💰 / ⭐⭐ |
| 🛡️ QA | `anthropic/claude-3-haiku` | Rapid pattern validation | 💰 / ⭐ |
| ⚓ Content | `google/gemini-1.5-pro` | Rich multimodal generation | 💰💰 / ⭐⭐⭐ |
| 🧪 R&D | `deepseek/deepseek-reasoner` | Structured creative experimentation | 💰 / ⭐⭐⭐ |

---

## ⚙️ Configuration

Configure AGI Farm in your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "agi-farm": {
        "enabled": true,
        "config": {
          "dashboardPort": 8080,
          "dashboardHost": "127.0.0.1",
          "autoStartDashboard": true,
          "autoCheckUpdates": true,
          "workspacePath": "~/.openclaw/workspace",
          "bundlePath": "~/.openclaw/workspace/agi-farm-bundle",
          "featureJobs": true,
          "featureSkills": true,
          "featureMemory": true,
          "featurePolicy": true,
          "featureMetering": true,
          "featureApprovals": true
        }
      }
    }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dashboardPort` | number | 8080 | Port for live ops dashboard |
| `dashboardHost` | string | "127.0.0.1" | Bind address for dashboard |
| `autoStartDashboard` | boolean | true | Auto-start dashboard on load |
| `autoCheckUpdates` | boolean | true | Check GitHub for new releases on startup |
| `workspacePath` | string | ~/.openclaw/workspace | Path to OpenClaw workspace |
| `bundlePath` | string | <workspace>/agi-farm-bundle | Path to bundle directory |
| `featureJobs` | boolean | true | Enable jobs runtime APIs + background worker |
| `featureSkills` | boolean | true | Enable skills registry and routing endpoints |
| `featureMemory` | boolean | true | Enable memory indexing + search endpoint |
| `featurePolicy` | boolean | true | Enable policy evaluation on runtime/mutation actions |
| `featureMetering` | boolean | true | Enable usage metering collection + API |
| `featureApprovals` | boolean | true | Enable approval workflows for policy-gated actions |

### Runtime Files Added By Core Modules

When feature flags are enabled, AGI Farm lazily creates these additive workspace files:

- `JOBS.json`
- `JOB_RUNS.jsonl`
- `SKILLS_REGISTRY.json`
- `MEMORY_INDEX.json`
- `POLICIES.json`
- `APPROVALS.json`
- `AUDIT_LOG.jsonl`
- `USAGE_METERING.json`
- `SECRETS/` (encrypted blobs + metadata)

---

## 📊 Dashboard Data Sources

All data updates in real-time from workspace files:

| Field | Source | Refresh | Latency |
|-------|--------|---------|---------|
| 📋 Tasks | `TASKS.json` | Instant | ~50ms |
| 🤖 Agents | `AGENT_STATUS.json` | Instant | ~50ms |
| 📬 Comms | `comms/inboxes/*.md` | Instant | ~50ms |
| 🚨 Alerts | `ALERTS.json` | Instant | ~50ms |
| 📂 Projects | `PROJECTS.json` | Instant | ~50ms |
| 💰 Budget | `BUDGET.json` | Instant | ~50ms |
| 📈 Velocity | `VELOCITY.json` | Instant | ~50ms |
| 🎯 OKRs | `OKRs.json` | Instant | ~50ms |
| 📢 Broadcast | `comms/broadcast.md` | Instant | ~50ms |
| 🧪 Experiments | `EXPERIMENTS.json` | Instant | ~50ms |
| 📚 Knowledge | `SHARED_KNOWLEDGE.json` | Instant | ~50ms |
| 🧠 Memory | `MEMORY.md` | Instant | ~50ms |
| 🔄 Agent Models | `openclaw agents list` | Cached | ~30s |
| 🗂️ Jobs | `JOBS.json` | Instant | ~50ms |
| ✅ Approvals | `APPROVALS.json` | Instant | ~50ms |
| 📊 Usage | `USAGE_METERING.json` | Instant | ~50ms |

### Interactive Actions (API)

The dashboard enables direct control over team operations via authenticated REST endpoints (all require CSRF token):

**HITL & Cron Controls:**
- `POST /api/hitl/:id/approve` — Continue task with optional notes
- `POST /api/hitl/:id/reject` — Block task and notify agent
- `POST /api/cron/:id/trigger` — Manually run a specific cron job
- `POST /api/cron/:id/toggle` — Enable or disable a cron job
- `POST /api/jobs` — Create a background job from high-level intent
- `GET /api/jobs` / `GET /api/jobs/:id` — List and inspect jobs
- `POST /api/jobs/:id/cancel` / `POST /api/jobs/:id/retry` — Control failed/running jobs
- `GET /api/skills` + `POST /api/skills/:id/(enable|disable)` — Manage skill activation
- `GET /api/memory/search?q=&tags=` — Search memory index
- `GET /api/policies` — Retrieve active policy rules
- `GET /api/approvals` + `POST /api/approvals/:id/(approve|reject)` — Human approval queue
- `GET /api/usage` — Usage and cost aggregates for dashboard

**CRUD Operations:**
- `POST /api/tasks` — Create a new task with assignee, priority, dependencies
- `POST /api/comms/:id/send` — Send a message to a specific agent inbox
- `POST /api/broadcast` — Post a team-wide broadcast message
- `POST /api/knowledge` — Add a shared knowledge entry
- `DELETE /api/knowledge/:id` — Remove a knowledge entry

**LobsterBoard Parity Foundations (P0):**
- `GET /api/auth/status` — PIN/public-mode status + write unlock state
- `POST /api/auth/verify-pin` — Verify PIN and issue write auth token
- `POST /api/auth/set-pin` / `POST /api/auth/remove-pin` — Manage dashboard PIN lock
- `POST /api/auth/public-mode` — Toggle read-only public mode
- `GET /api/secrets` / `GET /api/secrets/:scope` — List masked secrets metadata
- `POST /api/secrets/:scope` / `DELETE /api/secrets/:scope/:key` — Store/delete scoped secrets
- `GET /api/templates` / `GET /api/templates/:id` — List and inspect dashboard templates
- `POST /api/templates/export` / `POST /api/templates/import` — Export/import template settings

**Integrated LobsterBoard Runtime (same host/process):**
- Full LobsterBoard runtime is mounted internally at `GET /lobsterboard/`
- Dashboard tab `LobsterBoard` loads this internal route (no separate user-facing port required)
- API/static calls from LobsterBoard are proxied through AGI Farm server under the same origin

**Auto-Update:**
- `GET /api/update-check` — Force a fresh GitHub release check
- `POST /api/update-install` — Install latest version via npm

**Total push latency:** ~350ms from file change to browser update

---

## ⚡ Auto-Dispatcher

The auto-dispatcher intelligently routes tasks to agents:

```
┌──────────────────────────────────────────────────────────────┐
│                    Auto-Dispatcher Flow                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 Pending Tasks                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────┐     No     ┌──────────────┐                │
│  │ HITL Check  │───────────▶│   Skip Task  │                │
│  └─────────────┘            └──────────────┘                │
│       │ Yes                                                  │
│       ▼                                                      │
│  ┌─────────────┐     Yes    ┌──────────────┐                │
│  │ Rate Limit? │───────────▶│ Backoff Wait │                │
│  └─────────────┘            └──────────────┘                │
│       │ No                                                   │
│       ▼                                                      │
│  ┌─────────────┐     No     ┌──────────────┐                │
│  │ Deps Met?   │───────────▶│   Skip Task  │                │
│  └─────────────┘            └──────────────┘                │
│       │ Yes                                                  │
│       ▼                                                      │
│  ┌─────────────┐                                            │
│  │ Fire Agent  │ ▶ openclaw agents run <agent> <task>       │
│  └─────────────┘                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Features

- ✅ **HITL Integration** — Human-in-the-loop decision requests
- ✅ **Rate-Limit Backoff** — Exponential backoff on API limits (default: 10min)
- ✅ **Dependency Checking** — Respects task dependencies
- ✅ **Cron Schedule** — Runs automatically every 1 minute

```bash
# Manual dry-run
agi-farm dispatch

# Check logs
tail -f ~/.openclaw/workspace/logs/auto-dispatch.log
```

---

## 🛠️ Installation from Source

```bash
# Clone the repository
git clone https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN.git
cd AGI-FARM-PLUGIN

# Install dependencies
npm install

# Build backend and dashboard
npm run build:all

# Link to OpenClaw extensions
ln -s $(pwd) ~/.openclaw/extensions/agi-farm
```

> If you later switch to `openclaw plugins install agi-farm`, remove the dev symlink first:
> `rm -f ~/.openclaw/extensions/agi-farm`

---

## 🧹 Uninstall Guide

```bash
# 1) Remove AGI Farm team data (agents, bundle, registries)
agi-farm teardown

# 2) Remove plugin from OpenClaw
openclaw plugins uninstall agi-farm --force

# 3) Optional: remove standalone global CLI binary
npm uninstall -g agi-farm
```

Notes:
- `agi-farm teardown` does not uninstall the plugin package.
- `openclaw plugins uninstall agi-farm --force` removes the plugin install used by OpenClaw.

---

## 💻 Development

```bash
# Build everything (TS + Dashboard)
npm run build:all

# Build backend only
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run unit tests (Jest + ESM)
npm test

# Start dashboard server manually
npm run start-dashboard
```

---

## 🔧 Troubleshooting

| Symptom | Fix | Command |
|---------|-----|---------|
| ❌ Plugin fails to load | Check global install | `npm list -g agi-farm` |
| ❌ `plugin already exists` on install | Use plugin update command | `openclaw plugins update agi-farm` |
| 📊 Dashboard shows stale data | Sync with workspace | `agi-farm status` |
| 🤖 Agent stuck >30 min | Verify heartbeats | `cat ~/.openclaw/workspace/HEARTBEAT.md` |
| ⚠️ `openclaw` not found | Add to PATH | `export PATH=$PATH:$(npm bin -g)` |
| 🔐 Access Denied | Check npm login | `npm whoami` |
| ⏰ Cron registration error | Clean crontab | `openclaw cron list --fix` |
| 📄 JSON Parse Error | Re-run setup | `agi-farm setup --force` |

---

## 🔒 Security

This plugin is designed with defense-in-depth security:

| Layer | Protection |
|-------|-----------|
| **Network** | Dashboard binds to `127.0.0.1` only — not exposed to LAN or internet |
| **Origin validation** | `/api/session` gated by Origin/Referer — cross-origin token theft blocked |
| **CSRF tokens** | All mutation endpoints require timing-safe CSRF token comparison; token rotates every 24h with 5-min grace period |
| **SSE authentication** | `/api/stream` and `/api/data` require CSRF token — prevents cross-origin data exfiltration |
| **Security headers** | CSP, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy |
| **Input validation** | Agent IDs validated via `isSafeId()` regex — blocks path traversal |
| **Input sanitization** | All user inputs (notes, messages, knowledge) stripped of control chars via `sanitizeText()`/`sanitizeNote()` |
| **Rate limiting** | 120 req/min (read), 30 req/min (mutations), 20 req/min (session) per IP |
| **Startup validation** | Workspace directory validated for existence and write access before server starts |
| **File locking** | Per-file mutex (`withFileLockSync`) on all service read-modify-write operations — prevents concurrent corruption |
| **Atomic writes** | All file mutations use `.tmp` → `rename` pattern with in-memory locks |
| **Shell injection** | Update installer uses `execFile` (not `exec`) to prevent injection |
| **Credential isolation** | Uses OpenClaw CLI — no API keys stored in plugin |
| Supports encrypted secrets (`SECRETS/`, AES-256-GCM) | Expose secret values in API responses |

**Your credentials stay in OpenClaw's configuration.**

---

## 📚 Plugin vs Skill

AGI Farm was migrated from a **skill** to a **plugin** because it:

| Requirement | Skill | Plugin |
|-------------|-------|--------|
| Background services | ❌ | ✅ Dashboard server |
| Complex wizard (15+ steps) | ⚠️ | ✅ Better UX |
| System integration | ❌ | ✅ Cron, LaunchAgent |
| Configuration management | ⚠️ | ✅ Schema-based |

The embedded `skills/agi-farm/SKILL.md` provides documentation reference for agents.

---

## 🔄 OpenClaw Compatibility

AGI Farm ensures compatibility with OpenClaw through **automated testing** and **proactive monitoring**:

### Automated Compatibility Testing
- **Weekly testing** against multiple OpenClaw versions (latest, previous, oldest-supported, beta)
- **Performance benchmarks** to detect regressions (load time, validation time thresholds)
- **API deprecation scanning** with automated replacement suggestions
- **Automated PR creation** for compatibility fixes when breaking changes detected

### Supported Versions
- **Minimum**: OpenClaw 1.0.0+
- **Tested**: Latest stable + previous stable + beta (when available)
- **Status**: All compatibility tests run weekly via GitHub Actions

### For Users
Check compatibility before upgrading OpenClaw:
```bash
# Check current OpenClaw version
openclaw --version

# Run validation
npm run validate

# View compatibility matrix
cat OPENCLAW_COMPATIBILITY.md
```

### For Maintainers
The enhanced compatibility system includes:
- Multi-version testing matrix (4 versions tested)
- Performance regression detection (<5s load time, <3s validation)
- Automated issue creation when incompatibility detected
- Optional automated PR generation with suggested fixes

**See:** [OPENCLAW_COMPATIBILITY.md](OPENCLAW_COMPATIBILITY.md) for complete compatibility guide.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

This plugin integrates production-ready AI resources from the following exceptional projects:

### Agency-Agents (NEW in v1.6.0)
- **Repository**: https://github.com/msitarzewski/agency-agents
- **Author**: [@msitarzewski](https://github.com/msitarzewski)
- **Achievement**: 50+ requests in first 12 hours on Reddit, months of production iteration
- **Integration**: 59 specialized agent personalities across 11 categories
- **Impact**: Battle-tested workflows for Engineering, Design, Marketing, Product, PM, Testing, Support, Spatial Computing, and Strategy

The Agency-Agents collection dramatically expands AGI Farm's agent library with proven personalities including:
- **Agents Orchestrator** - Meta-agent for pipeline management (PM → Architect → Dev-QA Loop → Integration)
- **Evidence Collector** - Screenshot-based QA (defaults to finding 3-5 issues minimum)
- **Reality Checker** - Production readiness certification (defaults to "NEEDS WORK")
- **Whimsy Injector** - Delightful UX enhancements that serve functional or emotional purpose
- **Reddit Community Builder** - Authentic community engagement patterns

**Special thanks to @msitarzewski for creating and sharing these exceptional agent personalities with the community.**

### Everything Claude Code (ECC)
- **Repository**: https://github.com/affaan-m/everything-claude-code
- **Author**: [@affaan-m](https://github.com/affaan-m)
- **Achievement**: Winner of Anthropic's Claude Code hackathon
- **Integration**: 510 resource files (16 agents, 69 skills, 33 commands, 7 guides)
- **Impact**: Industry-standard TDD workflows, security scans, API design patterns, and framework templates for Python/Django/Spring Boot/Go/Swift/PostgreSQL

The ECC framework provides the foundation for AGI Farm's production-ready coding capabilities, including:
- Test-driven development workflows with 80%+ coverage enforcement
- Comprehensive security scanning and vulnerability detection (via AgentShield)
- API design patterns and best practices
- Framework-specific templates and conventions
- Auto-delegation based on agent roles

**Special thanks to @affaan-m for creating and open-sourcing this exceptional framework.**

### Combined Impact

**Total Integrated Resources**:
- **91 agent templates** (16 AGI Farm + 16 ECC + 59 Agency-Agents)
- **69 production skills** (ECC)
- **33 slash commands** (ECC)
- **7 quality automation hooks** (AGI Farm)
- **10,000+ lines** of agent personalities and workflows

AGI Farm is proud to stand on the shoulders of these giants, combining the best of community-driven AI agent development into a single, cohesive plugin.

---

## 📝 License

MIT License — built for [OpenClaw](https://docs.openclaw.ai)

Copyright (c) 2025 oabdelmaksoud

## 📈 Star History

<a href="https://www.star-history.com/?repos=oabdelmaksoud%2FAGI-FARM-PLUGIN&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=oabdelmaksoud/AGI-FARM-PLUGIN&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=oabdelmaksoud/AGI-FARM-PLUGIN&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=oabdelmaksoud/AGI-FARM-PLUGIN&type=date&legend=bottom-right" />
 </picture>
</a>

---

## 🔗 Links

- **GitHub**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
- **Issues**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
- **OpenClaw Docs**: https://docs.openclaw.ai
- **NPM Package**: https://www.npmjs.com/package/agi-farm

---

<div align="center">

**Made with ❤️ for the OpenClaw community**

[⬆ Back to Top](#-agi-farm)

</div>
