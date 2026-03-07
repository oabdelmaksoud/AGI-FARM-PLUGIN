# Agency-Agents Maintenance Guide

**Purpose**: Keep AGI Farm's Agency-Agents integration up-to-date with the upstream repository
**Repository**: https://github.com/msitarzewski/agency-agents
**Current Version**: cb8e568 (March 7, 2026)

---

## 🔄 Quick Update

```bash
# Check for updates (dry-run)
node scripts/update-agency-agents.js --dry-run

# Apply updates
node scripts/update-agency-agents.js

# Review and commit
git status
git add .
git commit -m "chore: Update Agency-Agents templates to latest version"
git push origin main
```

---

## 📅 Update Schedule

### Recommended Frequency

| Check Type | Frequency | Why |
|------------|-----------|-----|
| **Manual Check** | Monthly (1st of month) | Regular maintenance |
| **Before Major Release** | Before v1.x.0 releases | Ensure latest templates |
| **On Notification** | When GitHub notifies | New features or fixes |
| **Community Request** | As needed | User-requested updates |

### Setting Up Notifications

**Option 1: GitHub Watch**
1. Visit https://github.com/msitarzewski/agency-agents
2. Click "Watch" → "Custom" → "Releases"
3. Get email notifications for new releases

**Option 2: GitHub CLI**
```bash
# Watch the repository
gh repo view msitarzewski/agency-agents --web

# Check recent activity
gh repo view msitarzewski/agency-agents
```

**Option 3: RSS Feed**
- Subscribe to: `https://github.com/msitarzewski/agency-agents/commits/main.atom`
- Use RSS reader (Feedly, Inoreader, etc.)

---

## 🛠️ Update Methods

### Method 1: Automated Update Script (Recommended)

**Advantages**:
- Automated process
- Version tracking
- Dry-run support
- Commit history comparison

**Usage**:

```bash
# 1. Check for updates (no changes applied)
node scripts/update-agency-agents.js --dry-run

# Output:
# 📊 Updates available:
#    Current:  cb8e568
#    Latest:   a1b2c3d
#
# 📝 Changes since last update:
#    a1b2c3d Fix typo in Evidence Collector
#    d4e5f6g Add new Marketing Agent: LinkedIn Specialist
#    g7h8i9j Update Reality Checker workflow

# 2. Apply updates
node scripts/update-agency-agents.js

# 3. Review changes
git diff templates/agency-agents/

# 4. Commit if satisfied
git add .
git commit -m "chore: Update Agency-Agents templates (cb8e568 → a1b2c3d)"
git push origin main
```

**Force Update** (even if no changes):
```bash
node scripts/update-agency-agents.js --force
```

---

### Method 2: Manual Update

**When to use**:
- Automated script fails
- Need to review changes carefully
- Selective updates (only specific agents)

**Process**:

```bash
# 1. Clone latest Agency-Agents
cd /tmp
rm -rf agency-agents-latest
git clone https://github.com/msitarzewski/agency-agents.git agency-agents-latest
cd agency-agents-latest

# 2. Check what changed
git log -10 --oneline --since="1 month ago"

# 3. Compare with your templates
cd ~/.openclaw/workspace/AGI-FARM-PLUGIN
diff -r /tmp/agency-agents-latest/engineering templates/agency-agents/engineering/

# 4. Run conversion for updated agents
node scripts/convert-agency-agent.js --batch \
  /tmp/agency-agents-latest \
  templates/agency-agents

# 5. Review changes
git status
git diff templates/agency-agents/

# 6. Update version file
echo "COMMIT: $(cd /tmp/agency-agents-latest && git rev-parse HEAD)" > \
  agency-agents-resources/AGENCY_VERSION

# 7. Commit
git add .
git commit -m "chore: Update Agency-Agents templates to latest"
git push origin main
```

---

### Method 3: Selective Update (Specific Agents)

**Use case**: Only update specific agents that have changes

```bash
# 1. Clone latest
cd /tmp
git clone https://github.com/msitarzewski/agency-agents.git agency-agents-latest

# 2. Update specific agent
node scripts/convert-agency-agent.js \
  /tmp/agency-agents-latest/specialized/agents-orchestrator.md \
  templates/agency-agents/specialized/agents-orchestrator.md

# 3. Review and commit
git diff templates/agency-agents/specialized/agents-orchestrator.md
git add templates/agency-agents/specialized/agents-orchestrator.md
git commit -m "chore: Update Agents Orchestrator template"
```

