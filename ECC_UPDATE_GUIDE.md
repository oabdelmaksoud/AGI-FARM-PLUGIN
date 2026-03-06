# ECC Resources Update Guide

This guide explains how to keep the AGI Farm plugin's ECC resources synchronized with the upstream Everything Claude Code repository.

## Overview

The AGI Farm plugin integrates 194 production-ready resources from the [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) repository:

- 69 specialized skills
- 16 agent templates
- 33 slash commands
- 7 comprehensive guides
- 25 coding rules
- 7 example configurations
- 6 JSON schemas
- 3 context templates

These resources are **vendored** (copied into the plugin) rather than fetched at runtime for:
- **Stability** - Plugin works offline and doesn't break if upstream changes
- **Version Control** - Specific ECC version tested with each plugin release
- **Performance** - No network fetches during agent initialization

However, this means we need a process to **periodically sync updates** from the upstream ECC repository.

---

## Quick Start

### Check Current Version

```bash
cat ecc-resources/ECC_VERSION
```

Shows:
- Current commit SHA
- Date of last update
- Number of integrated files

### Update to Latest

```bash
# Dry run (see what would change)
node scripts/update-ecc-resources.js --dry-run

# Apply updates
node scripts/update-ecc-resources.js
```

### Update to Specific Version

```bash
# Sync to specific commit
node scripts/update-ecc-resources.js --version=abc123def
```

---

## Update Workflow

### For Plugin Maintainers

**Recommended Schedule:** Monthly or when major ECC updates are released

#### Step 1: Check for Updates

```bash
# Clone/pull ECC repo locally to review changes
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/ecc-check
cd /tmp/ecc-check
git log --oneline --since="1 month ago"
```

Review the changelog to see if updates are:
- **Breaking changes** (require testing)
- **New features** (worth highlighting in plugin release notes)
- **Bug fixes** (low risk)

#### Step 2: Run Dry-Run

```bash
cd /path/to/AGI-FARM-PLUGIN
node scripts/update-ecc-resources.js --dry-run
```

Review the output to see:
- ✅ Added files (new skills/commands)
- ⚠️ Modified files (content changes)
- ❌ Removed files (deprecated resources)

#### Step 3: Apply Updates

```bash
node scripts/update-ecc-resources.js
```

#### Step 4: Review Changes

```bash
git diff ecc-resources/
```

Check:
- Are skill descriptions still accurate?
- Do new commands conflict with existing ones?
- Are there any breaking changes in syntax?

#### Step 5: Test with Agents

```bash
# Rebuild agent SOUL.md files with new resources
node scripts/rebuild.js

# Test a few agents
openclaw agents run sage "test @tdd-workflow skill"
openclaw agents run forge "test @api-design skill"
openclaw agents run vigil "test @security-scan skill"
```

Verify:
- Agents can access new resources
- No errors in skill loading
- New commands work as expected

#### Step 6: Update Plugin Version

If the ECC update adds significant value, bump the plugin version:

```json
// package.json
{
  "version": "1.4.1" // or 1.5.0 for major ECC updates
}
```

#### Step 7: Update Changelog

```markdown
## [1.4.1] - 2026-03-15

### Updated
- ECC resources to commit `abc123def` (2026-03-10)
  - Added 3 new skills: X, Y, Z
  - Updated security-scan skill with CVE-2026-1234 fix
  - Deprecated old-skill (use new-skill instead)
```

#### Step 8: Commit and Release

```bash
git add ecc-resources/ package.json CHANGELOG.md
git commit -m "chore: Update ECC resources to latest upstream

- Updated from commit initial → abc123def
- Added 3 new skills, modified 5 files
- See ECC_VERSION for full update details"

git push origin main

# Create new release
gh release create v1.4.1 --notes "ECC resources updated to latest"
```

---

## Update Script Reference

### Usage

```bash
node scripts/update-ecc-resources.js [OPTIONS]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Show changes without applying | `--dry-run` |
| `--version=<sha>` | Sync to specific commit | `--version=abc123def` |

### What It Does

1. **Clones/pulls** the ECC repo to `/tmp/agi-farm-ecc-update`
2. **Compares** each ECC directory with plugin's `ecc-resources/`
3. **Syncs** markdown files:
   - `agents/` → `ecc-resources/agents/`
   - `skills/` → `ecc-resources/skills/`
   - `commands/` → `ecc-resources/commands/`
   - `docs/` → `ecc-resources/docs/`
   - `rules/` → `ecc-resources/rules/`
   - `examples/` → `ecc-resources/examples/`
   - `schemas/` → `ecc-resources/schemas/`
   - `contexts/` → `ecc-resources/contexts/`
4. **Updates** meta files (README, CHANGELOG, AGENTS.md)
5. **Writes** `ECC_VERSION` with commit SHA and timestamp
6. **Reports** summary (added/modified/removed files)

### What It Skips

The script intentionally **does not sync**:
- `.github/` (CI/CD workflows - plugin-specific)
- `tests/` (ECC test suite - not needed in plugin)
- `.git/` (version control)
- `node_modules/` (dependencies)
- Non-markdown files in synced directories

### Exit Codes

- `0` - Success
- `1` - Error (network failure, invalid version, etc.)

---

## Version File Format

**File:** `ecc-resources/ECC_VERSION`

```json
{
  "commit": "abc123def456...",
  "date": "2026-03-10T14:32:00Z",
  "updated_at": "2026-03-15T10:15:00Z",
  "previous_commit": "initial",
  "source": "https://github.com/affaan-m/everything-claude-code"
}
```

Fields:
- **commit** - Full SHA of upstream ECC commit
- **date** - Commit date from upstream
- **updated_at** - When plugin was updated
- **previous_commit** - Previous version (for rollback)
- **source** - Upstream repository URL

---

## Troubleshooting

### Update Script Fails to Clone

**Symptom:**
```
Error: Command failed: git clone https://github.com/...
```

**Fix:**
```bash
# Check network connectivity
curl -I https://github.com

