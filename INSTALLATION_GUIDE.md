# AGI Farm Plugin — Installation Guide

**Version:** 1.4.0
**Date:** 2026-03-06
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Install](#quick-install)
3. [Detailed Installation](#detailed-installation)
4. [Post-Installation Setup](#post-installation-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Uninstallation](#uninstallation)

---

## Prerequisites

### Required

| Requirement | Version | Check Command | Install Link |
|-------------|---------|---------------|--------------|
| **OpenClaw** | Latest | `openclaw --version` | [openclaw.com](https://openclaw.com) |
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 8+ | `npm --version` | (included with Node.js) |

### Optional (Recommended)

| Tool | Purpose | Check Command | Install Link |
|------|---------|---------------|--------------|
| **mcporter** | MCP server management | `mcporter --version` | `npm install -g mcporter` |
| **git** | Export functionality | `git --version` | [git-scm.com](https://git-scm.com) |
| **gh CLI** | PR automation | `gh --version` | [cli.github.com](https://cli.github.com) |

---

## Quick Install

### From GitHub (Recommended)

```bash
# 1. Install the plugin
openclaw plugin install https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN

# 2. Verify installation
npm run validate

# 3. Setup your team
openclaw run agi-farm setup
```

### From Local Directory

```bash
# 1. Clone the repository
git clone https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN.git
cd AGI-FARM-PLUGIN

# 2. Install dependencies
npm install

# 3. Install plugin to OpenClaw
openclaw plugin install .

# 4. Verify installation
npm run validate
```

---

## Detailed Installation

### Step 1: Verify Prerequisites

Run the prerequisite checks:

```bash
# Check Node.js version (must be 18+)
node --version
# Expected: v18.0.0 or higher

# Check OpenClaw installation
openclaw --version
# Expected: OpenClaw version info

# Check mcporter (optional but recommended)
mcporter --version
# Expected: mcporter version info
```

**If any prerequisite is missing:**

```bash
# Install Node.js
# Visit: https://nodejs.org/

# Install OpenClaw
# Visit: https://openclaw.com

# Install mcporter
npm install -g mcporter
```

---

### Step 2: Install Plugin

#### Option A: Install from GitHub (Easiest)

```bash
openclaw plugin install https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
```

This will:
- Download the plugin
- Install to `~/.openclaw/extensions/agi-farm`
- Run `npm install` automatically
- Run validation checks

#### Option B: Install from Local Directory

```bash
# Clone repository
git clone https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN.git
cd AGI-FARM-PLUGIN

# Install dependencies
npm install

# Link to OpenClaw
openclaw plugin install .
```

#### Option C: Install from npm (Coming Soon)

```bash
openclaw plugin install agi-farm
```

---

### Step 3: Run Validation

The plugin automatically validates your configuration during installation. To manually run validation:

```bash
cd ~/.openclaw/extensions/agi-farm
npm run validate
```

**Expected Output:**

```
🔍 AGI Farm — Validating Configuration

✓ OpenClaw directory found
✓ Node.js v20.10.0 (>= 18)
✓ mcporter installed (0.7.3)
✓ mcporter config found (3 servers configured)
✓ AGI Farm plugin directory found
✓ ECC resources found (13 directories)
✓ Hooks directory found (7 hooks)
✓ Templates directory found (10 agent templates)
✓ Workspace directory exists
✓ Required npm dependencies found
✓ git installed (export feature available)
✓ gh CLI installed (PR automation available)

✅ Configuration Valid

AGI Farm plugin is ready to use!
Run: openclaw run agi-farm setup
```

---

## Post-Installation Setup

### Step 4: Configure MCP Servers

The plugin works with 8 MCP servers. Three are essential for ECC integration:

```bash
# Navigate to OpenClaw config directory
cd ~/.openclaw/config

# Install essential MCP servers
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
mcporter config add context7 --command "npx -y @upstash/context7-mcp"

# Verify servers are running
mcporter list
```

**Expected Output:**

```
mcporter 0.7.3 — Listing 3 server(s)
- memory              (9 tools, 3.0s)
- sequential-thinking (1 tool, 3.0s)
- context7            (2 tools, 3.3s)
✔ Listed 3 servers (3 healthy).
```

**For complete MCP setup**, see [ECC_MCP_SETUP_GUIDE.md](./ECC_MCP_SETUP_GUIDE.md)

---

### Step 5: Create Your First Team

Run the interactive setup wizard:

```bash
openclaw run agi-farm setup
```

**The wizard will guide you through:**

1. **Team Name** — Choose a name for your team (e.g., "ProductionTeam")
2. **Domain** — Select your project domain (fullstack, mobile, ML/AI, etc.)
3. **Agent Selection** — Choose which agents to include (default: all 10)
4. **ECC Integration** — Automatically applies ECC resources
5. **Workspace Creation** — Generates agent workspaces
6. **Hook Registration** — Activates quality gates

**Example Session:**

```
🎯 AGI Farm — Team Setup Wizard

? Team name: MyDevTeam
? Domain: fullstack
? Include all 10 agents? Yes
? Enable auto-dispatcher? Yes
? Enable dashboard? Yes

✓ Created team configuration
✓ Generated 10 agent workspaces
✓ Applied ECC resources (194 files)
✓ Registered 7 hooks
✓ Created team bundle

✅ Team "MyDevTeam" is ready!

Next steps:
• View team status: openclaw run agi-farm status
• Launch dashboard: openclaw run agi-farm dashboard
• Enable auto-dispatch: openclaw run agi-farm dispatch
```

---

## Verification

### Verify Installation

Run these commands to confirm everything is working:

```bash
# 1. Check plugin is registered
openclaw plugin list | grep agi-farm
# Expected: agi-farm@1.4.0

# 2. Check available commands
openclaw run agi-farm --help
# Expected: List of 7 commands

# 3. Check team status
openclaw run agi-farm status
# Expected: Team health dashboard

# 4. Check hooks are registered
cat ~/.openclaw/extensions/agi-farm/openclaw.plugin.json | grep -A 10 hooks
# Expected: List of 7 hooks

# 5. Check ECC resources
ls -1 ~/.openclaw/extensions/agi-farm/ecc-resources/
# Expected: 13 directories
```

### Verify MCP Servers

```bash
# List all MCP servers
mcporter list

# Test a specific server
mcporter list memory --schema

# Check OpenClaw can access servers
openclaw mcp list
```

### Verify Hooks

```bash
# Hooks are automatically active when files are edited
# Test by editing a TypeScript file (typecheck hook will run)

# View hook configuration
cat ~/.openclaw/extensions/agi-farm/openclaw.plugin.json
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "OpenClaw not installed"

**Error:**
```
❌ OpenClaw not installed. Install from: https://github.com/openclaw/openclaw
```

**Fix:**
```bash
# Install OpenClaw
# Visit: https://openclaw.com
```

---

#### Issue 2: "Node.js version too old"

**Error:**
```
❌ Node.js v16.0.0 is too old. Requires Node.js 18+.
```

**Fix:**
```bash
# Install Node.js 18+ from https://nodejs.org/

# Or use nvm (recommended)
nvm install 20
nvm use 20
```

---

#### Issue 3: "mcporter config not found"

**Warning:**
```
⚠  mcporter config not found at ~/.openclaw/config/mcporter.json
```

**Fix:**
```bash
# Create config directory
mkdir -p ~/.openclaw/config

# Add MCP servers
cd ~/.openclaw/config
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
mcporter config add context7 --command "npx -y @upstash/context7-mcp"
```

---

#### Issue 4: "Dashboard port 8080 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Fix:**
```bash
# Use a different port
openclaw run agi-farm dashboard --port 8081

# Or set environment variable
export AGI_FARM_DASHBOARD_PORT=8081
openclaw run agi-farm dashboard
```

---

#### Issue 5: "Permission denied" on hooks

**Error:**
```
Error: EACCES: permission denied, open '/Users/you/.openclaw/extensions/agi-farm/hooks/quality-gate/handler.js'
```

**Fix:**
```bash
# Fix permissions
cd ~/.openclaw/extensions/agi-farm
chmod -R 755 hooks/
```

---

#### Issue 6: "ECC resources missing"

**Error:**
```
❌ ECC resources directory missing. Plugin installation may be incomplete.
```

**Fix:**
```bash
# Reinstall the plugin
openclaw plugin uninstall agi-farm
openclaw plugin install https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
```

---

### Getting Help

**If you encounter issues not listed here:**

1. **Check validation output:**
   ```bash
   cd ~/.openclaw/extensions/agi-farm
   npm run validate
   ```

2. **Check logs:**
   ```bash
   # OpenClaw logs
   tail -f ~/.openclaw/logs/*.log

   # Dashboard logs
   # (printed to console when dashboard runs)
   ```

3. **Report issues:**
   - GitHub: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
   - Include validation output
   - Include relevant error messages

---

## Uninstallation

### Full Uninstall

```bash
# 1. Teardown active teams
openclaw run agi-farm teardown

# 2. Uninstall plugin
openclaw plugin uninstall agi-farm

# 3. (Optional) Remove workspace data
rm -rf ~/.openclaw/workspace/agi-farm-bundle

# 4. (Optional) Remove MCP servers
mcporter config remove memory
mcporter config remove sequential-thinking
mcporter config remove context7
```

### Clean Uninstall (Remove All Data)

```bash
# WARNING: This removes ALL AGI Farm data including:
# - Team configurations
# - Agent workspaces
# - Task history
# - Logs

openclaw run agi-farm teardown --force
openclaw plugin uninstall agi-farm
rm -rf ~/.openclaw/workspace/agi-farm-bundle
rm -rf ~/.openclaw/workspace/agents-workspaces
rm -rf ~/.openclaw/extensions/agi-farm
```

---

## Next Steps

After installation, see:

- **[AGI_FARM_COMPLETE_INVENTORY.md](./AGI_FARM_COMPLETE_INVENTORY.md)** — What's included
- **[README.md](./README.md)** — Usage guide
- **[ECC_MCP_SETUP_GUIDE.md](./ECC_MCP_SETUP_GUIDE.md)** — MCP server setup
- **[SCALABILITY_ANALYSIS.md](./SCALABILITY_ANALYSIS.md)** — Multi-user deployment

---

## Platform-Specific Notes

### macOS

```bash
# All commands work as documented
# LaunchAgent support available for auto-dispatch
openclaw run agi-farm launchagent install
```

### Linux

```bash
# All commands work as documented
# systemd support for auto-dispatch (coming soon)
```

### Windows

```bash
# Use Git Bash or WSL for best compatibility
# Native Windows support planned

# With WSL:
wsl
cd ~/.openclaw/extensions/agi-farm
npm install
```

---

**Installation Complete!** 🎉

Run `openclaw run agi-farm setup` to create your first team.
