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
| 🛡️ **Production Hardened** | Security-audited with CSRF, Origin validation, CSP headers, and timing-safe auth |
| 🧪 **39 Unit Tests** | Extension lifecycle, security (ID validation, note sanitization), parsing, and CLI utilities verified with Jest/ESM |

---

## 🆕 Recent Updates

- 🔐 **CSRF token endpoint hardened**: `/api/session` now requires same-origin validation — cross-origin token theft blocked.
- 🛡️ **SSE & data endpoints authenticated**: `/api/stream` and `/api/data` now require CSRF token — prevents cross-origin data exfiltration.
- 🔒 **Security headers**: added CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and XSS-Protection.
- 🧹 **Path traversal fix**: agent IDs from `AGENT_STATUS.json` are validated through `isSafeId()` before filesystem use.
- 🚫 **HITL note sanitization**: `sanitizeNote()` strips control characters and prevents CLI flag injection.
- 🔄 **Cron file locking**: `toggleCronEnabled` uses a mutex to prevent concurrent read-modify-write races.
- 🧪 **39 unit tests**: added `isSafeId` and `sanitizeNote` test suites (was 28).
- ⚙️ **CI hardened**: added eslint lint step and `npm audit --audit-level=high` to CI pipeline.
- 📦 **All commands exposed**: all 7 commands now available as global executables via `package.json` bin field.

---

## 📸 Preview

### Dashboard Overview
```
┌─────────────────────────────────────────────────────────────────┐
│  🦅 AGI Farm Dashboard              Budget: $45.23/100  [LIVE] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 📊 42    │  │ ✅ 38    │  │ ⏳ 4      │  │ 🚨 2     │       │
│  │ Tasks    │  │ Done     │  │ Active   │  │ SLA Risk │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔮 Sage        ✅ Ready    📨 3 msgs    ⭐ 94% quality  │   │
│  │ ⚒️ Forge       🔄 Busy     📨 7 msgs    ⭐ 89% quality  │   │
│  │ 🐛 Pixel       ✅ Ready    📨 2 msgs    ⭐ 96% quality  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
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

### Install

```bash
# Install officially from npm
npm install -g agi-farm

# Or via OpenClaw plugin manager
openclaw plugins install agi-farm
```

### Run Setup Wizard

```bash
# Start the interactive wizard
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
? Confirm setup? Yes

✅ Creating 11 agents...
✅ Setting up workspace...
✅ Initializing AGI Farm registries...

🎉 Your AI team is ready!
```

---

## 📦 Commands

| Command | CLI Shortcut | Description |
|---------|-------------|-------------|
| 🎯 `agi-farm setup` | `agi-farm` | Full wizard — agents, workspace, crons |
| 🗑️ `agi-farm teardown` | `agi-farm-teardown` | Full uninstall — removes agents, bundle, and registries |
| 📊 `agi-farm status` | `agi-farm-status` | Team health: agents, tasks, cron status |
| 🔧 `agi-farm rebuild` | `agi-farm-rebuild` | Regenerate workspace from bundle |
| 📤 `agi-farm export` | `agi-farm-export` | Push bundle to GitHub |
| 🖥️ `agi-farm dashboard` | `agi-farm-dashboard` | Launch live ops room (SSE, :8080) |
| ⚡ `agi-farm dispatch` | `agi-farm-dispatch` | Run auto-dispatcher manually |

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
│   ├── 🖥️ dashboard.js         SSE server (Node.js)
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
│                                      │                       │
│                                      │ SSE stream            │
│                                      ▼                       │
│                            ┌──────────────────┐             │
│                            │ React Frontend   │             │
│                            │ (Vite + Recharts)│             │
│                            └──────────────────┘             │
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
          "workspacePath": "~/.openclaw/workspace",
          "bundlePath": "~/.openclaw/workspace/agi-farm-bundle"
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
| `workspacePath` | string | ~/.openclaw/workspace | Path to OpenClaw workspace |
| `bundlePath` | string | <workspace>/agi-farm-bundle | Path to bundle directory |

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

### Interactive Actions (API)

The dashboard enables direct control over team operations via authenticated REST endpoints (all require CSRF token):

- `POST /api/hitl/:id/approve` — Continue task with optional notes
- `POST /api/hitl/:id/reject` — Block task and notify agent
- `POST /api/cron/:id/trigger` — Manually run a specific cron job
- `POST /api/cron/:id/toggle` — Enable or disable a cron job

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
| **CSRF tokens** | All mutation endpoints require timing-safe CSRF token comparison |
| **SSE authentication** | `/api/stream` and `/api/data` require CSRF token — prevents cross-origin data exfiltration |
| **Security headers** | CSP, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy |
| **Input validation** | Agent IDs validated via `isSafeId()` regex — blocks path traversal |
| **Note sanitization** | HITL notes stripped of control chars; CLI flag injection prevented |
| **Rate limiting** | 120 req/min (read), 30 req/min (mutations) per IP |
| **File locking** | Cron file writes use mutex to prevent concurrent corruption |
| **Credential isolation** | Uses OpenClaw CLI — no API keys stored in plugin |

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
