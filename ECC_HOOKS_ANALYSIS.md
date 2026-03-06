# ECC Hooks → OpenClaw Hooks Analysis & Implementation Plan

**Date:** 2026-03-06
**Task:** Port ECC's 23 hooks to OpenClaw's native hook system

---

## OpenClaw Hook System Overview

### Hook Structure
```
hook-name/
├── HOOK.md      # Frontmatter + documentation
└── handler.js   # Hook implementation (or handler.ts compiled to .js)
```

### HOOK.md Frontmatter
```markdown
---
name: hook-name
description: "Short description"
homepage: https://docs.openclaw.ai/automation/hooks#hook-name
metadata:
  {
    "openclaw": {
      "emoji": "📝",
      "events": ["command", "agent:bootstrap", "tool:result"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---
```

### Available Events
Based on research and built-in hooks:
- `command` - All commands (`/new`, `/reset`, `/stop`, etc.)
- `command:new` - Specific command
- `command:reset` - Reset command
- `agent:bootstrap` - Agent initialization
- `tool:result` - Tool execution result (synchronous transform)

**Key Differences from Claude Code:**
- **No PreToolUse/PostToolUse** - OpenClaw uses event-based hooks
- **No Stop/SessionEnd** - Uses `command` events instead
- **Tool result hooks are synchronous** - Must transform results immediately

---

## ECC Hooks Analysis

### Total: 23 hooks across 5 lifecycle phases

| Phase | ECC Hook Count | OpenClaw Equivalent |
|-------|---------------|---------------------|
| PreToolUse | 6 hooks | `tool:result` (before execution) or agent prompts |
| PostToolUse | 7 hooks | `tool:result` (after execution) |
| Stop | 4 hooks | `command` events |
| SessionStart | 1 hook | `agent:bootstrap` |
| SessionEnd | 1 hook | `command:new` or `command:reset` |
| PreCompact | 1 hook | No direct equivalent (context management) |

---

## Top 10 Most Valuable Hooks (Prioritized)

### 1. ✅ Quality Gate Hook (post:quality-gate)
**ECC Function:** Run quality checks after file edits (build, types, lint)
**Priority:** ⭐⭐⭐⭐⭐ (CRITICAL)
**OpenClaw Event:** `tool:result` (Edit, Write, MultiEdit tools)
**Complexity:** Medium
**Implementation:** Transform tool result to append quality check commands

**Value:**
- Auto-verify build/types/tests after edits
- Catch errors immediately
- Enforce quality standards

**Implementation Approach:**
```typescript
// handler.ts
export default async function (event) {
  const { tool, result } = event;

  if (!['Edit', 'Write', 'MultiEdit'].includes(tool.name)) {
    return result; // Pass through
  }

  // Append quality check reminder to result
  const qualityChecks = `
## Quality Gates Required

