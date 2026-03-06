# MCP Configuration Summary

**Last Updated:** 2026-03-06
**Status:** ✅ All 8 MCP servers operational via mcporter

---

## Overview

**Yes, all MCP servers are managed through mcporter CLI.**

OpenClaw uses **mcporter** as the universal MCP server manager. However, mcporter supports **multiple configuration files** and **two storage locations**:

1. **User-level config:** `~/.mcporter/mcporter.json` (your personal servers)
2. **OpenClaw-level config:** `~/.openclaw/config/mcporter.json` (OpenClaw integration)

Both configuration files are automatically loaded and merged by mcporter.

---

## Current MCP Configuration

### Location 1: OpenClaw Config (`~/.openclaw/config/mcporter.json`)

**File Path:** `/Users/omarabdelmaksoud/.openclaw/config/mcporter.json`

**Servers (3):**
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx -y @modelcontextprotocol/server-memory"
    },
    "sequential-thinking": {
      "command": "npx -y @modelcontextprotocol/server-sequential-thinking"
    },
    "context7": {
      "command": "npx -y @upstash/context7-mcp"
    }
  }
}
```

**Purpose:** ECC-related MCP servers installed during AGI Farm plugin integration

**Installation Method:**
```bash
cd ~/.openclaw/config
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
mcporter config add context7 --command "npx -y @upstash/context7-mcp"
```

### Location 2: User Config (`~/.mcporter/mcporter.json`)

**File Path:** `/Users/omarabdelmaksoud/.mcporter/mcporter.json`

**Servers (5):**
```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "npx -y notebooklm-mcp@latest"
    },
    "stitch": {
      "description": "Google Stitch AI UI design & code generation (official)",
      "baseUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR_GOOGLE_STITCH_API_KEY_HERE"
      }
    },
    "notebooklm2": {
      "command": "npx -y notebooklm-mcp-server"
    },
    "nb2": {
      "command": "npx -y notebooklm-mcp-server@3.0.7 server"
    },
    "nb3": {
      "command": "npx -y @pan-sec/notebooklm-mcp@2026.2.1"
    }
  }
}
```

**Purpose:** User-level MCP servers (NotebookLM variants, Google Stitch)

**Note:** Multiple NotebookLM servers suggest testing different versions/implementations

---

## All Active MCP Servers (8 Total)

When you run `mcporter list`, both config files are merged:

```
mcporter 0.7.3 — Listing 8 server(s)
- stitch          (8 tools)   — Google Stitch AI UI design
- sequential-thinking (1 tool)  — Extended reasoning
- memory          (9 tools)   — Persistent knowledge graph
- context7        (2 tools)   — Live documentation lookup
- notebooklm      (16 tools)  — NotebookLM integration
- nb3             (31 tools)  — NotebookLM alternative
- notebooklm2     (29 tools)  — NotebookLM server variant
- nb2             (29 tools)  — NotebookLM server v3.0.7
✔ Listed 8 servers (8 healthy).
```

### Server Breakdown

| Server | Tools | Source Config | Type |
|--------|-------|---------------|------|
| **memory** | 9 | OpenClaw | stdio |
| **sequential-thinking** | 1 | OpenClaw | stdio |
| **context7** | 2 | OpenClaw | stdio |
| **stitch** | 8 | User | HTTP (baseUrl) |
| **notebooklm** | 16 | User | stdio |
| **notebooklm2** | 29 | User | stdio |
| **nb2** | 29 | User | stdio |
| **nb3** | 31 | User | stdio |

**Total Tools Available:** ~125 tools

---

## Configuration File Priority

mcporter **merges** all configuration files it finds:

1. `~/.openclaw/config/mcporter.json` (OpenClaw-specific)
2. `~/.mcporter/mcporter.json` (user-level)
3. Project-level `mcporter.json` (if exists in current directory)

**Conflict Resolution:** If the same server name appears in multiple configs, the **local** config takes precedence over global.

---

## Managing MCP Servers

### Add Server to OpenClaw Config

```bash
cd ~/.openclaw/config
mcporter config add <server-name> --command "npx -y <package-name>"
```

**Example:**
```bash
cd ~/.openclaw/config
mcporter config add github --command "npx -y @modelcontextprotocol/server-github"
```

### Add Server to User Config (Global)

```bash
# mcporter defaults to ~/.mcporter/mcporter.json when not in a specific directory
mcporter config add <server-name> --command "npx -y <package-name>"
```

**Example:**
```bash
mcporter config add brave-search --command "npx -y @modelcontextprotocol/server-brave-search"
```

### Specify Config File Explicitly

```bash
mcporter config add <server-name> --command "npx -y <package>" --config /path/to/mcporter.json
```

### Remove Server

```bash
# From current directory's config
mcporter config remove <server-name>

