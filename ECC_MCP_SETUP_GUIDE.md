# ECC MCP Server Setup Guide for OpenClaw

**Quick Setup:** Install ECC's recommended MCP servers using `mcporter`

---

## Overview

The ECC (Everything Claude Code) repository includes 15 pre-configured MCP servers. This guide shows you how to install them in OpenClaw using the `mcporter` CLI.

**Current Status:**
- ✅ OpenClaw has `mcporter` installed and working
- ✅ 6 MCP servers already configured (stitch, notebooklm, nb2, nb3)
- 📦 15 additional ECC MCP servers available for installation

---

## Quick Start (Top 5 Most Useful)

```bash
# 1. GitHub (PR operations, issue tracking, repo management)
mcporter config add github \
  --command "npx -y @modelcontextprotocol/server-github" \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_YOUR_TOKEN_HERE

# 2. Memory (persistent memory across sessions)
mcporter config add memory \
  --command "npx -y @modelcontextprotocol/server-memory"

# 3. Exa Web Search (research, requirements analysis)
mcporter config add exa \
  --command "npx -y exa-mcp-server" \
  --env EXA_API_KEY=YOUR_EXA_API_KEY

# 4. Context7 (live documentation lookup)
mcporter config add context7 \
  --command "npx -y @context7/mcp-server"

# 5. Sequential Thinking (chain-of-thought reasoning)
mcporter config add sequential-thinking \
  --command "npx -y @modelcontextprotocol/server-sequential-thinking"

# Verify installation
mcporter list
```

---

## All 15 ECC MCP Servers

### Development Tools

#### 1. GitHub
**Purpose:** PR operations, issue tracking, repository management
**Best for:** All agents (especially Sage, Forge, Vigil)
```bash
mcporter config add github \
  --command "npx -y @modelcontextprotocol/server-github" \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_YOUR_TOKEN

# Get token: https://github.com/settings/tokens
# Scopes: repo, read:org, read:user
```

#### 2. Memory
**Purpose:** Persistent memory across sessions
**Best for:** All agents
```bash
mcporter config add memory \
  --command "npx -y @modelcontextprotocol/server-memory"

# No API key required
```

#### 3. Filesystem
**Purpose:** Filesystem operations (read, write, search)
**Best for:** All agents
```bash
mcporter config add filesystem \
  --command "npx -y @modelcontextprotocol/server-filesystem /Users/omarabdelmaksoud/.openclaw/workspace"

# Note: Specify allowed directory path
```

---

### Research & Documentation

#### 4. Exa Web Search
**Purpose:** Web search, research, and data ingestion
**Best for:** Vista (Analyst), Nova (R&D)
```bash
mcporter config add exa \
  --command "npx -y exa-mcp-server" \
  --env EXA_API_KEY=YOUR_EXA_API_KEY

# Get key: https://exa.ai/api-keys
```

#### 5. Context7
**Purpose:** Live documentation lookup for any library/framework
**Best for:** Forge (Engineer), Nova (R&D)
```bash
mcporter config add context7 \
  --command "npx -y @context7/mcp-server"

# No API key required
```

#### 6. Firecrawl
**Purpose:** Web scraping and crawling
**Best for:** Vista (Analyst), Cipher (Curator)
```bash
mcporter config add firecrawl \
  --command "npx -y firecrawl-mcp" \
  --env FIRECRAWL_API_KEY=YOUR_FIRECRAWL_KEY

# Get key: https://firecrawl.dev
```

---

### Deployment & Infrastructure

#### 7. Vercel
**Purpose:** Vercel deployments and project management
**Best for:** Sage (Architect), Forge (Engineer)
```bash
mcporter config add vercel https://mcp.vercel.com

# HTTP-based MCP (no command needed)
# Auth via OAuth: mcporter auth vercel
```

#### 8. Railway
**Purpose:** Railway deployments
**Best for:** Sage (Architect), Forge (Engineer)
```bash
mcporter config add railway \
  --command "npx -y @railway/mcp-server"

# Auth via Railway token
```

#### 9. Cloudflare Docs
**Purpose:** Cloudflare documentation search
**Best for:** Sage (Architect), Forge (Engineer)
```bash
mcporter config add cloudflare-docs https://docs.mcp.cloudflare.com/mcp

# HTTP-based MCP
```

#### 10. Cloudflare Workers Builds
**Purpose:** Cloudflare Workers builds and deployments
**Best for:** Sage (Architect), Forge (Engineer)
```bash
mcporter config add cloudflare-workers https://builds.mcp.cloudflare.com/mcp

# HTTP-based MCP
```

#### 11. Cloudflare Workers Bindings
**Purpose:** Cloudflare Workers bindings management
**Best for:** Forge (Engineer)
```bash
mcporter config add cloudflare-bindings https://bindings.mcp.cloudflare.com/mcp

# HTTP-based MCP
```

