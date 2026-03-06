# ECC Integration Guide for AGI Farm Plugin

## Overview

The AGI Farm plugin now integrates **Everything Claude Code (ECC)** — a production-ready AI coding framework from an Anthropic hackathon winner. This integration provides:

- **69 specialized skills** covering frameworks, patterns, and best practices
- **16 specialized agent templates** for domain-specific tasks
- **33 slash commands** for common workflows
- **Automatic resource application** based on agent roles
- **Zero manual configuration** required

## What's New

### Before ECC Integration
Agents had minimal SOUL.md files with basic persona and communication protocols.

### After ECC Integration
Every agent now has access to:
- Role-specific skills automatically applied
- ECC agent templates for specialized delegation
- Slash commands for common workflows
- Production-ready patterns from battle-tested projects
- Core principles (TDD, Security-First, Immutability, etc.)

## ECC Resources by Agent

### Cooper (Orchestrator)
**Role:** Team coordination and delegation

**Auto-applied Resources:**
- `@agentic-engineering` — Meta-agent patterns
- `@autonomous-loops` — Self-improving systems
- `@enterprise-agent-ops` — Agent operations

**Delegation Examples:**
```markdown
TO: sage
TASK: Design authentication system
→ ECC auto-applies: @architect, @api-design, @postgres-patterns

TO: forge
TASK: Implement login endpoint
→ ECC auto-applies: @tdd-workflow, @verification-loop, @python-patterns

TO: vigil
TASK: Review implementation
→ ECC auto-applies: @code-review, @security-scan, @verification-loop
```

---

### Sage (Solution Architect)
**Role:** System design and architecture

**Auto-applied Resources:**
- `@architect` — System design patterns
- `@planner` — Implementation planning
- `@api-design` — REST API conventions
- `@postgres-patterns` — Database schema design
- `@deployment-patterns` — Infrastructure as code
- `@backend-patterns` — Backend architecture
- `@database-migrations` — Schema evolution
- `@docker-patterns` — Containerization
- `@enterprise-agent-ops` — Production operations

**Workflow:**
1. Receive requirements from Vista or Cooper
2. Apply @api-design for API contracts
3. Use @postgres-patterns for data models
4. Apply @deployment-patterns for infrastructure
5. Document with /checkpoint
6. Create ADR in DECISIONS.md
7. Run pre-mortem analysis
8. Deliver spec to Forge

---

### Forge (Implementation Engineer)
**Role:** Code implementation

**Auto-applied Resources:**
- `@tdd-workflow` — Test-driven development
- `@verification-loop` — Comprehensive quality checks
- `@python-patterns` — Python best practices
- `@python-testing` — Python test patterns
- `@frontend-patterns` — Frontend architecture
- `@backend-patterns` — Backend patterns
- `@coding-standards` — Code style guidelines
- `@continuous-learning` — Knowledge improvement

**Commands:**
- `/build-fix` — Fix build/type errors
- `/code-review` — Quality check
- `/go-test` — Run Go tests

**Workflow (TDD):**
1. Read spec from Sage
2. Apply @tdd-workflow
3. Write failing tests (RED)
4. Implement minimal code (GREEN)
5. Run @verification-loop
6. If build fails, use /build-fix
7. Send to Vigil for review

---

### Vigil (Quality Assurance)
**Role:** Quality gate and security

**Auto-applied Resources:**
- `@code-review` — Code quality checklist
- `@security-scan` — Vulnerability detection
- `@security-review` — Security best practices
- `@verification-loop` — Full quality gate
- `@e2e-testing` — End-to-end tests
- `@tdd-workflow` — Test verification

**Commands:**
- `/code-review` — Run quality review
- `/security-scan` — Security audit
- `/e2e` — Run E2E tests

