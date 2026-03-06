---
name: typecheck
description: "Auto-run TypeScript type check after editing .ts/.tsx files"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "🔍",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# TypeScript Check Hook

Automatically runs TypeScript type checking after editing .ts or .tsx files and appends results to provide immediate feedback on type errors.

## What It Does

When you edit TypeScript files (.ts, .tsx) with the Edit tool:

1. **Detects TypeScript edits** - Monitors Edit tool for .ts/.tsx file changes
2. **Runs type check** - Executes `npx tsc --noEmit` to check types
3. **Appends results** - Adds type check output to tool result
4. **Provides immediate feedback** - Catches type errors immediately

## Output Format

Appends to Edit tool result:

```markdown
## 🔍 TypeScript Check Results

\`\`\`bash
$ npx tsc --noEmit
src/auth.ts:42:15 - error TS2339: Property 'usernme' does not exist on type 'User'. Did you mean 'username'?

42   const name = user.usernme;
                       ~~~~~~~
\`\`\`

**Status:** ❌ FAILED (1 error found)

Fix type errors before marking complete.
```

Or on success:

```markdown
## 🔍 TypeScript Check Results

\`\`\`bash
$ npx tsc --noEmit
\`\`\`

**Status:** ✅ PASSED (0 errors)
```

## Use Cases

- **Immediate feedback** - Catch type errors as soon as code is written
- **Prevent type errors** - Fix errors before they accumulate
- **TypeScript learning** - See type errors explained in real-time
- **Quality assurance** - Ensure type safety

## Requirements

- **TypeScript installed** - Project must have `typescript` in dependencies
- **tsconfig.json** - Project must have TypeScript configuration

The hook automatically detects if TypeScript is available. If not, it silently skips type checking.

## Configuration

No configuration needed. The hook automatically:
- Detects .ts and .tsx file edits
- Runs `npx tsc --noEmit` (no files generated)
- Appends results to Edit tool output
- Skips gracefully if TypeScript not available

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@typescript-patterns** - Enforces TypeScript best practices
- **@tdd-workflow** - Catches type errors during TDD cycle
- **@verification-loop** - Part of comprehensive verification

## Performance

- **Fast** - Type check usually completes in <2 seconds
- **Incremental** - TypeScript's incremental compilation is used
- **Non-blocking** - Returns immediately with results

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **quality-gate** hook - Comprehensive quality checks
- **console-warn** hook - Warns about console.log
- **auto-format** hook - Auto-formats TypeScript code
