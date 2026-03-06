# ECC × OpenClaw Quick Reference Card

**Integration Status:** ✅ **95% Compatible** | **Date:** 2026-03-06

---

## 60-Second Overview

### ✅ What Works Now (164/191 files - 86%)
- **69 Skills** — Production workflows (@tdd-workflow, @api-design, @security-scan)
- **16 Agent Templates** — Specialized methodologies (@architect, @code-reviewer)
- **33 Command Guides** — Workflow documentation
- **@ Shorthand System** — No more full paths needed
- **All 10 Agents Enhanced** — ECC resources in every SOUL.md
- **Cooper Delegation** — Auto-apply ECC based on agent role

### ⚠️ Needs Configuration (15 files)
- **MCP Servers** — GitHub, Memory, Exa, Context7, Supabase, Vercel, etc.
  - **Action:** Add to `openclaw.json` with API keys

### ❌ Incompatible (23 files)
- **Hooks System** — Claude Code-specific automation
  - **Workaround:** Manual quality gate checklists in SOUL.md
  - **Long-term:** Port to OpenClaw native hooks (optional)

---

## Common Usage Patterns

### Pattern 1: Agent Uses Skill Directly
```markdown
# Forge implementing feature
I'll apply @tdd-workflow from ecc-resources/skills/tdd-workflow/skill.md

1. Write failing test (RED)
2. Implement minimal code (GREEN)
3. Refactor
4. Run @verification-loop
```

### Pattern 2: Cooper Delegates with Auto-Apply
```markdown
TO: forge
TASK: Implement user registration API
# ECC auto-applies: @tdd-workflow, @verification-loop, @python-patterns

TO: sage
TASK: Design authentication system
# ECC auto-applies: @architect, @api-design, @postgres-patterns

TO: vigil
TASK: Review authentication code
# ECC auto-applies: @code-review, @security-scan
```

### Pattern 3: Explicit @ Shortcuts
```markdown
TO: forge
TASK: Build payment processing
APPLY: @tdd-workflow, @api-design, @security-scan, @verification-loop
```

### Pattern 4: Quality Gate Checklist
```markdown
# Before marking task complete
✅ Build: PASS (`npm run build`)
✅ Types: PASS (0 errors)
✅ Tests: PASS (15/15, 92% coverage)
✅ Lint: PASS
✅ Security: PASS (no secrets, no console.log)
```

---

## Agent-to-ECC Mappings

| Agent | Role | Auto-Applied Skills | Auto-Applied Agents |
|-------|------|---------------------|---------------------|
| **Sage** | Architect | api-design, postgres-patterns, deployment-patterns, docs-first, feature-flag, checkpoint | architect, planner, database-reviewer |
| **Forge** | Engineer | tdd-workflow, verification-loop, python-patterns, typescript-patterns, golang-patterns, security-review, git-workflow | tdd-guide, build-error-resolver |
| **Vigil** | QA | code-review, security-scan, test-patterns, verification-loop, continuous-learning, feature-flag | code-reviewer, security-reviewer |
| **Pixel** | Debugger | verification-loop, test-patterns, continuous-learning, git-workflow, checkpoint | build-error-resolver |
| **Vista** | Analyst | docs-first, search-first, checkpoint, continuous-learning | planner |
| **Cipher** | Curator | docs-first, search-first, continuous-learning, git-workflow, checkpoint | doc-updater |
| **Anchor** | Content | docs-first, search-first, continuous-learning | doc-updater |
| **Lens** | Multimodal | docs-first, search-first | planner |
| **Evolve** | Process | continuous-learning, checkpoint, docs-first, feature-flag | harness-optimizer, loop-operator |
| **Nova** | R&D | search-first, docs-first, checkpoint, continuous-learning, feature-flag | planner, architect |

---

## Top 20 Most Useful Skills

### Development Workflows
1. **tdd-workflow** — Test-driven development (RED → GREEN → REFACTOR)
2. **verification-loop** — Build/type/test/coverage verification
3. **git-workflow** — Branching, commits, PRs, code review
4. **checkpoint** — Progress checkpointing and session recovery

### Code Quality
5. **code-review** — Code quality review checklist
6. **security-scan** — Vulnerability detection and secret scanning
7. **test-patterns** — Testing best practices (unit, integration, e2e)
8. **continuous-learning** — Extract patterns from sessions

### API & Architecture
9. **api-design** — REST API conventions (resources, status codes, pagination)
10. **postgres-patterns** — Database schema design and optimization
11. **deployment-patterns** — Docker, CI/CD, infrastructure as code
12. **feature-flag** — Feature flag patterns for safe deployments

### Language-Specific
13. **python-patterns** — Python best practices (PEP 8, type hints, async)
14. **typescript-patterns** — TypeScript standards (strict mode, no any)
15. **golang-patterns** — Go idioms (errors, interfaces, concurrency)
16. **django-patterns** — Django conventions (MVT, ORM, middleware)
17. **fastapi-patterns** — FastAPI patterns (Pydantic, async, dependencies)
18. **react-patterns** — React best practices (hooks, composition, performance)