**Quality Gate:**
1. Receive code from Forge
2. Apply @code-review checklist
3. Run @security-scan for vulnerabilities
4. Apply @verification-loop (build, types, tests, coverage)
5. Check 80%+ test coverage
6. Flag CRITICAL/HIGH as blockers
7. BLOCK if critical issues, else APPROVE

---

### Pixel (Debugger)
**Role:** Bug investigation and fixing

**Auto-applied Resources:**
- `@verification-loop` — Diagnostic workflow
- `@continuous-learning` — Pattern recognition
- `@search-first` — Root cause analysis
- `@tdd-workflow` — Regression test creation
- `@python-testing` — Python debugging
- `@e2e-testing` — Integration debugging

**Commands:**
- `/build-fix` — Fix build errors
- `/go-build` — Fix Go build issues

**Workflow:**
1. Reproduce bug with minimal test case
2. Apply @search-first for root cause
3. Trace execution flow
4. Fix implementation
5. Add regression test
6. Run @verification-loop
7. Document failure mode

---

### Vista (Business Analyst)
**Role:** Requirements and analysis

**Auto-applied Resources:**
- `@market-research` — Competitive analysis
- `@investor-materials` — Business documents
- `@strategic-compact` — Strategy docs
- `@article-writing` — Content creation
- `@content-engine` — Content workflows
- `@project-guidelines-example` — Requirements templates

**Commands:**
- `/checkpoint` — Save decisions
- `/evolve` — Process improvement

---

### Cipher (Knowledge Curator)
**Role:** Knowledge management

**Auto-applied Resources:**
- `@continuous-learning` — Learning loops
- `@continuous-learning-v2` — Advanced learning
- `@skill-stocktake` — Knowledge inventory
- `@search-first` — Information retrieval
- `@article-writing` — Documentation
- `@content-engine` — Content workflows

**Commands:**
- `/learn` — Continuous learning
- `/learn-eval` — Evaluate learning
- `/instinct-export` — Export knowledge
- `/instinct-import` — Import knowledge
- `/instinct-status` — Check status

---

### Anchor (Content Specialist)
**Role:** Content creation

**Auto-applied Resources:**
- `@article-writing` — Writing patterns
- `@content-engine` — Content workflows
- `@frontend-slides` — Presentation creation
- `@investor-outreach` — Investor materials
- `@strategic-compact` — Strategic docs
- `@visa-doc-translate` — Document translation

**Commands:**
- `/checkpoint` — Save content decisions

---

### Lens (Multimodal Specialist)
**Role:** UI/UX and visual content

**Auto-applied Resources:**
- `@frontend-patterns` — Frontend architecture
- `@swiftui-patterns` — SwiftUI best practices
- `@liquid-glass-design` — Design system
- `@e2e-testing` — UI testing
- `@nutrient-document-processing` — Document handling
- `@foundation-models-on-device` — On-device ML

**Commands:**
- `/e2e` — Run E2E tests

---

### Evolve (Process Improvement)
**Role:** Meta-process optimization

**Auto-applied Resources:**
- `@continuous-learning` — Learning systems
- `@continuous-learning-v2` — Advanced learning
- `@enterprise-agent-ops` — Agent operations
- `@autonomous-loops` — Self-improving loops
- `@continuous-agent-loop` — Agent orchestration
- `@agentic-engineering` — Meta-patterns
- `@agent-harness-construction` — Infrastructure

**Commands:**
- `/evolve` — Process improvement
- `/harness-audit` — Audit infrastructure
- `/loop-start` — Start autonomous loop
- `/loop-status` — Check loop status

---

### Nova (R&D)
**Role:** Research and experimentation

**Auto-applied Resources:**
- `@ai-first-engineering` — LLM-native architecture
- `@foundation-models-on-device` — Edge AI
- `@cost-aware-llm-pipeline` — Cost optimization
- `@iterative-retrieval` — RAG patterns
- `@eval-harness` — Model evaluation
- `@autonomous-loops` — Experimental loops
- `@agentic-engineering` — Advanced patterns
- `@regex-vs-llm-structured-text` — Parsing strategies

