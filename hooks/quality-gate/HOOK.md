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

Automatically appends quality check reminders after file edits to ensure agents verify their work before marking tasks complete.

## What It Does

When you edit files with Edit, Write, or MultiEdit tools:

1. **Detects file edits** - Monitors Edit/Write/MultiEdit tool usage
2. **Appends quality checklist** - Adds reminder to run build/types/tests/lint
3. **Enforces standards** - Ensures agents verify their work before completion

## Output Format

Appends to tool result:

```markdown
## Quality Gates Required

Before marking complete, run:
```bash
npm run build 2>&1 | tail -20        # Verify build
npx tsc --noEmit 2>&1 | head -30     # Check types
npm test -- --coverage 2>&1 | tail -50  # Run tests
npm run lint 2>&1 | head -30         # Lint check
```

Include checklist in completion:
✅ Build: PASS/FAIL
✅ Types: PASS/FAIL (N errors)
✅ Tests: PASS/FAIL (N/M, N% coverage)
✅ Lint: PASS/FAIL
```

## Use Cases

- **Enforce TDD workflow** - Remind agents to verify tests pass
- **Prevent type errors** - Ensure TypeScript check runs before completion
- **Maintain code quality** - Require lint/format checks
- **Build verification** - Confirm code compiles before marking done

## Requirements

No requirements - works out of the box with any project that has npm scripts.

## Configuration

No configuration needed. The hook automatically appends reminders after:
- Edit tool usage
- Write tool usage
- MultiEdit tool usage

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@tdd-workflow** - Complements TDD process with automatic reminders
- **@verification-loop** - Enforces verification before completion
- **@code-review** - Provides checklist for reviewers

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks:

```bash
# Disable the AGI Farm plugin
openclaw plugins disable agi-farm
```

Or manually in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "agi-farm": {
        "enabled": false
      }
    }
  }
}
```

## See Also

- **typecheck** hook - Auto-runs TypeScript checks
- **console-warn** hook - Warns about console.log statements
- **auto-format** hook - Auto-formats code after edits