Before marking complete, run:
\`\`\`bash
npm run build  # Verify build
npx tsc --noEmit  # Check types
npm test  # Run tests
npm run lint  # Lint check
\`\`\`
`;

  return result + '\n' + qualityChecks;
}
```

### 2. ✅ Post-Edit Type Check (post:edit:typecheck)
**ECC Function:** Auto-run TypeScript check after editing .ts/.tsx files
**Priority:** ⭐⭐⭐⭐⭐ (CRITICAL)
**OpenClaw Event:** `tool:result` (Edit tool)
**Complexity:** Medium
**Implementation:** Detect .ts/.tsx edits, run `tsc --noEmit`, append results

**Value:**
- Immediate type error feedback
- Prevent type errors from accumulating
- Better developer experience

### 3. ✅ Console Log Warning (post:edit:console-warn + stop:check-console-log)
**ECC Function:** Warn about console.log statements
**Priority:** ⭐⭐⭐⭐ (HIGH)
**OpenClaw Event:** `tool:result` (Edit tool)
**Complexity:** Low
**Implementation:** Scan edited file for console.log, append warning

**Value:**
- Prevent debug statements in production
- Enforce clean code
- Easy to implement

### 4. ✅ Auto-Format (post:edit:format)
**ECC Function:** Auto-format JS/TS files after edits (Biome or Prettier)
**Priority:** ⭐⭐⭐⭐ (HIGH)
**OpenClaw Event:** `tool:result` (Edit tool)
**Complexity:** Medium-High
**Implementation:** Run formatter, update file, append confirmation

**Value:**
- Consistent code formatting
- No manual formatting needed
- Professional code quality

### 5. ✅ PR Created Logger (post:bash:pr-created)
**ECC Function:** Log PR URL and provide review command after PR creation
**Priority:** ⭐⭐⭐ (MEDIUM)
**OpenClaw Event:** `tool:result` (Bash tool, detect `gh pr create`)
**Complexity:** Low
**Implementation:** Parse bash output for PR URL, append to result

**Value:**
- Quick access to PR URL
- Workflow continuity
- Easy to implement

### 6. ⚠️ Session Memory (session:start + stop:session-end)
**ECC Function:** Save/load session context
**Priority:** ⭐⭐⭐ (MEDIUM)
**OpenClaw Event:** `agent:bootstrap` + `command:new`
**Complexity:** Medium
**Note:** OpenClaw already has `session-memory` built-in hook

**Value:**
- Context persistence
- Session continuity
- Already implemented in OpenClaw!

### 7. ✅ Git Push Reminder (pre:bash:git-push-reminder)
**ECC Function:** Reminder before git push to review changes
**Priority:** ⭐⭐⭐ (MEDIUM)
**OpenClaw Event:** `tool:result` (Bash tool, detect `git push`)
**Complexity:** Low
**Implementation:** Detect git push command, prepend reminder

**Value:**
- Prevent accidental pushes
- Force code review
- Safety net

### 8. ⚠️ Dev Server Block (pre:bash:dev-server-block)
**ECC Function:** Block dev servers outside tmux
**Priority:** ⭐⭐ (LOW)
**OpenClaw Event:** `tool:result` (Bash tool)
**Complexity:** Medium
**Note:** Platform-specific, may not be needed in OpenClaw multi-agent context

### 9. ⚠️ Continuous Learning (pre:observe + post:observe)
**ECC Function:** Capture tool use observations for pattern extraction
**Priority:** ⭐⭐ (LOW)
**OpenClaw Event:** `tool:result` (all tools)
**Complexity:** High
**Note:** Requires pattern extraction system

### 10. ⚠️ Cost Tracker (stop:cost-tracker)
**ECC Function:** Track token and cost metrics per session
**Priority:** ⭐ (LOW)
**OpenClaw Event:** `command` (various)
**Complexity:** Medium
**Note:** OpenClaw may have built-in metering

---

## Implementation Plan

### Phase 1: Critical Quality Hooks (Week 1)
**Goal:** Implement top 5 highest-value hooks

#### Hook 1: Quality Gate Hook
**File:** `agi-farm/hooks/quality-gate/`
```
hooks/quality-gate/
├── HOOK.md
└── handler.ts
```

**Events:** `tool:result` (Edit, Write, MultiEdit)
**Function:** Append quality check reminders after file edits

#### Hook 2: TypeScript Check Hook
**File:** `agi-farm/hooks/typecheck/`
**Events:** `tool:result` (Edit)
**Function:** Auto-run `tsc --noEmit` for .ts/.tsx edits, append results

#### Hook 3: Console Log Warning Hook
**File:** `agi-farm/hooks/console-warn/`
**Events:** `tool:result` (Edit)
**Function:** Scan for console.log, append warning if found

#### Hook 4: Auto-Format Hook
**File:** `agi-farm/hooks/auto-format/`
**Events:** `tool:result` (Edit)
**Function:** Run formatter (Biome/Prettier), update file, confirm

#### Hook 5: PR Logger Hook
**File:** `agi-farm/hooks/pr-logger/`
**Events:** `tool:result` (Bash)
**Function:** Detect PR creation, log URL, provide review command

### Phase 2: Workflow Enhancement Hooks (Week 2)
**Goal:** Implement workflow helpers

#### Hook 6: Git Push Reminder
**File:** `agi-farm/hooks/git-push-reminder/`
**Events:** `tool:result` (Bash)
**Function:** Detect git push, prepend review reminder

#### Hook 7: Build Complete Analyzer
**File:** `agi-farm/hooks/build-analyzer/`
**Events:** `tool:result` (Bash)
**Function:** Detect build completion, analyze output, suggest fixes

### Phase 3: Advanced Features (Optional)
**Goal:** Implement nice-to-have features

#### Hook 8: Pattern Extractor
**File:** `agi-farm/hooks/pattern-extractor/`
**Events:** `command:new`, `command:reset`
**Function:** Extract patterns from completed sessions

---

## Technical Implementation

### Directory Structure
```
/Users/omarabdelmaksoud/.openclaw/workspace/AGI-FARM-PLUGIN/hooks/
├── quality-gate/
│   ├── HOOK.md
│   └── handler.ts
├── typecheck/
│   ├── HOOK.md
│   └── handler.ts
├── console-warn/
│   ├── HOOK.md
│   └── handler.ts
├── auto-format/
│   ├── HOOK.md
│   └── handler.ts
├── pr-logger/
│   ├── HOOK.md
│   └── handler.ts
├── git-push-reminder/
│   ├── HOOK.md
│   └── handler.ts
└── build-analyzer/
    ├── HOOK.md
    └── handler.ts
