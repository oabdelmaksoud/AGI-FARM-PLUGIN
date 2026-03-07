# AgentShield Integration Proposal for AGI Farm

**Status**: Proposal
**Author**: AI Assistant
**Date**: 2026-03-06
**AgentShield Version**: 1.3.0
**AGI Farm Version**: 1.5.1

---

## Executive Summary

[AgentShield](https://github.com/affaan-m/agentshield) is a security auditor for AI agent configurations by [@affaan-m](https://github.com/affaan-m) (creator of Everything Claude Code). It provides **102 security rules** across 5 categories, scanning for hardcoded secrets, permission misconfigs, hook injection, MCP server risks, and agent prompt injection vectors.

This proposal outlines **3 integration approaches** for bringing AgentShield's security capabilities into AGI Farm, ranging from simple CLI integration to a dedicated 24/7 security monitoring agent.

---

## What is AgentShield?

### Core Capabilities

**Security Scanner** (102 rules):
- ✅ **Secrets Detection** (10 rules, 14 patterns) - API keys, tokens, credentials
- ✅ **Permission Audit** (10 rules) - Wildcard access, missing deny lists
- ✅ **Hook Analysis** (34 rules) - Command injection, data exfiltration
- ✅ **MCP Server Security** (23 rules) - High-risk servers, supply chain
- ✅ **Agent Config Review** (25 rules) - Prompt injection, auto-run instructions

**Additional Features**:
- ✅ Auto-fix engine (safe fixes only)
- ✅ Opus 4.6 deep analysis (3-agent adversarial pipeline)
- ✅ MiniClaw (sandboxed agent runtime)
- ✅ GitHub Action support
- ✅ Multiple output formats (terminal, JSON, markdown, HTML)

### Grading System

```
Score: 0-100 (A-F letter grade)
Severity: Critical > High > Medium > Low > Info
```

---

## Integration Approach Analysis

### Option 1: CLI Integration (Simplest)

**Implementation**: Add AgentShield as a CLI command in AGI Farm

**Structure**:
```bash
# New commands
agi-farm security-scan              # Scan team configuration
agi-farm security-scan --fix        # Auto-fix safe issues
agi-farm security-scan --opus       # Deep analysis with Opus 4.6
agi-farm security-report            # Generate HTML security report
```

**Technical Details**:
- Add `ecc-agentshield` as dependency in `package.json`
- Create `scripts/security.js` wrapper
- Scan targets:
  - `~/.openclaw/workspace/` - Team workspace
  - `~/.openclaw/agents/*/agent/` - Individual agent configs
  - `~/.openclaw/config/` - OpenClaw configuration
  - AGI Farm plugin hooks (if any)

**Pros**:
- ✅ Minimal code changes
- ✅ Quick to implement (~2 hours)
- ✅ Users run scans on-demand
- ✅ Integrates with existing CLI

**Cons**:
- ❌ No continuous monitoring
- ❌ Users must remember to run scans
- ❌ No proactive alerting

**Effort**: 🟢 Low (2-4 hours)

---

### Option 2: Dashboard Integration (Recommended)

**Implementation**: Add security monitoring to AGI Farm dashboard

**Features**:
1. **Security Score Widget** (Overview tab)
   - Real-time security score (0-100)
   - Letter grade (A-F)
   - Critical findings count
   - Last scan timestamp

2. **Security Tab** (New dedicated tab)
   - Full findings list by severity
   - Fix suggestions with auto-apply
   - Historical score chart
   - Agent-specific security analysis
   - Export reports (JSON, HTML, Markdown)

3. **Background Scanner** (Dashboard server)
   - Automatic scan on startup
   - Scheduled rescans (configurable: hourly/daily)
   - Scan on configuration changes (watch `.openclaw/`)
   - Real-time SSE updates to dashboard

4. **Security Alerts** (Integration with existing Alerts tab)
   - Critical findings → HITL alerts
   - New vulnerabilities → Dashboard notifications
   - Score drops → Email/Slack (if configured)

**Technical Architecture**:

```
AGI Farm Dashboard Server (server/dashboard.js)
├── services/
│   └── security.js (NEW)
│       ├── scanTeamConfig()
│       ├── schedulePeriodicScans()
│       ├── watchConfigChanges()
│       └── autoFixSafeIssues()
├── api/
│   └── /api/security (NEW)
│       ├── GET /api/security/score
│       ├── GET /api/security/findings
│       ├── POST /api/security/scan
│       ├── POST /api/security/fix/:findingId
│       └── GET /api/security/report
└── dashboard-react/
    └── components/tabs/Security.jsx (NEW)
```

**Dashboard UI Mockup**:

```
┌──────────────────────────────────────────────────────────────────┐
│ 🦅 AGI Ops Room                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Overview │ Agents │ Tasks │ Projects │ Crons │ HITL │ Security  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🛡️ Security Status                                             │
│                                                                  │
│  Grade: B (82/100)                           Last scan: 2m ago  │
│  ████████████████░░░░                        [Scan Now]         │
│                                                                  │
│  ● CRITICAL (1)                                                 │
│    Hardcoded API key in agent CLAUDE.md                         │
│    sage/agent/CLAUDE.md:42                                      │
│    [Auto-Fix] [View Details]                                    │
│                                                                  │
│  ● HIGH (3)                                                     │
│    Overly permissive Bash(*) in settings                        │
│    ~/.openclaw/config/settings.json                             │
│    [Review] [Ignore]                                            │
│                                                                  │
│  ✓ Medium (5) │ ✓ Low (2) │ ✓ Info (4)                         │
│                                                                  │
│  [Export HTML Report] [View Full Details] [Configure Scans]    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Continuous monitoring
- ✅ Visual security posture
- ✅ Proactive alerts
- ✅ Integrates with existing dashboard
- ✅ Auto-fix from UI
- ✅ Historical tracking

**Cons**:
- ⚠️ Moderate implementation effort
- ⚠️ Dashboard rebuild required
- ⚠️ Additional dashboard server load

**Effort**: 🟡 Medium (1-2 days)

---

### Option 3: Dedicated Security Agent (Most Comprehensive)

**Implementation**: Create "Vigil Pro" - a 24/7 security monitoring agent

**Agent Profile**:
```yaml
Name: Vigil Pro
Role: Security Auditor & Compliance Officer
Workspace: ~/.openclaw/workspace/agents-workspaces/security-auditor
Cron Schedule: every 1h
Skills:
  - @security-scan (AgentShield wrapper)
  - @security-review (manual code review)
  - @compliance-check (policy enforcement)
  - @incident-response (threat mitigation)
```

**Responsibilities**:

1. **Continuous Security Scanning**
   - Hourly AgentShield scans
   - Monitor `~/.openclaw/` for changes
   - Track security score trends
   - Compare against baseline

2. **Proactive Threat Detection**
   - New hardcoded secrets
   - Permission escalations
   - Suspicious hook modifications
   - Unknown MCP server installations
   - Prompt injection attempts in agent configs

3. **Automated Response**
   - Auto-fix safe issues (with approval)
   - Create HITL requests for critical findings
   - Send alerts to team lead (Cooper)
   - Generate incident reports
   - Recommend remediation steps

4. **Security Reporting**
   - Daily security summary to Cooper
   - Weekly compliance report
   - Monthly security posture analysis
   - Audit trail in `SECURITY_AUDIT.jsonl`

5. **Integration with Opus 4.6**
   - Run adversarial analysis on critical findings
   - Deep threat modeling
   - Attack chain detection
   - Prioritized remediation roadmap

**Cron Job Configuration**:
```json
{
  "id": "vigil-pro-hourly-scan",
  "name": "Security Scan",
  "schedule": "every 1h",
  "agent": "vigil-pro",
  "task": "Run AgentShield scan, analyze findings, auto-fix safe issues, alert on critical",
  "target": "isolated"
}
```

**Message Flow**:

```
Vigil Pro (hourly scan)
    ↓
AgentShield scan complete
    ↓
Found 3 critical findings
    ↓
Auto-fix 1 (hardcoded secret → env var)
    ↓
Create HITL for 2 (permission escalation)
    ↓
Send message to Cooper:
"🛡️ Security Alert: 2 critical findings require review"
    ↓
Cooper reviews HITL, approves/rejects fixes
    ↓
Vigil Pro applies approved fixes
    ↓
Post-scan verification
    ↓
Update security score in dashboard
```

**Technical Implementation**:

1. **New Agent Creation**
   - SOUL.md with security focus
   - Specialized ECC skills (@security-scan, @security-review)
   - Access to AgentShield CLI
   - Read/write permissions for config files

2. **AgentShield Skill** (`ecc-resources/skills/security-scan.md`)
   ```markdown
   # Security Scan Skill

   Use AgentShield to scan the team's configuration for vulnerabilities.

   ## Usage
   1. Run: npx ecc-agentshield scan --path ~/.openclaw --format json
   2. Parse JSON output
   3. Categorize findings by severity
   4. Auto-fix safe issues (if approved)
   5. Create HITL for critical/high findings
   6. Report to Cooper
   ```

3. **Comms Integration**
   - Vigil Pro → Cooper (security alerts)
   - Vigil Pro → All agents (security advisories)
   - Cooper → Vigil Pro (approval requests)

4. **Dashboard Integration**
   - Vigil Pro status in Agents tab
   - Security tab shows Vigil Pro's latest findings
   - HITL requests from Vigil Pro highlighted

**Pros**:
- ✅ Fully automated 24/7 monitoring
- ✅ Proactive threat detection
- ✅ Agent-driven remediation
- ✅ Integrates with team workflow
- ✅ Leverages Opus 4.6 for deep analysis
- ✅ Audit trail and compliance
- ✅ Minimal user intervention

**Cons**:
- ❌ High implementation effort
- ❌ Additional agent overhead
- ❌ Complexity in agent orchestration
- ❌ Requires careful permission scoping

**Effort**: 🔴 High (3-5 days)

---

## Recommended Approach: Hybrid (Options 1 + 2)

**Phase 1** (Week 1): CLI Integration
- Add `agi-farm security-scan` command
- Users can run on-demand scans
- Quick win, minimal effort

**Phase 2** (Week 2-3): Dashboard Integration
- Add Security tab to dashboard
- Background scanner with SSE updates
- Auto-fix UI
- Security alerts integration

**Phase 3** (Optional): Dedicated Agent
- If continuous monitoring proves valuable
- Create Vigil Pro agent
- Full automation

---

## Implementation Plan

### Phase 1: CLI Integration (2-4 hours)

**Step 1**: Add dependency
```bash
cd ~/.openclaw/extensions/agi-farm
npm install ecc-agentshield
```

**Step 2**: Create `scripts/security.js`
```javascript
#!/usr/bin/env node
import { scan } from 'ecc-agentshield';
import path from 'path';
import os from 'os';

const scanPaths = [
  path.join(os.homedir(), '.openclaw/workspace'),
  path.join(os.homedir(), '.openclaw/agents'),
  path.join(os.homedir(), '.openclaw/config'),
];

console.log('🛡️ AGI Farm Security Scanner\n');

for (const scanPath of scanPaths) {
  console.log(`Scanning: ${scanPath}`);
  const result = scan(scanPath);
  // Format and display results
}
```

**Step 3**: Add CLI commands
```json
// package.json
{
  "bin": {
    "agi-farm-security": "scripts/security.js"
  }
}
```

**Step 4**: Test
```bash
agi-farm-security scan
agi-farm-security scan --fix
agi-farm-security scan --opus
```

### Phase 2: Dashboard Integration (1-2 days)

**Step 1**: Create security service
- `server/services/security.js`
- Scan functions
- Auto-fix engine
- File watchers

**Step 2**: Add API endpoints
- `/api/security/score` - Current security score
- `/api/security/findings` - All findings
- `/api/security/scan` - Trigger scan
- `/api/security/fix/:id` - Apply fix

**Step 3**: Create Security tab UI
- `dashboard-react/src/components/tabs/Security.jsx`
- Score widget
- Findings list
- Fix buttons
- Report export

**Step 4**: Integrate with SSE
- Push security updates to dashboard
- Real-time score changes
- New finding alerts

**Step 5**: Add to Overview
- Security score widget
- Critical findings count

---

## Security Considerations

### AgentShield Installation Safety

✅ **Safe to install**:
- MIT licensed, open source
- Created by @affaan-m (ECC author, trusted)
- Part of Everything Claude Code ecosystem
- 1,280 tests, 98% coverage
- No external runtime dependencies (MiniClaw)

### Permissions Required

**For CLI integration**:
- Read access to `~/.openclaw/`
- No write access needed (unless using `--fix`)

**For dashboard integration**:
- Read access to `~/.openclaw/`
- Write access for auto-fix (user-approved only)
- File watch access for change detection

**For dedicated agent**:
- Same as dashboard integration
- Plus: ability to create HITL requests
- Plus: send messages to other agents

### Data Privacy

- AgentShield scans **locally only**
- No data sent to external servers (unless using `--opus` flag)
- Opus 4.6 analysis requires `ANTHROPIC_API_KEY` (opt-in)
- Scan results stored in AGI Farm workspace

---

## Cost-Benefit Analysis

| Approach | Implementation Cost | Maintenance Cost | Security Value | User Experience |
|----------|-------------------|------------------|----------------|-----------------|
| **CLI Only** | 🟢 Low (2-4h) | 🟢 Low | 🟡 Medium (manual) | 🟡 Medium (manual scans) |
| **Dashboard** | 🟡 Medium (1-2d) | 🟡 Medium | 🟢 High (continuous) | 🟢 High (visual, automated) |
| **Agent** | 🔴 High (3-5d) | 🔴 High | 🟢 Very High (24/7) | 🟢 High (fully automated) |
| **Hybrid (1+2)** | 🟡 Medium (2-3d) | 🟡 Medium | 🟢 High | 🟢 High |

---

## Recommendation

**Start with Hybrid Approach (CLI + Dashboard)**:

1. **Immediate** (this session): Install and test AgentShield CLI
2. **Week 1**: Implement CLI integration
3. **Week 2-3**: Add dashboard security tab
4. **Week 4+**: Evaluate need for dedicated agent based on usage

This approach provides:
- ✅ Quick wins (CLI in hours)
- ✅ Continuous monitoring (dashboard in days)
- ✅ Flexibility to add agent later
- ✅ Progressive enhancement
- ✅ User feedback at each stage

---

## Next Steps

### Option A: Prototype CLI Integration Now

```bash
# Install AgentShield
cd ~/.openclaw/extensions/agi-farm
npm install ecc-agentshield

# Test scan
npx ecc-agentshield scan --path ~/.openclaw/workspace

# Create wrapper script
# Integrate into AGI Farm CLI
```

### Option B: Plan Dashboard Integration

- Review dashboard architecture
- Design Security tab UI
- Plan API endpoints
- Estimate timeline

### Option C: Create Dedicated Agent

- Design Vigil Pro agent profile
- Create security scanning skills
- Set up cron jobs
- Implement comms flow

---

## Questions for User

1. **Urgency**: How critical is security monitoring for your team?
2. **Automation Level**: Prefer manual scans or continuous monitoring?
3. **Agent Preference**: Would a dedicated security agent be valuable?
4. **Opus Access**: Do you have `ANTHROPIC_API_KEY` for deep analysis?
5. **Timeline**: When should this be implemented?

---

## Appendix: AgentShield Documentation

### Quick Start
```bash
# Scan your OpenClaw config
npx ecc-agentshield scan

# Auto-fix safe issues
npx ecc-agentshield scan --fix

# Deep analysis with Opus 4.6
npx ecc-agentshield scan --opus --stream

# Generate HTML report
npx ecc-agentshield scan --format html > security-report.html
```

### Output Example
```
  AgentShield Security Report

  Grade: B (82/100)

  ● CRITICAL  Hardcoded Anthropic API key
    CLAUDE.md:13
    Evidence: sk-ant-a...cdef
    Fix: Replace with environment variable reference [auto-fixable]

  ● HIGH  Overly permissive allow rule: Bash(*)
    settings.json
    Evidence: Bash(*)
    Fix: Restrict to specific commands

  Summary
  Files scanned: 23
  Findings: 12 total — 1 critical, 3 high, 5 medium, 2 low, 1 info
  Auto-fixable: 4 (use --fix)
```

---

**End of Proposal**

Let me know which approach you'd like to pursue!
