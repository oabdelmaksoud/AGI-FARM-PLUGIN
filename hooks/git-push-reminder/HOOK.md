---
name: git-push-reminder
description: "Reminder before git push to review changes and run checks"
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

# Git Push Reminder Hook

Provides safety reminders before pushing code to ensure changes are reviewed and verified.

## What It Does

When you run `git push` with the Bash tool:

1. **Detects git push** - Monitors Bash tool for `git push` commands
2. **Prepends reminder** - Adds pre-push checklist to output
3. **Suggests verification** - Recommends running checks before push
4. **Prevents accidents** - Safety net against hasty pushes

## Output Format

Before git push output:

```markdown
## ⚠️ Git Push Safety Checklist

Before pushing to remote, verify:

1. **Review changes:**
   ```bash
   git diff origin/main..HEAD
   git log origin/main..HEAD --oneline
   ```

2. **Run quality checks:**
   ```bash
   npm run build    # Verify build
   npm test         # Run tests
   npm run lint     # Lint check
   ```

3. **Check commit messages:**
   - Clear and descriptive?
   - Follow conventions?

4. **Verify branch:**
   - Pushing to correct branch?
   - Not force-pushing to main/master?

---

[Original git push output follows below]
```

## Use Cases

- **Prevent hasty pushes** - Reminder to review changes
- **Quality enforcement** - Ensure checks run before push
- **Team safety** - Avoid breaking main branch
- **Best practices** - Reinforce good git workflow

## Requirements

No requirements - works with any git repository.

## Configuration

No configuration needed. The hook automatically:
- Detects `git push` commands
- Prepends safety checklist
- Preserves original push output

## Safety Features

**Warns about dangerous operations:**
- Force push (`--force`, `-f`)
- Push to protected branches (main, master, develop)
- Push without commits (may fail anyway)

**Example warning for force push:**

```markdown
## 🚨 FORCE PUSH DETECTED

You are about to **force push** which can overwrite history!

**Are you sure?**
- This can break other developers' work
- Only force push if you know what you're doing
- Consider `git push --force-with-lease` instead

To proceed, run the command again.
```

## Integration with ECC Workflows

Works seamlessly with ECC skills:
- **@git-workflow** - Part of safe git practices
- **@verification-loop** - Pre-push verification
- **@code-review** - Review before pushing

## Best Practices

Before pushing, always:

1. **Run tests locally**
2. **Review your changes** (`git diff`)
3. **Check commit messages**
4. **Verify branch name**
5. **Ensure CI will pass**

This hook reminds you to do these checks.

## Disabling

Plugin-managed hooks cannot be disabled individually. To disable all AGI Farm hooks, disable the plugin.

## See Also

- **pr-logger** hook - Logs PR creation
- **build-analyzer** hook - Build status analysis
- **quality-gate** hook - Pre-commit quality checks