### Process
19. **docs-first** — Documentation-driven development
20. **search-first** — Research before implementation

---

## MCP Server Quick Setup

**OpenClaw uses `mcporter` CLI to manage MCP servers.**

### Step 1: List Current Servers
```bash
mcporter list
```

### Step 2: Add MCP Servers

```bash
# GitHub MCP (requires GitHub PAT)
mcporter config add github \
  --command "npx -y @modelcontextprotocol/server-github" \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_YOUR_TOKEN

# Memory MCP (no API key needed)
mcporter config add memory \
  --command "npx -y @modelcontextprotocol/server-memory"

# Exa Web Search MCP
mcporter config add exa \
  --command "npx -y exa-mcp-server" \
  --env EXA_API_KEY=YOUR_EXA_API_KEY

# Context7 MCP (live documentation)
mcporter config add context7 \
  --command "npx -y @context7/mcp-server"

# Supabase MCP
mcporter config add supabase \
  --command "npx -y @supabase/mcp-server-supabase@latest --project-ref=YOUR_PROJECT_REF"
```

### Step 3: Get API Keys
- **GitHub:** https://github.com/settings/tokens (repo, read:org)
- **Exa:** https://exa.ai/api-keys
- **Supabase:** https://app.supabase.com/project/_/settings/api

### Step 4: Verify Installation
```bash
# List all servers with tool counts
mcporter list

# See available tools for a specific server
mcporter list github --schema

# Test a specific tool
mcporter call github.list_repos
```

### Step 5: Import from Other Tools (Optional)
```bash
# Import from Cursor config
mcporter config import cursor --copy

# Import from Claude Desktop
mcporter config import claude-desktop --copy
```

**⚠️ Context Warning:** Keep under 10 MCPs enabled (each adds ~5-10K tokens)

**No restart required** — mcporter manages configuration automatically

---

## Manual Quality Gate Template

**Add to all agent SOUL.md files:**

```markdown
## Quality Gates (Manual)

Before marking ANY task complete, run verification and include checklist:

### Build Verification
```bash
npm run build 2>&1 | tail -20
# OR: pnpm build 2>&1 | tail -20
# OR: go build ./... 2>&1 | tail -20
```
Exit code: 0 (success)

### Type Check
```bash
# TypeScript
npx tsc --noEmit 2>&1 | head -30

# Python
pyright . 2>&1 | head -30

# Go
go build ./... 2>&1 | head -30
```
Zero type errors

### Test Suite
```bash
# JavaScript/TypeScript
npm test -- --coverage 2>&1 | tail -50

# Python
pytest --cov=. --cov-report=term-missing 2>&1 | tail -50

# Go
go test ./... -cover 2>&1 | tail -50
```
All tests pass, coverage >80%

### Lint Check
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30

# Go
golangci-lint run 2>&1 | head -30
```
Zero errors (warnings acceptable)

### Security Scan
```bash
# Check for secrets
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -5
grep -rn "api_key" --include="*.py" . 2>/dev/null | head -5

# Check for console.log (JavaScript/TypeScript)
grep -rn "console.log" src/ 2>/dev/null | head -5

# Check for print statements (Python)
grep -rn "print(" --include="*.py" src/ 2>/dev/null | head -5
```
No secrets, no debug statements

### Completion Checklist Format
At task completion, ALWAYS include:

```
✅ Build: PASS
✅ Types: PASS (0 errors)
✅ Tests: PASS (15/15, 92% coverage)
✅ Lint: PASS (0 errors, 2 warnings)
✅ Security: PASS (no secrets, no console.log)
```