**Commands:**
- `/eval` — Evaluate experiments
- `/model-route` — Model routing
- `/multi-backend` — Multi-backend support

---

## How ECC Integration Works

### 1. Configuration Files

**`config/ecc-mappings.json`**
Maps each agent to relevant ECC resources:
```json
{
  "forge": {
    "role": "Implementation Engineer",
    "agents": ["tdd-guide", "build-error-resolver"],
    "skills": ["tdd-workflow", "verification-loop", "python-patterns"],
    "commands": ["build-fix", "code-review"],
    "principles": ["Tests first — TDD for non-trivial code"]
  }
}
```

### 2. Template Enhancement

All SOUL.md templates now include ECC section with:
- Specialized agents for delegation
- Skills library with @ shortcuts
- Quick commands
- Core principles
- Usage examples

### 3. Rebuild Script

**`scripts/rebuild.js`** now:
1. Loads ECC mappings from config
2. Loads agent-specific templates
3. Injects ECC resources as template variables
4. Renders complete SOUL.md with all resources

### 4. Resource Structure

```
AGI-FARM-PLUGIN/
├── ecc-resources/
│   ├── skills/           (69 skills)
│   ├── agents/           (16 agent templates)
│   ├── commands/         (33 commands)
│   └── AGENTS.md         (Reference documentation)
├── config/
│   └── ecc-mappings.json (Agent-to-resource mappings)
└── templates/
    ├── SOUL.md.forge     (Enhanced with ECC)
    ├── SOUL.md.sage      (Enhanced with ECC)
    ├── SOUL.md.vigil     (Enhanced with ECC)
    └── ... (all 12 templates)
```

---

## Usage Examples

### Example 1: Cooper Delegates Feature Development

**User Request:** "Build user authentication with OAuth"

**Cooper's Process:**
```markdown
1. Decompose:
   - Architecture design (Sage)
   - Implementation (Forge)
   - Quality review (Vigil)

2. Delegate to Sage:
TO: sage
TASK: Design OAuth authentication system

ECC auto-applies:
- @architect (system design patterns)
- @api-design (REST conventions)
- @postgres-patterns (user schema)
- @deployment-patterns (OAuth infrastructure)

Sage delivers:
- Architecture diagram
- API contracts (POST /auth/login, POST /auth/callback)
- User/Session data models
- ADR documenting OAuth vs JWT decision
- Pre-mortem: rate limiting, token expiry, refresh logic

3. Delegate to Forge:
TO: forge
TASK: Implement OAuth login endpoint per Sage's spec

ECC auto-applies:
- @tdd-workflow (tests first)
- @verification-loop (quality gates)
- @python-patterns (if Python backend)
- @backend-patterns (API structure)

Forge delivers:
- Failing tests (RED)
- Implementation (GREEN)
- Passing tests with 80%+ coverage
- Build verified via @verification-loop

4. Delegate to Vigil:
TO: vigil
TASK: Review OAuth implementation

ECC auto-applies:
- @code-review (quality checklist)
- @security-scan (OWASP checks)
- @security-review (OAuth vulnerabilities)

Vigil reports:
- ✓ No hardcoded secrets
- ✓ CSRF protection enabled
- ✓ Rate limiting on /auth endpoints
- ✓ Token expiry properly configured
- ✓ 85% test coverage
- APPROVED ✅
```

### Example 2: Forge Implements with TDD

**Task from Sage:** "Implement password reset endpoint"

**Forge's Workflow:**
```
1. Apply @tdd-workflow pattern

2. Write failing tests (RED):
   ✗ test_password_reset_sends_email()
   ✗ test_password_reset_invalid_email()
   ✗ test_password_reset_rate_limited()

3. Implement minimal code (GREEN):
   - POST /auth/password-reset handler
   - Email service integration
   - Rate limiting (5 requests/hour)

4. Run @verification-loop:
   ✓ Build passes
   ✓ Types check (tsc --noEmit)
   ✓ Lint passes
   ✓ Tests pass (3/3)
   ✓ Coverage: 82%
   ✓ No security issues

5. If build failed, run /build-fix command

6. Deliver to Vigil for review
```

