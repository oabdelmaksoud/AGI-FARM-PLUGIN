---
name: console-warn
description: "Warn about console.log statements in edited files"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "⚠️",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# Console Log Warning Hook

Automatically scans edited files for `console.log` statements and warns if found to prevent debug code from reaching production.

## What It Does

When you edit JavaScript/TypeScript files with the Edit tool:

1. **Scans edited file** - Reads the file content after edit
2. **Detects console.log** - Finds all console.log statements
3. **Warns if found** - Appends warning with line numbers
4. **Prevents production issues** - Catches debug code early

## Output Format

If console.log found:

```markdown
## ⚠️ Console.log Statements Found

Found 2 console.log statements in src/auth.ts:

- Line 15: `console.log('User authenticated:', user);`
- Line 42: `console.log('Debug: token =', token);`

**Action Required:** Remove console.log statements before marking complete.

Use proper logging instead:
- Development: `logger.debug(...)`
- Production: `logger.info(...)`, `logger.error(...)`
```

If no console.log found:

```markdown
## ✅ No Console.log Statements

File is clean - no console.log statements found.
```

## Use Cases

- **Prevent debug code in production** - Catch forgotten console.log
- **Enforce logging standards** - Use proper logger instead
- **Code quality** - Maintain clean, professional code
- **Security** - Prevent accidental data logging

## Requirements

No requirements - works with any JavaScript/TypeScript file.

## Configuration

No configuration needed. The hook automatically:
- Scans .js, .jsx, .ts, .tsx files
- Detects console.log statements
- Provides line numbers and content
- Skips gracefully if file not accessible

## False Positives

The hook may warn about legitimate uses of console.log:
- Comments: `// console.log(...)` (safely ignored)
- Strings: `const msg = "console.log example"` (may trigger warning)

If you need console.log for a specific reason, document it:
```typescript
// Intentional: CLI tool output
console.log(result);
```

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@code-review** - Automated code quality check
- **@security-scan** - Prevents accidental data exposure
- **@verification-loop** - Part of comprehensive verification

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **quality-gate** hook - Comprehensive quality checks
- **typecheck** hook - TypeScript type checking
- **auto-format** hook - Auto-formats code after edits