# From specific config file
mcporter config remove <server-name> --config ~/.mcporter/mcporter.json
```

### List All Servers

```bash
mcporter list
```

### Get Server Details

```bash
mcporter list <server-name> --schema
```

---

## AGI Farm Plugin Recommendations

### Option 1: Keep Servers in OpenClaw Config (Recommended)

**Why:** Keeps ECC-related servers separate from personal servers

**Location:** `~/.openclaw/config/mcporter.json`

**Benefit:** Easy to identify which servers are part of the AGI Farm integration

**Current Status:** ✅ Already using this approach (memory, sequential-thinking, context7)

### Option 2: Move All Servers to User Config

**Why:** Centralized MCP management

**Location:** `~/.mcporter/mcporter.json`

**Benefit:** All servers in one place, easier to manage globally

**Trade-off:** Harder to distinguish plugin-specific vs. personal servers

---

## Verification Commands

### Check OpenClaw Config

```bash
cat ~/.openclaw/config/mcporter.json
```

### Check User Config

```bash
cat ~/.mcporter/mcporter.json
```

### List All Active Servers

```bash
mcporter list
```

### Test Specific Server

```bash
mcporter list memory --schema
mcporter list context7 --schema
```

### Health Check

```bash
mcporter list  # Shows health status for all servers
```

---

## OpenClaw Integration

**Important:** OpenClaw does **NOT** have an `mcpServers` section in `openclaw.json`.

**Why:** OpenClaw delegates all MCP server management to mcporter. When OpenClaw needs MCP servers, it queries mcporter which automatically merges all config files.

**Verification:**
```bash
# This returns empty (as expected)
grep "mcpServers" ~/.openclaw/openclaw.json
```

**How OpenClaw Uses MCP Servers:**
1. OpenClaw queries mcporter for available servers
2. mcporter merges `~/.openclaw/config/mcporter.json` + `~/.mcporter/mcporter.json`
3. OpenClaw receives combined list of all available MCP tools
4. Tools become available to all agents (main, sage, forge, pixel, etc.)

---

## Summary

✅ **All MCP servers are managed through mcporter**
✅ **Two configuration locations:**
   - OpenClaw config: `~/.openclaw/config/mcporter.json` (3 servers)
   - User config: `~/.mcporter/mcporter.json` (5 servers)
✅ **8 total servers operational** (100% healthy)
✅ **~125 tools available** across all agents
✅ **No manual JSON editing required** — use mcporter CLI

**Best Practice for AGI Farm Plugin:**
- Keep ECC-related servers in OpenClaw config (`~/.openclaw/config/mcporter.json`)
- Use `cd ~/.openclaw/config` before running `mcporter config add`
- This maintains clean separation between plugin and personal MCP servers

---

## Next Steps (Optional)

### Recommended Additional MCP Servers for AGI Farm

Install to OpenClaw config for team-wide availability:

```bash
cd ~/.openclaw/config

# GitHub integration (PR/issue management)
mcporter config add github --command "npx -y @modelcontextprotocol/server-github"

# Filesystem access (for agents to read project files)
mcporter config add filesystem --command "npx -y @modelcontextprotocol/server-filesystem $HOME/projects"

# Brave search (web research)
mcporter config add brave-search --command "npx -y @modelcontextprotocol/server-brave-search"
```

**Note:** Some servers require API keys or configuration. Check server documentation before installation.

---

**Configuration Status:** ✅ Complete
**All Servers Managed By:** mcporter CLI
**Total Healthy Servers:** 8/8 (100%)