```

### Plugin Registration
Update `openclaw.plugin.json`:
```json
{
  "id": "agi-farm",
  "hooks": [
    "hooks/quality-gate",
    "hooks/typecheck",
    "hooks/console-warn",
    "hooks/auto-format",
    "hooks/pr-logger",
    "hooks/git-push-reminder",
    "hooks/build-analyzer"
  ]
}
```

### TypeScript Compilation
Add build script to `package.json`:
```json
{
  "scripts": {
    "build:hooks": "tsc hooks/*/handler.ts --outDir hooks --module commonjs"
  }
}
```

---

## Hook Implementation Template

### HOOK.md Template
```markdown
---
name: quality-gate
description: "Run quality checks after file edits (build, types, tests, lint)"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "✅",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# Quality Gate Hook

Automatically appends quality check reminders after file edits.

## What It Does

When you edit files with Edit, Write, or MultiEdit tools:

1. **Detects file edits** - Monitors Edit/Write/MultiEdit tool usage
2. **Appends quality checklist** - Adds reminder to run build/types/tests/lint
3. **Enforces standards** - Ensures agents verify their work

## Output Format

Appends to tool result:
```markdown
## Quality Gates Required

Before marking complete, run:
\`\`\`bash
npm run build  # Verify build
npx tsc --noEmit  # Check types
npm test  # Run tests
npm run lint  # Lint check
\`\`\`
```

## Requirements

No requirements - works out of the box.

## Configuration

No configuration needed.

## Disabling

```bash
# Disable hook via openclaw config
# (Plugin-managed hooks cannot be disabled individually)
# Disable the agi-farm plugin to disable all its hooks
```
```

### handler.ts Template
```typescript
/**
 * Quality Gate Hook Handler
 *
 * Appends quality check reminders after file edits
 */

