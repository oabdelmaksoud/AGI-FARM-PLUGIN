---
name: pr-logger
description: "Log PR URL and provide review command after PR creation"
homepage: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
metadata:
  {
    "openclaw": {
      "emoji": "🔗",
      "events": ["tool:result"],
      "install": [{"id": "plugin:agi-farm", "kind": "plugin", "label": "AGI Farm Plugin"}]
    }
  }
---

# PR Logger Hook

Automatically detects PR creation and logs the PR URL with helpful next steps and review commands.

## What It Does

When you create a PR via `gh pr create` with the Bash tool:

1. **Detects PR creation** - Monitors Bash tool for `gh pr create` commands
2. **Extracts PR URL** - Parses output for PR URL
3. **Logs to file** - Saves PR URL to `~/.openclaw/logs/prs.log`
4. **Provides next steps** - Suggests review command and workflow

## Output Format

After successful PR creation:

```markdown
## 🔗 Pull Request Created

**PR URL:** https://github.com/owner/repo/pull/123

PR has been logged to: ~/.openclaw/logs/prs.log

### Next Steps:

1. **Review PR:**
   ```bash
   gh pr view 123 --web
   ```

2. **Request review:**
   ```bash
   gh pr review 123 --comment
   ```

3. **Check CI status:**
   ```bash
   gh pr checks 123
   ```

4. **Merge when ready:**
   ```bash
   gh pr merge 123 --squash
   ```
```

## Use Cases

- **Track PRs** - Centralized log of all created PRs
- **Quick access** - Easy copy/paste of PR URLs
- **Workflow guidance** - Next steps after PR creation
- **Audit trail** - Historical record of PR creation

## Requirements

- **GitHub CLI** - `gh` command must be installed
- No additional configuration needed

## Log File Format

PRs are logged in JSONL format at `~/.openclaw/logs/prs.log`:

```json
{"timestamp":"2026-03-06T16:00:00.000Z","url":"https://github.com/owner/repo/pull/123","title":"Add authentication feature","sessionKey":"agent:forge:main"}
{"timestamp":"2026-03-06T17:30:00.000Z","url":"https://github.com/owner/repo/pull/124","title":"Fix bug in payment flow","sessionKey":"agent:pixel:main"}
```

## Configuration

No configuration needed. The hook automatically:
- Detects `gh pr create` commands
- Extracts PR URL from output
- Logs to `~/.openclaw/logs/prs.log`
- Creates log directory if needed

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@git-workflow** - Completes PR creation workflow
- **@code-review** - Provides review commands
- **@deployment-patterns** - CI/CD workflow integration

## Viewing PR Log

```bash
# View recent PRs
tail -n 20 ~/.openclaw/logs/prs.log

# Pretty-print with jq
cat ~/.openclaw/logs/prs.log | jq .

# Filter by date
grep "2026-03-06" ~/.openclaw/logs/prs.log | jq .

# Extract URLs only
cat ~/.openclaw/logs/prs.log | jq -r .url
```

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **git-push-reminder** hook - Safety check before pushing
- **build-analyzer** hook - Build status analysis
- **quality-gate** hook - Pre-PR quality checks
