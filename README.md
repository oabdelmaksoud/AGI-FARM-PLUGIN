# 🦅 AGI Farm

> One wizard. Full multi-agent AI team. Live in minutes.

**AGI Farm** is an [OpenClaw](https://docs.openclaw.ai) plugin that bootstraps a fully operational multi-agent AI system — agents, workspaces, cron jobs, comms infrastructure, live ops dashboard, and a portable GitHub bundle — all from a single interactive wizard.

---

## ✨ What It Does

- 🧙 **Interactive setup wizard** — answers 6 questions, generates everything
- 🤖 **Multi-agent team** — 3, 5, or 11 pre-wired specialist agents
- 📡 **Live ops dashboard** — React + SSE, ~350ms push latency
- 🔄 **Auto-dispatcher** — cron-driven task delegation with HITL, rate-limit backoff, dependency checking
- 📦 **Portable bundle** — export your team to GitHub with one command
- 🧩 **Framework support** — autogen, crewai, langgraph out of the box

---

## 🗺️ Architecture

### Plugin Structure

```
.openclaw/extensions/agi-farm/
├── package.json              # Plugin manifest
├── openclaw.plugin.json     # Config schema, commands, embedded skills
├── src/
│   └── index.ts             # Main plugin entry (TypeScript)
├── server/
│   └── dashboard.js         # SSE server (Node.js)
├── scripts/
│   ├── setup.js             # /agi-farm setup wizard
│   ├── status.js            # /agi-farm status
│   ├── rebuild.js           # /agi-farm rebuild
│   ├── export.js            # /agi-farm export
│   ├── dashboard.js         # /agi-farm dashboard
│   └── dispatch.js          # /agi-farm dispatch
├── templates/               # Agent/workspace templates
├── dashboard-react/         # Vite + React 18 frontend
└── skills/
    └── agi-farm/
        └── SKILL.md         # Embedded skill for documentation
```

---

## 🚀 Quick Start



```bash
# Install the plugin
openclaw plugins install agi-farm

# Run the setup wizard
/agi-farm setup
```

Answer the questions. Your team will be live in ~2 minutes.

---

## 📦 Commands

| Command | What it does |
|---------|-------------|
| `/agi-farm setup` | Full wizard — agents, workspace, crons, bundle, GitHub |
| `/agi-farm status` | Team health: agents, tasks, cron status |
| `/agi-farm rebuild` | Regenerate workspace from existing bundle (preserves edits) |
| `/agi-farm export` | Push bundle to GitHub |
| `/agi-farm dashboard` | Launch live ops room (React + SSE, :8080) |
| `/agi-farm dispatch` | Run auto-dispatcher manually |

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
          "autoStartDashboard": true
        }
      }
    }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dashboardPort` | number | 8080 | Port for the live ops dashboard |
| `dashboardHost` | string | "127.0.0.1" | Bind address for dashboard server |
| `autoStartDashboard` | boolean | true | Auto-start dashboard when plugin loads |
| `workspacePath` | string | ~/.openclaw/workspace | Path to OpenClaw workspace |
| `bundlePath` | string | <workspace>/agi-farm-bundle | Path to AGI Farm bundle |

---

## 🤖 Team Presets

### 3-agent (Minimal)
```
🦅 Orchestrator  ──►  🔮 Researcher  ──►  ⚒️ Builder
```

### 5-agent (Standard)
```
🦅 Orchestrator  ──►  🔮 Researcher  ──►  ⚒️ Builder
                 ──►  🛡️ QA          ──►  ⚓ Content
```

### 11-agent (Full Stack — Recommended)
```
🦅 Cooper (Orchestrator)
├── 🔮 Sage     Solution Architect
├── ⚒️ Forge    Implementation Engineer
├── 🐛 Pixel    Debugger
├── 🔭 Vista    Business Analyst
├── 🔊 Cipher   Knowledge Curator
├── 🛡️ Vigil    QA Engineer
├── ⚓ Anchor   Content Specialist
├── 📡 Lens     Multimodal Specialist
├── 🔄 Evolve   Process Improvement Lead
└── 🧪 Nova     R&D Lead
```

---

## 🧠 Model Selection Guide

| Role | Recommended tier | Why |
|------|-----------------|-----|
| Orchestrator | High (`sonnet`, `opus`) | Delegation judgment, broad reasoning |
| Architect / Researcher | High | Deep analysis, design decisions |
| Implementation Engineer | Mid (`glm-5`, `sonnet`) | Fast code gen, cost-efficiency |
| Debugger | High (`opus`) | Root-cause analysis |
| Business Analyst / Knowledge | Mid-high (`gemini-2.0-pro-exp`) | Long-context research |
| QA Engineer | Fast (`glm-4.7-flash`) | High-volume pattern checks |
| Content / Multimodal | Multimodal (`gemini-2.0-pro-exp`) | Vision + rich generation |
| R&D / Process Improvement | High | Creative + structured experiments |

---

## 🛟 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Plugin fails to load | Run `npm install` in `extensions/agi-farm/` |
| Dashboard shows stale data | Restart OpenClaw or run `/agi-farm dashboard` |
| Agent stuck >30 min | Check `comms/broadcast.md` for `[BLOCKED]` tags |
| `openclaw` not found in scripts | Ensure OpenClaw CLI is in PATH |
| `gh repo create` fails | Run `gh auth login` first |

---

## 📁 Plugin vs Skill

AGI Farm was migrated from a **skill** to a **plugin** because it:

- Runs persistent background services (dashboard server)
- Provides complex interactive wizard (15+ steps)
- Integrates with system services (cron, LaunchAgent)
- Requires configuration management

The embedded `skills/agi-farm/SKILL.md` provides documentation reference for agents.

---

## 📄 License

MIT — built for [OpenClaw](https://docs.openclaw.ai)
