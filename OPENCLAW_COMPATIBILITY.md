# OpenClaw Compatibility Guide

This document explains how the AGI Farm plugin ensures compatibility with OpenClaw and how to handle version updates.

## Overview

AGI Farm is designed to be compatible with OpenClaw's plugin API. As OpenClaw evolves, we use automated testing and version checking to ensure continued compatibility.

---

## Compatibility Strategy

### 1. **Automated Weekly Testing**
- **GitHub Actions**:
  - `.github/workflows/openclaw-compatibility.yml` - Basic weekly testing
  - `.github/workflows/openclaw-compatibility-enhanced.yml` - Advanced multi-version testing
- **Schedule**: Every Monday at 9 AM UTC
- **Tests**: Plugin against multiple OpenClaw versions (latest, previous, oldest-supported, beta)
- **Performance**: Benchmarks load time and validation time
- **API Scanning**: Detects usage of deprecated OpenClaw APIs
- **Notification**: Auto-creates GitHub issue if incompatibility detected
- **Auto-Fix**: Can automatically create PRs with compatibility fixes

### 2. **Version Checking**
- **Script**: `scripts/validate-config.js`
- **Checks**: Minimum OpenClaw version (1.0.0+)
- **Warns**: If using older OpenClaw version
- **Errors**: If using known incompatible version

### 3. **Dependency Tracking**
- **File**: `package.json` - `peerDependencies` (when available)
- **Purpose**: npm warns users about version mismatches

---

## Supported OpenClaw Versions

| AGI Farm Version | Min OpenClaw | Max Tested | Status |
|------------------|-------------|------------|--------|
| **1.5.0** (current) | 1.0.0 | Latest | ✅ Active |
| 1.4.0 | 1.0.0 | 1.x.x | ✅ Maintained |
| 1.3.x | 1.0.0 | 1.x.x | ⚠️ EOL |

**Legend:**
- ✅ **Active** - Fully supported, receives updates
- ✅ **Maintained** - Security fixes only
- ⚠️ **EOL** - End of life, no updates

---

## Automated Compatibility Testing

### What Gets Tested

**Every week, the GitHub Actions test:**

#### 1. **Multi-Version Testing**
   - **Latest stable** - Most recent OpenClaw release
   - **Previous stable** - One version behind latest
   - **Oldest supported** - Minimum version (1.0.0)
   - **Beta/RC** - Pre-release versions (if available)

#### 2. **Plugin Installation**
   - Can OpenClaw install the plugin?
   - Does the plugin appear in `openclaw plugins list`?

#### 3. **Plugin Loading**
   - Does OpenClaw successfully load the plugin?
   - Are hooks registered correctly?
   - Does loading complete within performance threshold?

#### 4. **Command Execution**
   - Do all CLI commands run without errors?
   - `agi-farm setup --help`
   - `agi-farm-status --help`
   - `agi-farm-dashboard --help`

#### 5. **Validation Script**
   - Does `scripts/validate-config.js` pass?
   - Are all checks working correctly?
   - Does validation complete within 3000ms threshold?

#### 6. **OpenClaw CLI Integration**
   - Can the plugin call `openclaw agents list`?
   - Can it create agents via OpenClaw CLI?

#### 7. **Performance Benchmarking**
   - **Plugin Load Time** - Should complete <5000ms
   - **Validation Time** - Should complete <3000ms
   - **Command Execution** - Commands should start <2000ms
   - Warnings generated if thresholds exceeded

#### 8. **API Deprecation Scanning**
   - Scans codebase for deprecated OpenClaw APIs
   - Provides replacement suggestions
   - Fails if critical deprecated APIs found
   - Warns if soft-deprecated APIs found

### How to Run Manually

#### Basic Compatibility Check

```bash
# Run basic compatibility check
gh workflow run openclaw-compatibility.yml

# Test against specific OpenClaw version
gh workflow run openclaw-compatibility.yml \
  -f openclaw_version=1.2.3

# View latest results
gh run list --workflow=openclaw-compatibility.yml
```

#### Enhanced Multi-Version Testing

```bash
# Run enhanced compatibility testing (all versions)
gh workflow run openclaw-compatibility-enhanced.yml

# Run with specific options
gh workflow run openclaw-compatibility-enhanced.yml \
  -f test_beta_versions=true \
  -f create_pr_on_failure=true \
  -f performance_threshold_ms=5000

# Test only critical versions (latest + oldest)
gh workflow run openclaw-compatibility-enhanced.yml \
  -f test_beta_versions=false

# View enhanced test results
gh run list --workflow=openclaw-compatibility-enhanced.yml

# Download performance benchmark report
gh run download <run-id> -n performance-report
```

### When Tests Fail

If automated tests detect incompatibility:

1. **GitHub Issue Created** - Auto-filed with details
2. **Workflow Logs** - Full test output available
3. **Artifact Uploaded** - Compatibility report and performance benchmarks saved
4. **Pull Request Created** (optional) - Automated fix PR generated

**Example Issue:**
```markdown
⚠️ Incompatibility detected with OpenClaw 2.0.0

The weekly compatibility check failed.

Plugin Version: v1.5.0
OpenClaw Version: 2.0.0
Workflow Run: https://github.com/.../actions/runs/...

Failed Tests:
- ❌ Plugin loading (deprecated API: old_hook_register)
- ⚠️ Performance regression (load time: 6200ms, threshold: 5000ms)
- ⚠️ Deprecated API found: openclaw.v1.createAgent (use openclaw.agents.create)

Next Steps:
1. Review workflow logs
2. Check performance benchmark report
3. Review API deprecation suggestions
4. Update plugin code
5. Add version constraints if needed

Suggested Fixes:
- Replace `old_hook_register()` with `registerHook()`
- Optimize plugin initialization for faster load time
- Update to new agents API: openclaw.agents.create()
```

**Automated PR (if enabled):**
```markdown
🤖 fix: OpenClaw 2.0.0 compatibility updates

Automated compatibility fix generated by enhanced workflow.

Changes:
- Updated hook registration API (old_hook_register → registerHook)
- Migrated to new agents API (openclaw.v1.createAgent → openclaw.agents.create)
- Added version constraint: openclawVersion: ">=1.0.0 <3.0.0"

Test Results:
- ✅ All compatibility tests pass with OpenClaw 2.0.0
- ✅ Performance benchmarks within thresholds
- ✅ No deprecated APIs detected

This PR was auto-generated. Please review and test before merging.
```

---

## Manual Version Checking

### Check Your OpenClaw Version

```bash
openclaw --version
```

### Check Plugin Compatibility

```bash
# Run validation script
npm run validate

# Or directly
node scripts/validate-config.js
```

**Output Example:**
```
🔍 AGI Farm — Validating Configuration

✓ OpenClaw directory found
✓ OpenClaw version: openclaw/1.2.3
✓ Node.js v20.10.0 (>= 18)
✓ mcporter installed (1.0.0)

✅ Configuration Valid
```

**With Warning:**
```
⚠  Warnings:

   OpenClaw 0.9.0 is older than recommended 1.0.0
   Consider upgrading: npm install -g openclaw@latest
```

---

## Handling OpenClaw Updates

### When OpenClaw Releases New Version

**For Plugin Users:**

1. **Check Compatibility First**
   ```bash
   # Before upgrading OpenClaw
   openclaw --version  # Note current version

   # Check AGI Farm compatibility matrix above
   # Or wait for weekly compatibility test results
   ```

2. **Upgrade OpenClaw**
   ```bash
   npm install -g openclaw@latest
   ```

3. **Test AGI Farm**
   ```bash
   # Run validation
   npm run validate

   # Test wizard
   agi-farm setup --help

   # Check plugin loads
   openclaw plugins list | grep agi-farm
   ```

4. **Report Issues**
   - If incompatibility found, create issue at:
   - https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues

**For Plugin Maintainers:**

1. **Monitor Compatibility Tests**
   - Check GitHub Actions weekly
   - Review auto-created issues

2. **Update Plugin if Needed**
   - Fix breaking changes
   - Add version constraints
   - Update documentation

3. **Release New Version**
   - Bump plugin version
   - Update CHANGELOG
   - Publish npm package

---

## Known Incompatibilities

### Deprecated APIs

**None currently** - AGI Farm uses stable OpenClaw APIs

When OpenClaw deprecates APIs, they'll be listed here:

| API | Deprecated In | Alternative | AGI Farm Status |
|-----|---------------|-------------|-----------------|
| _(none)_ | - | - | - |

### Breaking Changes

**None currently** - AGI Farm compatible with all OpenClaw 1.x

When breaking changes occur, they'll be listed here:

| OpenClaw Version | Breaking Change | AGI Farm Fix | Status |
|------------------|----------------|--------------|--------|
| _(none)_ | - | - | - |

---

## Version Constraint Configuration

### package.json (Recommended)

Add `peerDependencies` when OpenClaw publishes to npm:

```json
{
  "peerDependencies": {
    "openclaw": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "openclaw": {
      "optional": false
    }
  }
}
```

**Benefits:**
- npm warns users about version mismatches
- Clear dependency declaration
- Package managers can auto-resolve conflicts

### openclaw.plugin.json

Add minimum version requirement:

```json
{
  "id": "agi-farm",
  "version": "1.5.0",
  "openclawVersion": ">=1.0.0",
  "engines": {
    "openclaw": ">=1.0.0 <3.0.0"
  }
}
```

**Benefits:**
- OpenClaw can enforce compatibility
- Clear version requirements
- Prevents loading on incompatible versions