---

## 🔍 What to Review After Updates

### 1. Breaking Changes

Check if updates break existing functionality:

```bash
# Search for major structural changes
git diff templates/agency-agents/ | grep -E "^-.*##|^\+.*##"

# Look for removed sections
git diff templates/agency-agents/ | grep "^-##"
```

**Common breaking changes**:
- Removed workflow sections
- Changed personality traits
- Updated critical rules
- Modified deliverable formats

### 2. New Agents

Check if new agents were added:

```bash
# List new files
git status | grep "new file.*templates/agency-agents"

# Count agents before/after
BEFORE=$(git show HEAD:templates/agency-agents/ | find . -name "*.md" | wc -l)
AFTER=$(find templates/agency-agents/ -name "*.md" | wc -l)
echo "Agents before: $BEFORE, after: $AFTER"
```

### 3. Documentation Updates

Check if README or guides changed:

```bash
cd /tmp/agency-agents-latest
git log --oneline --since="1 month ago" -- README.md CONTRIBUTING.md
```

---

## 📊 Version Tracking

### Current Version File

Location: `agency-agents-resources/AGENCY_VERSION`

Format:
```
REPOSITORY: https://github.com/msitarzewski/agency-agents
COMMIT: cb8e568bdaa4e9e44e5932e63f66169d631bbc40
DATE: 2026-03-07
UPDATED: 2026-03-07T05:00:00.000Z
INTEGRATED_VERSION: v1.6.0
```

### Checking Version

```bash
# Show current version
cat agency-agents-resources/AGENCY_VERSION | grep COMMIT

# Compare with latest
CURRENT=$(cat agency-agents-resources/AGENCY_VERSION | grep COMMIT | cut -d' ' -f2)
LATEST=$(cd /tmp/agency-agents-latest && git rev-parse HEAD)
echo "Current: $CURRENT"
echo "Latest: $LATEST"
```

---

## 🚨 Troubleshooting

### Issue 1: Conversion Script Fails

**Symptom**: `Error converting <file>.md`

**Solutions**:

1. **Check if file exists**:
   ```bash
   ls -la /tmp/agency-agents-latest/specialized/agents-orchestrator.md
   ```

2. **Test single file conversion**:
   ```bash
   node scripts/convert-agency-agent.js \
     /tmp/agency-agents-latest/specialized/agents-orchestrator.md \
     /tmp/test-output.md

   # Check output
   cat /tmp/test-output.md
   ```

3. **Check for invalid frontmatter**:
   ```bash
   head -20 /tmp/agency-agents-latest/specialized/agents-orchestrator.md
   ```

4. **Update conversion script** if frontmatter format changed

---

### Issue 2: No Updates Detected (But You Know There Are)

**Symptom**: Script says "Already up to date" but you see commits on GitHub

**Solutions**:

1. **Force update**:
   ```bash
   node scripts/update-agency-agents.js --force
   ```

2. **Manual version check**:
   ```bash
   cd /tmp/agency-agents-latest
   git log -1 --format="%H %cd" --date=short

   # Compare with AGENCY_VERSION
   cat agency-agents-resources/AGENCY_VERSION | grep COMMIT
   ```

3. **Clear temp directory**:
   ```bash
   rm -rf /tmp/agency-agents-update
   ```

---

### Issue 3: Merge Conflicts After Update

**Symptom**: You've customized agents and updates conflict

**Solutions**:

1. **Backup your customizations**:
   ```bash
   cp -r templates/agency-agents templates/agency-agents-backup
   ```

2. **Apply updates**:
   ```bash
   node scripts/update-agency-agents.js
   ```

3. **Manually merge changes**:
   ```bash
   # Compare files
   diff templates/agency-agents-backup/specialized/agents-orchestrator.md \
        templates/agency-agents/specialized/agents-orchestrator.md

   # Use your preferred merge tool
   code --diff templates/agency-agents-backup/... templates/agency-agents/...
   ```

4. **Document customizations** in agent SOUL.md files:
   ```markdown
   ## 🔧 AGI Farm Customizations

   - Modified workflow step 3 for better integration
   - Added project-specific context section
   - Adjusted communication style for our team

   **Last customized**: 2026-03-07
   **Based on commit**: cb8e568
   ```

---

## 🎯 Best Practices

### 1. Test Before Committing