If ANY gate fails, task is NOT complete. Fix and re-verify.
```

---

## Troubleshooting

### "Skill not found"
**Problem:** Agent references @skill-name but can't find it
**Solution:** Check `config/ecc-mappings.json` — skill must be in agent's mapping

### "ECC section missing from SOUL.md"
**Problem:** Agent SOUL.md doesn't have ECC Resources section
**Solution:** Run rebuild: `cd /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN && node scripts/rebuild.js --force`

### "MCP server not responding"
**Problem:** MCP server configured but agent can't use it
**Solution:**
1. Check `openclaw.json` has correct configuration
2. Verify API keys are valid
3. Test manually: `npx -y @modelcontextprotocol/server-github`
4. Restart OpenClaw

### "Too many resources in context"
**Problem:** Agent exceeds context window
**Solution:**
1. Reduce number of enabled MCP servers (keep <10)
2. Use specific @ shortcuts instead of "all ECC resources"
3. Remove unused skills from agent's ecc-mappings.json entry

---

## File Locations

### ECC Resources
```
/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/
├── agents/           (16 agent methodologies)
├── commands/         (33 workflow guides)
├── contexts/         (3 workflow contexts)
├── docs/             (12 documentation files)
├── examples/         (14 reference examples)
├── guides/           (15 usage guides)
├── hooks/            (23 hooks — reference only)
├── mcp-configs/      (15 MCP server configs)
├── rules/            (5 language rule sets)
├── schemas/          (6 JSON schemas — reference only)
└── skills/           (69 production skills)
```

### Configuration
```
/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/config/
└── ecc-mappings.json (agent-to-resource mappings)
```

### Agent SOUL.md Files
```
/Users/omarabdelmaksoud/.openclaw/workspace/agents-workspaces/
├── solution-architect/SOUL.md    (Sage)
├── implementation-engineer/SOUL.md (Forge)
├── quality-assurance/SOUL.md     (Vigil)
├── debugger/SOUL.md              (Pixel)
├── business-analyst/SOUL.md      (Vista)
├── knowledge-curator/SOUL.md     (Cipher)
├── content-specialist/SOUL.md    (Anchor)
├── multimodal-specialist/SOUL.md (Lens)
├── process-improvement/SOUL.md   (Evolve)
└── r-and-d/SOUL.md               (Nova)
```

### Documentation
```
/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/
├── OPENCLAW_COMPLIANCE_REPORT.md   (29 KB — full analysis)
├── OPENCLAW_COMPLIANCE_SUMMARY.md  (10 KB — executive summary)
├── ECC_OPENCLAW_QUICKREF.md        (this file)
├── ECC_INTEGRATION_GUIDE.md        (complete usage guide)
├── ECC_QUICK_START.md              (5-minute quick start)
└── CHANGELOG_ECC.md                (integration changelog)
```

---

## Commands

### Rebuild All SOUL.md Files (with ECC)
```bash
cd /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN
node scripts/rebuild.js --force
```

### View Agent ECC Mapping
```bash
cat /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/config/ecc-mappings.json | jq '.forge'
```

### Search Skills by Topic
```bash
cd /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/skills
grep -l "test" */skill.md
grep -l "security" */skill.md
grep -l "API" */skill.md
```

### List All Available Skills
```bash
ls /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/skills/
```

### View Skill Content
```bash
cat /Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/skills/tdd-workflow/skill.md
```

---

## Resources

### Full Documentation
- **OPENCLAW_COMPLIANCE_REPORT.md** — 29 KB detailed analysis
- **OPENCLAW_COMPLIANCE_SUMMARY.md** — 10 KB executive summary
- **ECC_INTEGRATION_GUIDE.md** — 10,000+ word complete guide

### ECC Upstream
- **GitHub:** https://github.com/affaan-m/everything-claude-code
- **Hackathon Winner:** Anthropic hackathon 2024

### OpenClaw
- **Config:** `/Users/omarabdelmaksoud/.openclaw/openclaw.json`
- **Workspace:** `/Users/omarabdelmaksoud/.openclaw/workspace`
- **Agents:** All 10 registered in openclaw.json

---

## Quick Wins (Start Here)

### 1. Test Forge with @tdd-workflow (15 min)
```markdown
# As Cooper
TO: forge
TASK: Implement a simple calculator function (add, subtract) with tests
APPLY: @tdd-workflow

# Observe Forge:
1. Read ecc-resources/skills/tdd-workflow/skill.md
2. Write failing test first
3. Implement minimal code
4. Run verification loop
```

### 2. Test Sage with @api-design (15 min)
```markdown
# As Cooper
TO: sage
TASK: Design a RESTful API for a todo list app
APPLY: @architect, @api-design

# Observe Sage:
1. Read architect methodology
2. Apply REST API conventions
3. Deliver implementation-ready spec
```

### 3. Test Vigil with @code-review (15 min)
```markdown
# As Cooper
TO: vigil
TASK: Review the calculator code Forge just wrote
APPLY: @code-review, @security-scan

# Observe Vigil:
1. Read code review checklist
2. Check test coverage
3. Run security scan
4. Deliver review report
```

### 4. Enable GitHub MCP (15 min)
```bash
# 1. Get GitHub PAT: https://github.com/settings/tokens
# 2. Add to openclaw.json (see MCP Quick Setup above)
# 3. Restart OpenClaw
# 4. Test: Ask any agent to "list my GitHub repos"
```

---

## Success Metrics

### Week 1
- ✅ All 10 agents reference ECC skills in at least 1 task
- ✅ Quality gate checklists added to all agent SOUL.md files
- ✅ At least 3 MCP servers enabled (GitHub, Memory, Exa)
- ✅ 0 "skill not found" errors

### Month 1
- ✅ 50+ tasks completed using ECC workflows
- ✅ TDD workflow adopted (80%+ test coverage on new code)
- ✅ Verification loop runs before every task completion
- ✅ Security scans catch 0 secrets in code
- ✅ API designs follow REST conventions

### Quarter 1 (Optional)
- ⬜ Port top 5 hooks to OpenClaw native hooks
- ⬜ Build ECC usage dashboard
- ⬜ Contribute OpenClaw compatibility back to ECC repo
- ⬜ 100% of new code follows ECC patterns

---

**Last Updated:** 2026-03-06
**Integration Status:** ✅ 95% Compatible
**Next Review:** After 1 week of real agent usage
