# AGI Farm

> One wizard. Full multi-agent AI team. Live in minutes.

**AGI Farm** is an [OpenClaw](https://docs.openclaw.ai) plugin that bootstraps a fully operational multi-agent AI system — agents, workspaces, cron jobs, comms infrastructure, live ops dashboard, and a portable GitHub bundle — all from a single interactive wizard.

---

## What It Does

- **Interactive setup wizard** — answers 6 questions, generates everything
- **Multi-agent team** — 3, 5, or 11 pre-wired specialist agents
- **Live ops dashboard** — React + SSE, ~350ms push latency
- **Auto-dispatcher** — cron-driven task delegation with HITL, rate-limit backoff, dependency checking
- **Portable bundle** — export your team to GitHub with one command
- **Framework support** — autogen, crewai, langgraph out of the box

---

## Architecture

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

### Dashboard Architecture

```
server/dashboard.js           Node.js HTTP server (SSE + static)
  ├── WorkspaceWatcher        chokidar file-watcher, 250ms debounce
  ├── SlowDataCache           background interval — caches openclaw CLI results
  ├── Broadcaster             SSE fan-out to all connected clients
  └── /api/stream             SSE endpoint — pushes full snapshot on file change

dashboard-react/              Vite + React 18 + Recharts frontend
  dist/                       production build (served by dashboard.js)
  src/
    hooks/useDashboard.js     SSE hook — auto-reconnects on disconnect
    components/
      Header.jsx              live badge, stats, clock
      Nav.jsx                 tab switcher
      tabs/
        Overview.jsx          stats, budget bar, SLA alerts, agent grid
        Agents.jsx            full agent cards — model, inbox, quality
        Tasks.jsx             filterable table, expandable rows, deadlines
        Velocity.jsx          7-day charts (Recharts), quality trend
        Budget.jsx            period bars, threshold markers
        OKRs.jsx              objectives + KRs with progress bars
        RD.jsx                experiments, backlog, benchmarks
        Broadcast.jsx         terminal log, color-coded CRITICAL/BLOCKED/HITL
```

---

## Quick Start

```bash
# Install the plugin
openclaw plugins install agi-farm

# Or install from GitHub
openclaw plugins install https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN.git

# Run the setup wizard
/agi-farm setup
```

Answer the questions. Your team will be live in ~2 minutes.

---

## Commands

| Command | What it does |
|---------|-------------|
| `/agi-farm setup` | Full wizard — agents, workspace, crons, bundle, GitHub |
| `/agi-farm status` | Team health: agents, tasks, cron status |
| `/agi-farm rebuild` | Regenerate workspace from existing bundle (preserves edits) |
| `/agi-farm export` | Push bundle to GitHub |
| `/agi-farm dashboard` | Launch live ops room (React + SSE, :8080) |
| `/agi-farm dispatch` | Run auto-dispatcher manually |

---

## Configuration

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
| `dashboardPort` | number | 8080 | Port for the live ops dashboard |
| `dashboardHost` | string | "127.0.0.1" | Bind address for dashboard server |
| `autoStartDashboard` | boolean | true | Auto-start dashboard when plugin loads |
| `workspacePath` | string | ~/.openclaw/workspace | Path to OpenClaw workspace |
| `bundlePath` | string | <workspace>/agi-farm-bundle | Path to AGI Farm bundle |

---

## Team Presets

### 3-agent (Minimal)
```
Orchestrator  -->  Researcher  -->  Builder
```

### 5-agent (Standard)
```
Orchestrator  -->  Researcher  -->  Builder
              -->  QA          -->  Content
```

### 11-agent (Full Stack — Recommended)
```
Cooper (Orchestrator)
├── Sage     Solution Architect
├── Forge    Implementation Engineer
├── Pixel    Debugger
├── Vista    Business Analyst
├── Cipher   Knowledge Curator
├── Vigil    QA Engineer
├── Anchor   Content Specialist
├── Lens     Multimodal Specialist
├── Evolve   Process Improvement Lead
└── Nova     R&D Lead
```

---

## Model Selection Guide

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

## Dashboard Data Sources

All real-time from workspace files:

| Field | Source file | Refresh |
|-------|-------------|---------|
| tasks, task_counts, sla_at_risk | `TASKS.json` | instant |
| agents (inbox, perf, status) | `AGENT_STATUS.json`, `AGENT_PERFORMANCE.json`, `comms/inboxes/` | instant |
| agent model, cron error/busy | `openclaw agents/cron list` | 30s cache |
| budget | `BUDGET.json` | instant |
| velocity | `VELOCITY.json` | instant |
| okrs | `OKRs.json` | instant |
| broadcast | `comms/broadcast.md` | instant |
| experiments / backlog | `EXPERIMENTS.json`, `IMPROVEMENT_BACKLOG.json` | instant |
| knowledge_count | `SHARED_KNOWLEDGE.json` | instant |
| memory_lines | `MEMORY.md` | instant |

**URL**: http://localhost:8080

---

## Auto-Dispatcher

The auto-dispatcher runs via cron and handles:

- **Task delegation** — fires agent sessions for pending tasks
- **HITL notifications** — human-in-the-loop decision requests
- **Rate-limit backoff** — exponential backoff on API limits
- **Dependency checking** — respects task dependencies

```bash
# Dry-run (preview only)
/agi-farm dispatch

# Runs automatically via cron every 1 minute
```

---

## Installation from Source

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

## Development

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Start dashboard server manually
npm run start-dashboard
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Plugin fails to load | Run `npm install` in `extensions/agi-farm/` |
| Dashboard shows stale data | Restart OpenClaw or run `/agi-farm dashboard` |
| Agent stuck >30 min | Check `comms/broadcast.md` for `[BLOCKED]` tags |
| `openclaw` not found in scripts | Ensure OpenClaw CLI is in PATH |
| `gh repo create` fails | Run `gh auth login` first |
| Cron registration shows 0 crons | Run `openclaw cron list` to check for duplicates |
| TASKS.json parse error | Validate JSON: `python3 -m json.tool ~/.openclaw/workspace/TASKS.json` |
| Rate-limit backoff too aggressive | Adjust in dispatch script (default: 10 min) |

---

## Plugin vs Skill

AGI Farm was migrated from a **skill** to a **plugin** because it:

- Runs persistent background services (dashboard server)
- Provides complex interactive wizard (15+ steps)
- Integrates with system services (cron, LaunchAgent)
- Requires configuration management

The embedded `skills/agi-farm/SKILL.md` provides documentation reference for agents.

---

## Security

This plugin:
- Uses OpenClaw CLI commands (inherits OpenClaw's configured credentials)
- Reads/writes local workspace files only
- Runs a local HTTP server (127.0.0.1:8080 by default)
- Does NOT store any API keys or tokens

---

## Repository

- **GitHub**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
- **Issues**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues

---

## License

MIT — built for [OpenClaw](https://docs.openclaw.ai)