export default async function qualityGateHook(event: any): Promise<any> {
  const { tool, result } = event;

  // Only process Edit, Write, MultiEdit tools
  if (!['Edit', 'Write', 'MultiEdit'].includes(tool.name)) {
    return result; // Pass through unchanged
  }

  // Append quality check reminder
  const qualityChecks = `

## Quality Gates Required

Before marking complete, run:
\`\`\`bash
npm run build 2>&1 | tail -20        # Verify build
npx tsc --noEmit 2>&1 | head -30     # Check types
npm test -- --coverage 2>&1 | tail -50  # Run tests
npm run lint 2>&1 | head -30         # Lint check
\`\`\`

Include checklist in completion:
✅ Build: PASS/FAIL
✅ Types: PASS/FAIL (N errors)
✅ Tests: PASS/FAIL (N/M, N% coverage)
✅ Lint: PASS/FAIL
`;

  return result + qualityChecks;
}
```

---

## Limitations & Workarounds

### Limitation 1: No PreToolUse Hooks
**ECC:** PreToolUse hooks can block tool execution
**OpenClaw:** tool:result hooks transform results after execution

**Workaround:** Use agent prompts to warn before dangerous operations
```markdown
# In SOUL.md
Before running destructive commands (rm -rf, git push --force):
1. Ask user for confirmation
2. Explain consequences
3. Wait for explicit approval
```

### Limitation 2: No Stop Hooks
**ECC:** Stop hooks run after every assistant response
**OpenClaw:** Use command hooks or tool:result

**Workaround:** Implement checks in tool:result hooks

### Limitation 3: Synchronous tool:result Hooks
**ECC:** PostToolUse hooks can be async with timeout
**OpenClaw:** tool:result hooks must return immediately

**Workaround:** Return result quickly, log heavy operations separately

### Limitation 4: No PreCompact Hooks
**ECC:** PreCompact saves state before context compaction
**OpenClaw:** No direct equivalent

**Workaround:** Use command:new hook to save state, or rely on session-memory

---

## Testing Plan

### Test 1: Quality Gate Hook
```bash
# 1. Install hook
# 2. Edit a file
# 3. Verify quality checklist appears in result
# 4. Confirm checklist has correct commands
```

### Test 2: TypeScript Check Hook
```bash
# 1. Install hook
# 2. Edit a .ts file with type error
# 3. Verify tsc output appears in result
# 4. Fix error, verify clean output
```

### Test 3: Console Log Warning Hook
```bash
# 1. Install hook
# 2. Edit file, add console.log
# 3. Verify warning appears
# 4. Remove console.log, verify no warning
```

### Test 4: Auto-Format Hook
```bash
# 1. Install hook
# 2. Edit file with bad formatting
# 3. Verify file is auto-formatted
# 4. Check formatting matches Biome/Prettier
```

### Test 5: PR Logger Hook
```bash
# 1. Install hook
# 2. Run gh pr create
# 3. Verify PR URL is logged
# 4. Verify review command is provided
```

---

## Success Metrics

### Week 1
- ✅ 5 critical hooks implemented
- ✅ All hooks passing tests
- ✅ Hooks registered in plugin
- ✅ Documentation complete

### Month 1
- ✅ Hooks used in 50+ agent tasks
- ✅ Quality gate compliance: 90%+
- ✅ Type errors caught immediately: 95%+
- ✅ Console.log warnings working: 100%
- ✅ Auto-format success rate: 95%+

### Quarter 1
- ✅ All 7 planned hooks stable
- ✅ Zero regressions
- ✅ Community feedback positive
- ✅ Consider additional hooks based on usage

---

## Effort Estimates

| Hook | Complexity | Effort | Priority |
|------|-----------|--------|----------|
| Quality Gate | Medium | 3 hours | ⭐⭐⭐⭐⭐ |
| TypeScript Check | Medium | 4 hours | ⭐⭐⭐⭐⭐ |
| Console Warn | Low | 2 hours | ⭐⭐⭐⭐ |
| Auto-Format | Medium-High | 5 hours | ⭐⭐⭐⭐ |
| PR Logger | Low | 2 hours | ⭐⭐⭐ |
| Git Push Reminder | Low | 2 hours | ⭐⭐⭐ |
| Build Analyzer | Medium | 3 hours | ⭐⭐⭐ |

**Total Effort:** ~21 hours (Phase 1: 16 hours, Phase 2: 5 hours)

---

## Next Steps

### Immediate (Today)
1. ✅ Complete analysis document (this file)
2. ⬜ Create hooks/ directory structure
3. ⬜ Implement Hook 1: Quality Gate
4. ⬜ Test quality gate hook
5. ⬜ Update openclaw.plugin.json

### Week 1
1. ⬜ Implement Hooks 2-5 (TypeScript, Console, Format, PR Logger)
2. ⬜ Test all hooks
3. ⬜ Document usage
4. ⬜ Deploy to agents

### Week 2
1. ⬜ Gather feedback from real usage
2. ⬜ Implement Hooks 6-7 (Git Push, Build Analyzer)
3. ⬜ Refine based on feedback
4. ⬜ Consider additional hooks

---

**Last Updated:** 2026-03-06
**Status:** Analysis Complete, Ready for Implementation
