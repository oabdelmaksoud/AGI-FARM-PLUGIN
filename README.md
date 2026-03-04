<div align="center">

# 🦅 AGI Farm

### One wizard. Full multi-agent AI team. Live in minutes.

**Build production-ready AI teams with a single command**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Plugin-blue.svg)](https://docs.openclaw.ai)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

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
| 🛡️ **Production Hardened** | Audited for security, memory leaks, and CLI timeouts |
| 🧪 **Unit Tested** | Core parsing and logic verified with a Jest/ESM test suite |

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
# Install from npm (when published)
openclaw plugins install agi-farm

# Or install from GitHub
openclaw plugins install https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN.git
```

### Run Setup Wizard

```bash
# Start the interactive wizard
/agi-farm setup
```

Answer 6 questions and your team will be live in ~2 minutes:

```
🧙 AGI Farm Setup Wizard

? Team name (e.g., "CooperCorp"): MyTeam
? Team size: 11 agents (Full Stack)
? Domain: Software Development
? Primary framework: langgraph
? GitHub repo: myteam/ai-agents
? Confirm setup? Yes

✅ Creating 11 agents...
✅ Setting up workspace...
✅ Registering cron jobs...
✅ Creating GitHub bundle...
✅ Launching dashboard...

🎉 Your AI team is ready!
```

---

## 📦 Commands

| Command | Description | Example |
|---------|-------------|---------|
| 🎯 `/agi-farm setup` | Full wizard — agents, workspace, crons | Sets up complete team |
| 🗑️ `/agi-farm teardown` | Full uninstall — removes agents & workspace | Reverts system to clean state |
| 📊 `/agi-farm status` | Team health: agents, tasks, cron status | Shows real-time metrics |
| 🔧 `/agi-farm rebuild` | Regenerate workspace from bundle | After git pull |
| 📤 `/agi-farm export` | Push bundle to GitHub | Creates new release |
| 🖥️ `/agi-farm dashboard` | Launch live ops room (SSE, :8080) | Opens in browser |
| ⚡ `/agi-farm dispatch` | Run auto-dispatcher manually | Test task routing |

---

## 🏗️ Architecture

### Plugin Structure

```
.openclaw/extensions/agi-farm/
├── 📦 package.json              Plugin manifest (ESM)
├── ⚙️ openclaw.plugin.json     Config schema & commands
├── 📂 src/
│   └── 💻 index.ts             Main plugin entry (TypeScript)
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
│   └── ⚡ dispatch.js          Auto-dispatcher
├── 📋 templates/               Agent & workspace templates
├── ⚛️ dashboard-react/         Vite + React 18 frontend
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

| Role | Model Tier | Why | Cost/Quality |
|------|-----------|-----|--------------|
| 🦅 Orchestrator | **High** (`sonnet`, `opus`) | Delegation judgment, broad reasoning | 💰💰💰 / ⭐⭐⭐ |
| 🔮 Architect | **High** | Deep analysis, design decisions | 💰💰💰 / ⭐⭐⭐ |
| ⚒️ Engineer | **Mid** (`glm-5`, `sonnet`) | Fast code gen, cost-efficiency | 💰💰 / ⭐⭐ |
| 🐛 Debugger | **High** (`opus`) | Root-cause analysis, precision | 💰💰💰 / ⭐⭐⭐ |
| 🔭 Analyst | **Mid-High** (`gemini-2.0-pro-exp`) | Long-context research | 💰💰 / ⭐⭐⭐ |
| 🛡️ QA | **Fast** (`glm-4.7-flash`) | High-volume pattern checks | 💰 / ⭐⭐ |
| ⚓ Content | **Multimodal** (`gemini-2.0-pro-exp`) | Vision + rich generation | 💰💰 / ⭐⭐⭐ |
| 🧪 R&D | **High** | Creative + structured experiments | 💰💰💰 / ⭐⭐⭐ |

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

The dashboard enables direct control over team operations via the following REST endpoints:

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
/agi-farm dispatch

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

# Build TypeScript
npm run build

# Link to OpenClaw extensions
ln -s $(pwd) ~/.openclaw/extensions/agi-farm
```

---

## 💻 Development

```bash
# Build TypeScript
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
| ❌ Plugin fails to load | Install dependencies | `npm install` |
| 📊 Dashboard shows stale data | Restart dashboard | `/agi-farm dashboard` |
| 🤖 Agent stuck >30 min | Check broadcast | `cat comms/broadcast.md` |
| ⚠️ `openclaw` not found | Add to PATH | `export PATH=$PATH:/path/to/openclaw` |
| 🔐 `gh repo create` fails | Login to GitHub | `gh auth login` |
| ⏰ Cron shows 0 crons | Check duplicates | `openclaw cron list` |
| 📄 TASKS.json parse error | Validate JSON | `python3 -m json.tool TASKS.json` |
| 🐌 Rate-limit too aggressive | Adjust backoff | Edit dispatch script |

---

## 🔒 Security

This plugin is designed with security in mind:

| ✅ What It Does | ❌ What It Doesn't Do |
|----------------|----------------------|
| Uses OpenClaw CLI (inherits credentials) | Store API keys or tokens |
| Reads/writes local workspace files | Send data to external servers |
| Runs local HTTP server (127.0.0.1) | Expose data to network |
| Uses your configured LLM providers | Add additional authentication |

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

---

## 🔗 Links

- **GitHub**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
- **Issues**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
- **OpenClaw Docs**: https://docs.openclaw.ai
- **NPM Package**: (coming soon)

---

<div align="center">

**Made with ❤️ for the OpenClaw community**

[⬆ Back to Top](#-agi-farm)

</div>