# Check git access
git ls-remote https://github.com/affaan-m/everything-claude-code.git

# Clean temp directory
rm -rf /tmp/agi-farm-ecc-update
```

### Too Many Changes

**Symptom:** Update shows 50+ modified files

**Cause:** Long time since last update, or upstream refactoring

**Fix:**
1. Review ECC changelog: `https://github.com/affaan-m/everything-claude-code/commits/main`
2. Consider updating in stages:
   ```bash
   # Update to intermediate commit first
   node scripts/update-ecc-resources.js --version=<older-commit>
   # Test thoroughly
   # Then update to latest
   node scripts/update-ecc-resources.js
   ```

### Conflicts with Custom Changes

**Symptom:** Plugin has customized ECC files, update overwrites them

**Solution:**
- Don't modify `ecc-resources/` directly
- Add custom skills to `skills/` (plugin root)
- Add custom commands to `commands/` (plugin root)
- Plugin-specific resources take precedence over ECC

### Version File Corrupt

**Symptom:**
```
⚠ Could not read ECC_VERSION file
```

**Fix:**
```bash
# Restore version file
cat > ecc-resources/ECC_VERSION <<'EOF'
{
  "commit": "unknown",
  "date": "unknown",
  "updated_at": "2026-03-06T00:00:00Z",
  "previous_commit": null
}
EOF

# Then run update
node scripts/update-ecc-resources.js
```

---

## FAQ

### How often should I update?

**Recommendation:** Monthly for active maintenance, quarterly for stable releases

ECC is production-ready, so updates are typically:
- Low risk (bug fixes, documentation)
- Medium value (new skills, improved patterns)

### Can I auto-update ECC resources?

**Not recommended** for production plugin. Reasons:
- Untested upstream changes could break agents
- No review opportunity for breaking changes
- Users expect stable, tested releases

However, you could:
1. Set up GitHub Action to **check** for updates weekly
2. Create automated PR with changes
3. Maintainer reviews and merges

### What if ECC repo is deleted?

ECC resources are **vendored** (copied into plugin), so plugin continues working even if upstream disappears.

Backups:
- Plugin releases on GitHub contain full ECC snapshot
- Each version pinned to specific ECC commit
- Community can fork and maintain

### How do I roll back an update?

```bash
# Check previous version
cat ecc-resources/ECC_VERSION | grep previous_commit

# Sync to previous commit
node scripts/update-ecc-resources.js --version=<previous-commit>

# Or use git
git checkout HEAD~1 -- ecc-resources/
```

### Can users update ECC themselves?

**No.** ECC resources are part of plugin installation. Users get whatever ECC version ships with their plugin version.

If a user wants newer ECC features:
1. Wait for plugin release with updated ECC
2. Or install plugin from source (development mode)

---

## Integration Notes

### How ECC Resources Are Used

**Agent SOUL.md Files:**
- Generated by `scripts/rebuild.js`
- Includes `ecc-resources/` content via Mustache templates
- Uses `config/ecc-mappings.json` for role-based inclusion

**Shorthand Access:**
- `@tdd-workflow` → `ecc-resources/skills/tdd-workflow/SKILL.md`
- `@security-scan` → `ecc-resources/skills/security-scan/SKILL.md`
- `@api-design` → `ecc-resources/skills/api-design/SKILL.md`

**Hooks:**
- Reference implementations in `ecc-resources/hooks/` (informational)
- Actual hooks in `hooks/` (OpenClaw-compatible)

**MCP Servers:**
- Reference configs in `ecc-resources/mcp-configs/` (informational)
- Actual setup via `mcporter` (user-managed)

### Customization vs. Updates

**Safe to customize:**
- `hooks/` - Plugin-specific implementations
- `templates/` - Agent SOUL.md templates
- `config/ecc-mappings.json` - Role mappings

**Don't modify:**
- `ecc-resources/` - Gets overwritten on update
- Add custom content elsewhere instead

---

## Automated Update Workflow (Future)

### GitHub Action (Draft)

```yaml
# .github/workflows/ecc-update-check.yml
name: Check ECC Updates
on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: node scripts/update-ecc-resources.js --dry-run
      - name: Create PR if updates available
        if: ${{ steps.check.outputs.has_updates }}
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: ECC resources update available"
          body: "Automated PR with latest ECC resources"
```

---

## Credits

ECC resources maintained by [@affaan-m](https://github.com/affaan-m) (Anthropic Claude Code hackathon winner).

For questions about ECC content, see: https://github.com/affaan-m/everything-claude-code/issues

For questions about plugin update process, see: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
