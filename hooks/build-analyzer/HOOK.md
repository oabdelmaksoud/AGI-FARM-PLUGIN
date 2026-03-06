---
name: build-analyzer
description: "Analyze build output and suggest fixes for common errors"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "🔧",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# Build Analyzer Hook

Automatically analyzes build output and provides intelligent suggestions for fixing common build errors.

## What It Does

When you run build commands with the Bash tool:

1. **Detects build commands** - Monitors npm/pnpm/yarn/go build commands
2. **Analyzes output** - Parses build errors and warnings
3. **Categorizes issues** - Groups by type (syntax, imports, types, etc.)
4. **Suggests fixes** - Provides actionable solutions

## Output Format

On build success:

```markdown
## 🔧 Build Analysis

**Status:** ✅ BUILD SUCCESSFUL
**Duration:** 3.2s
**Warnings:** 0

Build completed without errors.
```

On build failure:

```markdown
## 🔧 Build Analysis

**Status:** ❌ BUILD FAILED
**Errors:** 3

### Error 1: Module Not Found
**File:** src/auth.ts:5
**Issue:** Cannot find module './utils/hash'

**Likely Cause:** Missing or incorrectly named import

**Suggested Fixes:**
1. Check file exists: `ls src/utils/hash.ts`
2. Verify import path is correct
3. If file is missing, create it or install package:
   ```bash
   npm install hash-utils
   ```

### Error 2: Type Error
**File:** src/api/users.ts:42
**Issue:** Property 'usernme' does not exist on type 'User'

**Likely Cause:** Typo in property name

**Suggested Fix:**
Change `user.usernme` to `user.username`

### Error 3: Syntax Error
**File:** src/routes.ts:15
**Issue:** Unexpected token '}'

**Likely Cause:** Missing opening brace or extra closing brace

**Suggested Fix:**
Check braces balance around line 15

## Next Steps:
1. Fix errors in order (dependencies first)
2. Run `npm run build` after each fix
3. Commit once all errors resolved
```

## Supported Build Tools

- **npm** - `npm run build`, `npm run dev`, etc.
- **pnpm** - `pnpm build`, `pnpm dev`, etc.
- **yarn** - `yarn build`, `yarn dev`, etc.
- **Go** - `go build`, `go test`, etc.
- **Rust** - `cargo build`, `cargo test`, etc.
- **Python** - `python setup.py build`, etc.

## Error Categories

**Automatically detected:**
- Module not found / import errors
- TypeScript type errors
- Syntax errors
- Missing dependencies
- Configuration errors
- Path resolution issues

## Use Cases

- **Faster debugging** - Immediate error analysis
- **Learning tool** - Understand common errors
- **Productivity** - Suggested fixes save time
- **Quality** - Catch issues early

## Requirements

No requirements - works with any build tool that outputs to stdout/stderr.

## Configuration

No configuration needed. The hook automatically:
- Detects build commands by pattern matching
- Parses error output
- Categorizes and suggests fixes
- Skips gracefully for non-build commands

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@verification-loop** - Part of build verification
- **@tdd-workflow** - Fix builds during TDD
- **@code-review** - Build checks before review

## Performance

- **Fast** - Analysis completes in <1 second
- **Non-blocking** - Returns immediately
- **Lightweight** - Simple pattern matching

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **typecheck** hook - TypeScript type checking
- **quality-gate** hook - Comprehensive quality checks
- **console-warn** hook - Code quality warnings