```bash
# After update, test a converted template
cat templates/agency-agents/specialized/agents-orchestrator.md

# Check for:
# - Valid markdown formatting
# - Complete sections (Identity, Mission, Rules, Deliverables)
# - Proper AGI Farm metadata
# - Attribution section present
```

### 2. Update CHANGELOG

When updates bring significant changes:

```bash
# Add entry to CHANGELOG.md
## [1.6.1] - 2026-04-01

### 🔄 Agency-Agents Update
- Updated to commit a1b2c3d (April 1, 2026)
- New agents: LinkedIn Specialist (marketing/)
- Updated: Evidence Collector workflow improvements
- Fixed: Typo in Reality Checker documentation
```

### 3. Version Bumping Strategy

| Update Type | Version Bump | Example |
|-------------|--------------|---------|
| **New agents added** | Minor (1.6.0 → 1.7.0) | Adding LinkedIn Specialist |
| **Existing agents updated** | Patch (1.6.0 → 1.6.1) | Workflow improvements |
| **Breaking changes** | Major (1.6.0 → 2.0.0) | Removed agent categories |
| **Typo fixes only** | Patch (1.6.0 → 1.6.1) | Documentation fixes |

### 4. Communication

Notify users of significant updates:

```markdown
## 📢 Announcement: Agency-Agents Updated (v1.7.0)

We've updated our Agency-Agents integration to the latest version!

**New Agents**:
- LinkedIn Specialist (marketing/)

**Improvements**:
- Evidence Collector now supports video evidence
- Reality Checker has stricter quality gates

**How to Access**:
\`\`\`bash
openclaw plugins update agi-farm
ls templates/agency-agents/
\`\`\`
```

---

## 📈 Monitoring Repository Activity

### GitHub CLI Commands

```bash
# View recent commits
gh api repos/msitarzewski/agency-agents/commits | \
  jq -r '.[0:5] | .[] | "\(.sha[0:7]) \(.commit.message | split("\n")[0])"'

# Check for new releases
gh release list --repo msitarzewski/agency-agents

# View contributors
gh api repos/msitarzewski/agency-agents/contributors | \
  jq -r '.[] | "\(.login) - \(.contributions) commits"'
```

### Automated Monitoring (Advanced)

Create a GitHub Action in AGI Farm repo:

```yaml
# .github/workflows/check-agency-agents-updates.yml
name: Check Agency-Agents Updates

on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly on 1st at midnight
  workflow_dispatch:

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for updates
        run: |
          CURRENT=$(cat agency-agents-resources/AGENCY_VERSION | grep COMMIT | awk '{print $2}')
          LATEST=$(git ls-remote https://github.com/msitarzewski/agency-agents.git HEAD | awk '{print $1}')

          if [ "$CURRENT" != "$LATEST" ]; then
            echo "🔔 Agency-Agents updates available!"
            echo "Current: $CURRENT"
            echo "Latest: $LATEST"
            # Create an issue to notify maintainers
            gh issue create \
              --title "Agency-Agents Update Available" \
              --body "New commits detected in Agency-Agents repository. Run update script."
          else
            echo "✅ Up to date!"
          fi
```

---

## 🔗 Resources

- **Original Repository**: https://github.com/msitarzewski/agency-agents
- **Update Script**: `scripts/update-agency-agents.js`
- **Conversion Script**: `scripts/convert-agency-agent.js`
- **Version File**: `agency-agents-resources/AGENCY_VERSION`
- **Integration Guide**: `AGENCY_AGENTS_GUIDE.md`
- **Analysis**: `AGENCY_AGENTS_INTEGRATION_ANALYSIS.md`

---

## 📝 Update Checklist

Use this checklist for each update:

- [ ] Run `node scripts/update-agency-agents.js --dry-run`
- [ ] Review commit history and changes
- [ ] Apply updates: `node scripts/update-agency-agents.js`
- [ ] Test converted templates (spot check 3-5 agents)
- [ ] Review `git diff templates/agency-agents/`
- [ ] Update CHANGELOG.md if significant changes
- [ ] Bump version in package.json/openclaw.plugin.json if needed
- [ ] Commit: `git commit -m "chore: Update Agency-Agents templates"`
- [ ] Push: `git push origin main`
- [ ] Create release if version bumped
- [ ] Notify users if breaking changes or new agents

---

**Last Updated**: March 7, 2026
**Maintainer**: AGI Farm Team
**Contact**: GitHub Issues @ oabdelmaksoud/AGI-FARM-PLUGIN