### Example 3: Vigil Quality Gate

**Task from Cooper:** "Review password reset implementation"

**Vigil's Workflow:**
```
1. Apply @code-review checklist:
   ✓ Function < 50 lines
   ✓ No deep nesting (< 4 levels)
   ✓ Error handling present
   ✓ No hardcoded values
   ✓ Readable variable names

2. Run @security-scan:
   ✓ No SQL injection (parameterized queries)
   ✓ No hardcoded secrets
   ✓ Rate limiting enabled
   ✓ Email validation present
   ⚠ Missing: Email content escaping (XSS risk)

3. Apply @verification-loop:
   ✓ Build: PASS
   ✓ Types: PASS
   ✓ Lint: PASS
   ✓ Tests: 3/3 PASS
   ✓ Coverage: 82% (target: 80%+)

4. Rating: 4/5 (Good — one security improvement needed)

5. Decision:
   - Flag email escaping as HIGH priority
   - Block merge until fixed
   - Document in quality report

6. Send back to Forge with specific fix
```

---

## Rebuilding Workspace with ECC

### Fresh Rebuild
```bash
node scripts/rebuild.js
```

### Force Regenerate (Overwrites existing files)
```bash
node scripts/rebuild.js --force
```

### What Gets Generated
- All shared workspace files (TASKS.json, AGENT_STATUS.json, etc.)
- Comms infrastructure (inboxes, outboxes, broadcast)
- **SOUL.md files with full ECC integration** for all agents

---

## Customizing ECC Mappings

Edit `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/config/ecc-mappings.json`:

```json
{
  "your-agent-id": {
    "role": "Agent Role",
    "agents": ["relevant-ecc-agent-1", "relevant-ecc-agent-2"],
    "skills": ["skill-1", "skill-2", "skill-3"],
    "commands": ["command-1", "command-2"],
    "principles": [
      "Principle 1",
      "Principle 2"
    ]
  }
}
```

Then rebuild:
```bash
node scripts/rebuild.js --force
```

---

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Production-Ready** | 69 skills from Anthropic hackathon winner |
| **Zero Configuration** | ECC resources auto-apply per agent role |
| **Consistent Quality** | All agents follow same best practices |
| **Faster Development** | Battle-tested workflows built-in |
| **Security-First** | @security-scan and @security-review automatic |
| **Test Coverage** | 80%+ requirement enforced via @tdd-workflow |
| **Framework Support** | Python, Django, Spring Boot, Go, Swift, PostgreSQL |
| **Scalable** | Enterprise-grade patterns from production systems |

---

## Troubleshooting

### Issue: SOUL.md missing ECC section
**Solution:** Run `node scripts/rebuild.js --force`

### Issue: ECC mappings not loading
**Check:** `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/config/ecc-mappings.json` exists

### Issue: Skills not found
**Check:** `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/skills/` directory exists

### Issue: Agent templates missing
**Check:** `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/agents/` directory exists

---

## Next Steps

1. **Rebuild workspace**: `node scripts/rebuild.js --force`
2. **Review generated SOUL.md files**: Check `agents-workspaces/*/SOUL.md`
3. **Test delegation**: Have Cooper delegate a task to see ECC in action
4. **Customize mappings**: Edit `config/ecc-mappings.json` for your workflow
5. **Explore skills**: Browse `ecc-resources/skills/` for available patterns

---

## Reference

- **ECC Source**: [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **AGI Farm Plugin**: `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/`
- **Configuration**: `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/config/ecc-mappings.json`
- **Resources**: `/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/ecc-resources/`