---

## Testing Strategy

### Pre-Release Checklist

Before releasing new AGI Farm version:

- [ ] Test with latest OpenClaw stable
- [ ] Test with previous OpenClaw stable
- [ ] Run full test suite
- [ ] Check for OpenClaw changelog
- [ ] Update compatibility matrix
- [ ] Update OPENCLAW_COMPATIBILITY.md

### Integration Test Matrix

| Test Scenario | OpenClaw Version | Node.js | Expected |
|---------------|------------------|---------|----------|
| Plugin load | Latest | 20.x | ✅ Pass |
| Plugin load | Previous | 20.x | ✅ Pass |
| Setup wizard | Latest | 20.x | ✅ Pass |
| Dashboard | Latest | 20.x | ✅ Pass |
| CLI commands | Latest | 20.x | ✅ Pass |

### Manual Testing Procedure

```bash
# 1. Install specific OpenClaw version
npm install -g openclaw@1.2.3

# 2. Clear existing OpenClaw data
rm -rf ~/.openclaw

# 3. Initialize OpenClaw
openclaw init

# 4. Install AGI Farm plugin
openclaw plugins install agi-farm

# 5. Run setup wizard
agi-farm setup
# Answer prompts, create team

# 6. Test dashboard
agi-farm-dashboard
# Visit http://localhost:8080

# 7. Test agent creation
openclaw agents list

# 8. Verify everything works
agi-farm-status
```

---

## Troubleshooting

### Error: Plugin fails to load

**Symptom:**
```
Error: AGI Farm plugin failed to load
```

**Solution:**
1. Check OpenClaw version: `openclaw --version`
2. Check compatibility matrix above
3. Upgrade OpenClaw: `npm install -g openclaw@latest`
4. Reinstall plugin: `openclaw plugins update agi-farm`

### Error: Command not found

**Symptom:**
```
agi-farm: command not found
```

**Solution:**
1. Check plugin installed: `openclaw plugins list`
2. Check PATH includes npm bin: `npm bin -g`
3. Reinstall globally: `npm install -g agi-farm`

### Warning: OpenClaw version old

**Symptom:**
```
⚠ OpenClaw 0.9.0 is older than recommended 1.0.0
```

**Solution:**
```bash
npm install -g openclaw@latest
```

### Error: Known incompatibility

**Symptom:**
```
❌ OpenClaw 2.0.0-beta has known incompatibilities
```

**Solution:**
1. Downgrade OpenClaw to stable: `npm install -g openclaw@1.x`
2. Wait for AGI Farm update
3. Check GitHub issues for status

---

## Compatibility Roadmap

### Current (v1.5.0)
- ✅ OpenClaw 1.x support
- ✅ Automated weekly testing
- ✅ Version checking in validation

### Completed (v1.5.1)
- ✅ peerDependencies in package.json
- ✅ openclawVersion in plugin manifest
- ✅ Multi-version compatibility testing
- ✅ Automated API deprecation scanning
- ✅ Performance regression testing
- ✅ Automated PR creation for fixes
- ✅ OpenClaw beta testing integration

### Planned (v1.6.0)
- 🔄 Integration with OpenClaw plugin registry
- 🔄 Automated changelog generation from compatibility reports
- 🔄 User notification system for compatibility updates

### Future (v2.0.0)
- 📋 Predictive compatibility analysis
- 📋 Automated migration guides
- 📋 Cross-version feature detection

---

## Contributing

### Reporting Compatibility Issues

If you encounter OpenClaw compatibility issues:

1. **Check existing issues**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
2. **Gather information**:
   - AGI Farm version: `agi-farm --version`
   - OpenClaw version: `openclaw --version`
   - Node.js version: `node --version`
   - Error messages or logs
3. **Create issue** with template:

```markdown
## Compatibility Issue

**AGI Farm Version:** 1.5.0
**OpenClaw Version:** X.Y.Z
**Node.js Version:** vX.Y.Z
**OS:** macOS / Linux / Windows

### Error
[Paste error message or describe issue]

### Steps to Reproduce
1. ...
2. ...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]
```

### Fixing Compatibility Issues

1. Fork repository
2. Create branch: `git checkout -b fix/openclaw-XYZ-compat`
3. Make changes (update APIs, add version checks, etc.)
4. Test thoroughly
5. Update documentation (this file, CHANGELOG)
6. Submit PR with description

---

## References

- **OpenClaw Docs**: https://docs.openclaw.ai
- **OpenClaw Changelog**: https://github.com/openclaw/openclaw/releases
- **AGI Farm Issues**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/issues
- **Compatibility Tests**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/actions/workflows/openclaw-compatibility.yml

---

**Last Updated**: 2026-03-06
**Next Review**: Weekly (automated)
**Maintainer**: @oabdelmaksoud