#### 12. Cloudflare Observability
**Purpose:** Cloudflare observability and logs
**Best for:** Pixel (Debugger), Vigil (QA)
```bash
mcporter config add cloudflare-obs https://observability.mcp.cloudflare.com/mcp

# HTTP-based MCP
```

---

### Database & Analytics

#### 13. Supabase
**Purpose:** Supabase database operations, auth, storage
**Best for:** Sage (Architect), Forge (Engineer)
```bash
mcporter config add supabase \
  --command "npx -y @supabase/mcp-server-supabase@latest --project-ref=YOUR_PROJECT_REF"

# Get project ref: https://app.supabase.com/project/_/settings/api
```

#### 14. ClickHouse
**Purpose:** ClickHouse analytics queries
**Best for:** Vista (Analyst), Nova (R&D)
```bash
mcporter config add clickhouse https://mcp.clickhouse.cloud/mcp

# HTTP-based MCP
# Requires ClickHouse Cloud account
```

---

### AI Enhancement

#### 15. Sequential Thinking
**Purpose:** Chain-of-thought reasoning for complex problems
**Best for:** All agents (especially Sage, Nova)
```bash
mcporter config add sequential-thinking \
  --command "npx -y @modelcontextprotocol/server-sequential-thinking"

# No API key required
```

#### 16. Magic UI (Bonus)
**Purpose:** Magic UI components for rapid prototyping
**Best for:** Forge (Engineer), Lens (Multimodal)
```bash
mcporter config add magic \
  --command "npx -y @magicuidesign/mcp@latest"

# No API key required
```

---

## Recommended Configurations by Agent

### Sage (Solution Architect)
**Focus:** Design, planning, infrastructure
```bash
mcporter config add github --command "npx -y @modelcontextprotocol/server-github" --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_TOKEN
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add vercel https://mcp.vercel.com
mcporter config add supabase --command "npx -y @supabase/mcp-server-supabase@latest --project-ref=REF"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
```

### Forge (Implementation Engineer)
**Focus:** Coding, testing, deployment
```bash
mcporter config add github --command "npx -y @modelcontextprotocol/server-github" --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_TOKEN
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add context7 --command "npx -y @context7/mcp-server"
mcporter config add filesystem --command "npx -y @modelcontextprotocol/server-filesystem /path/to/workspace"
mcporter config add vercel https://mcp.vercel.com
```

### Vigil (Quality Assurance)
**Focus:** Code review, testing, security
```bash
mcporter config add github --command "npx -y @modelcontextprotocol/server-github" --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_TOKEN
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
```

### Vista (Business Analyst)
**Focus:** Research, requirements, documentation
```bash
mcporter config add exa --command "npx -y exa-mcp-server" --env EXA_API_KEY=KEY
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add firecrawl --command "npx -y firecrawl-mcp" --env FIRECRAWL_API_KEY=KEY
mcporter config add clickhouse https://mcp.clickhouse.cloud/mcp
```

### Nova (R&D)
**Focus:** Research, prototyping, experimentation
```bash
mcporter config add exa --command "npx -y exa-mcp-server" --env EXA_API_KEY=KEY
mcporter config add context7 --command "npx -y @context7/mcp-server"
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"
mcporter config add sequential-thinking --command "npx -y @modelcontextprotocol/server-sequential-thinking"
mcporter config add github --command "npx -y @modelcontextprotocol/server-github" --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_TOKEN
```

---

## Common mcporter Commands

### View Configuration
```bash
# List all configured servers
mcporter list

# List with tool schemas
mcporter list --schema

# View specific server details
mcporter config get github --json

# View server with available tools
mcporter list github --schema
```

### Add/Remove Servers
```bash
# Add HTTP-based MCP
mcporter config add vercel https://mcp.vercel.com

# Add stdio-based MCP
mcporter config add memory --command "npx -y @modelcontextprotocol/server-memory"

# Add with environment variables
mcporter config add github \
  --command "npx -y @modelcontextprotocol/server-github" \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_TOKEN

# Remove a server
mcporter config remove github
```

### Test Servers
```bash
# Test server connectivity
mcporter list github

# Call a specific tool
mcporter call github.list_repos

# Call with parameters
mcporter call github.create_issue owner=myorg repo=myrepo title="Bug report"
```

### Import from Other Tools
```bash
# Import from Cursor
mcporter config import cursor --copy

# Import from Claude Desktop
mcporter config import claude-desktop --copy

# List available imports
mcporter config import --list
```

### Authentication
```bash
# Run OAuth flow
mcporter auth vercel

# Run OAuth with token reset
mcporter auth vercel --reset

# Logout (clear credentials)
mcporter config logout vercel
```

