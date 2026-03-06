---
name: auto-format
description: "Auto-format JS/TS files after edits with Biome or Prettier"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "🎨",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# Auto-Format Hook

Automatically formats JavaScript/TypeScript files after edits using Biome or Prettier (auto-detected).

## What It Does

When you edit JS/TS files (.js, .jsx, .ts, .tsx) with the Edit tool:

1. **Detects formatter** - Checks for Biome first, falls back to Prettier
2. **Runs formatter** - Formats the edited file in-place
3. **Updates file** - Writes formatted content back to disk
4. **Confirms success** - Appends formatting confirmation to result

## Formatter Detection

**Priority:**
1. **Biome** (recommended) - `npx @biomejs/biome format --write`
2. **Prettier** (fallback) - `npx prettier --write`
3. **None** - Skip silently if no formatter available

## Output Format

On success:

```markdown
## 🎨 Auto-Format Results

**Formatter:** Biome
**File:** src/auth.ts
**Status:** ✅ Formatted successfully

File has been auto-formatted and saved.
```

On failure (graceful):

```markdown
## 🎨 Auto-Format Results

**Status:** ⚠️ Skipped (no formatter detected)

Install a formatter:
- Biome: `npm install -D @biomejs/biome`
- Prettier: `npm install -D prettier`
```

## Use Cases

- **Consistent formatting** - No manual formatting needed
- **Save time** - Automatic code styling
- **Team standards** - Enforces project formatting rules
- **Professional code** - Clean, readable code every time

## Requirements

**Optional (auto-detected):**
- Biome installed: `@biomejs/biome` in devDependencies
- OR Prettier installed: `prettier` in devDependencies

If neither is installed, hook skips silently.

## Configuration

No configuration needed. The hook:
- Auto-detects Biome or Prettier
- Respects project config files:
  - `biome.json` for Biome
  - `.prettierrc` for Prettier
- Formats files in-place
- Skips gracefully if no formatter available

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@typescript-patterns** - Enforces formatting standards
- **@code-review** - Ensures consistent code style
- **@verification-loop** - Part of quality checks

## Performance

- **Fast** - Formatting completes in <1 second
- **Non-blocking** - Returns immediately with results
- **Safe** - Only formats valid files (respects .gitignore)

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **quality-gate** hook - Comprehensive quality checks
- **typecheck** hook - TypeScript type checking
- **console-warn** hook - Warns about console.log