---

## API Keys Quick Reference

| MCP Server | API Key Location | Required Scopes |
|------------|------------------|-----------------|
| **GitHub** | https://github.com/settings/tokens | repo, read:org, read:user |
| **Exa** | https://exa.ai/api-keys | — |
| **Firecrawl** | https://firecrawl.dev | — |
| **Supabase** | https://app.supabase.com/project/_/settings/api | Project ref + service key |
| **Vercel** | OAuth via `mcporter auth vercel` | — |
| **Railway** | https://railway.app/account/tokens | — |
| **ClickHouse** | https://clickhouse.cloud | — |

---

## Context Window Management

**⚠️ Important:** Each MCP server adds ~5-10K tokens to agent context.

**Recommended Limits:**
- **Sage, Forge, Vigil:** Max 5 MCPs (heavy usage)
- **Vista, Nova:** Max 7 MCPs (research-focused)
- **Pixel, Cipher, Anchor, Lens, Evolve:** Max 3-5 MCPs

**Total Recommendation:** Keep under 10 MCPs enabled globally.

**Check Context Usage:**
```bash
# List servers with tool counts
mcporter list

# High tool count = more context usage
```

**Disable Servers Temporarily:**
```bash
# Remove server (can re-add later)
mcporter config remove server-name
```

---

## Troubleshooting

### "Server offline" or "unable to reach server"
**Problem:** MCP server not responding
**Solutions:**
1. Check internet connection
2. Verify API key is valid
3. Test manually: `npx -y @modelcontextprotocol/server-github`
4. Check server status (for HTTP-based MCPs)
5. Remove and re-add: `mcporter config remove github && mcporter config add github ...`

### "Authentication required"
**Problem:** OAuth or API key missing
**Solutions:**
1. For OAuth: `mcporter auth server-name`
2. For API key: Add `--env KEY=value` when adding server
3. Check API key hasn't expired

### "Tool not found"
**Problem:** Trying to call a tool that doesn't exist
**Solutions:**
1. List available tools: `mcporter list server-name --schema`
2. Check tool name spelling (case-sensitive)
3. Verify server is healthy: `mcporter list server-name`

### "Too many tokens"
**Problem:** Context window exceeded
**Solutions:**
1. Reduce number of enabled MCPs (keep <10)
2. Remove servers with high tool counts
3. Use servers only when needed (remove/re-add as needed)

---

## Best Practices

### 1. Start Small
Begin with 3-5 essential MCPs:
- GitHub (PR operations)
- Memory (session persistence)
- Context7 (live docs)

Add more as needed.

### 2. Agent-Specific Configs
If possible, configure MCPs per-agent instead of globally:
- Sage gets deployment MCPs (Vercel, Railway)
- Vista gets research MCPs (Exa, Firecrawl)
- Forge gets documentation MCPs (Context7)

**Note:** This may require OpenClaw agent-level MCP config support.

### 3. Test Before Relying
Test each MCP before using in production:
```bash
mcporter list server-name --schema  # See available tools
mcporter call server-name.tool      # Test a tool
```

### 4. Monitor Context Usage
Track which MCPs add the most context:
```bash
mcporter list  # Tool count = rough context estimate
```

### 5. Use Import Feature
If you already use Cursor or Claude Desktop:
```bash
mcporter config import cursor --copy
```

---

## Next Steps

### Week 1: Core Setup
1. ✅ Install top 5 MCPs (GitHub, Memory, Exa, Context7, Sequential Thinking)
2. ✅ Test each MCP with `mcporter list --schema`
3. ✅ Configure API keys
4. ✅ Test with real agent workflow

### Week 2: Expansion
1. ⬜ Add deployment MCPs (Vercel, Railway, Cloudflare)
2. ⬜ Add database MCPs (Supabase, ClickHouse)
3. ⬜ Add research MCPs (Firecrawl)
4. ⬜ Optimize MCP selection based on usage

### Month 1: Optimization
1. ⬜ Remove unused MCPs
2. ⬜ Monitor context window impact
3. ⬜ Document agent-MCP best practices
4. ⬜ Share learnings with team

---

## Reference: ECC MCP Config File

**Original location:** `ecc-resources/mcp-configs/mcp-servers.json`

The ECC repository includes a complete MCP server configuration file with all 15 servers pre-configured. While OpenClaw uses `mcporter` instead of direct JSON editing, the file serves as excellent reference documentation.

**Use it to:**
- See all available ECC MCP servers
- Check correct package names and arguments
- Understand environment variable requirements
- Reference descriptions and use cases

---

**Last Updated:** 2026-03-06
**OpenClaw Version:** 2026.3.2
**mcporter Version:** 0.7.3
