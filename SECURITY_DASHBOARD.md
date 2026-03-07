# Security Dashboard Integration

**Status**: ✅ Complete
**Version**: 1.5.2
**Date**: March 7, 2026

## Overview

The AGI Farm plugin now includes a comprehensive security monitoring dashboard that provides real-time visibility into your OpenClaw workspace security posture using AgentShield.

## Features

### 🎯 Visual Security Grade Display
- **Letter grade** (A-F) with color-coded visual indicator
- **Numeric score** (0-100) with progress bar
- **Trend indicator** (improving ↗, stable →, degrading ↘)
- **Last scan timestamp** with relative time display

### 🔍 Findings Summary
Five severity-level cards showing count of issues:
- **Critical** (red) - Immediate action required
- **High** (orange) - High priority fixes needed
- **Medium** (amber) - Medium priority items
- **Low** (muted) - Low priority improvements
- **Info** (cyan) - Informational findings

### ⚡ Action Buttons
- **Scan Now** - Trigger immediate security scan
- **Auto-Fix** - Automatically fix safe issues
- Both show loading states during execution

### 📊 Security Status Messages
- Current security posture (OK, NEEDS_ATTENTION)
- Next scheduled scan time
- Helpful context about scan results

### 📚 What Gets Scanned
Informational card explaining AgentShield's 5 scan categories:
1. **Prompt Injection** - Detects malicious prompt patterns
2. **Tool Safety** - Validates tool configurations
3. **File Safety** - Checks filesystem access controls
4. **Network Safety** - Scans network policies
5. **Secrets Detection** - Finds hardcoded credentials

## Architecture

### Backend Components

#### 1. Security Service (`server/services/security.js`)
Core service providing security operations:

```javascript
// Main Functions
- runSecurityScan(options)       // Execute AgentShield scan
- updateSecurityStatus(results)  // Update SECURITY_STATUS.json
- getSecurityStatus()            // Read current status
- scanAndUpdate(options)         // Scan + update in one call
- autoFixSecurityIssues()        // Run scan with --fix flag
- getSecurityHistory()           // Retrieve scan history
```

**Key Features**:
- Executes `npx ecc-agentshield scan` commands
- Parses JSON output from AgentShield
- Maintains scan history (last 30 scans)
- Calculates security trends (improving/stable/degrading)
- Handles errors gracefully

#### 2. API Endpoints (`server/dashboard.js`)

```javascript
GET  /api/security/status   // Get current security status
POST /api/security/scan     // Trigger security scan (with optional fix)
POST /api/security/fix      // Auto-fix security issues
GET  /api/security/history  // Get scan history
```

**Security Features**:
- CSRF token protection on all POST endpoints
- Rate limiting on action endpoints (5 req/min)
- Error handling with meaningful messages

### Frontend Components

#### 1. Security Tab (`dashboard-react/src/components/tabs/Security.jsx`)

**Component Structure**:
```jsx
<SecurityTab>
  <SecurityGradeCard>
    <GradeDisplay />
    <ProgressBar />
    <TrendIndicator />
    <ActionButtons />
  </SecurityGradeCard>

  <FindingsSummary>
    <SeverityCard severity="critical" />
    <SeverityCard severity="high" />
    <SeverityCard severity="medium" />
    <SeverityCard severity="low" />
    <SeverityCard severity="info" />
  </FindingsSummary>

  <StatusMessages>
    <CurrentStatus />
    <NextScanTime />
  </StatusMessages>

  <WhatGetsScanned>
    <CategoryList />
  </WhatGetsScanned>
</SecurityTab>
```

**State Management**:
```javascript
const [securityStatus, setSecurityStatus] = useState(null);
const [loading, setLoading] = useState(true);
const [scanning, setScanning] = useState(false);
const [fixing, setFixing] = useState(false);
const [error, setError] = useState(null);
```

**API Integration**:
- Uses `apiGet()` and `apiPost()` from `lib/api.js`
- Handles CSRF tokens automatically
- Error handling with user-friendly messages
- Automatic status refresh after actions

#### 2. App Navigation (`dashboard-react/src/App.jsx`)

Security tab registered in main navigation:
```javascript
const TABS = [
  'Overview', 'Agents', 'Tasks', 'Projects',
  'Jobs', 'Approvals', 'Usage',
  'Crons', 'HITL', 'Alerts',
  'Velocity', 'Budget', 'OKRs',
  'Knowledge', 'Comms', 'Security',  // <-- New
  'R&D', 'Broadcast', 'Settings',
];

const TAB_COMPONENTS = {
  // ... other tabs
  'Security': Security,
  // ... other tabs
};
```

## Data Flow

### 1. Initial Load
```
User opens Security tab
  → SecurityTab component mounts
  → useEffect() calls loadSecurityStatus()
  → apiGet('/api/security/status')
  → Server reads ~/.openclaw/workspace/SECURITY_STATUS.json
  → Returns status data
  → Component renders grade, findings, status
```

### 2. Manual Scan
```
User clicks "Scan Now"
  → handleScan() called
  → apiPost('/api/security/scan', { fix: false })
  → Server calls runSecurityScan()
  → Executes: npx ecc-agentshield scan --path ~/.openclaw --format json
  → AgentShield returns scan results
  → Server calls updateSecurityStatus()
  → Writes SECURITY_STATUS.json
  → Returns updated status
  → Component updates display
```

### 3. Auto-Fix
```
User clicks "Auto-Fix"
  → handleFix() called
  → apiPost('/api/security/fix')
  → Server calls autoFixSecurityIssues()
  → Executes: npx ecc-agentshield scan --path ~/.openclaw --format json --fix
  → AgentShield fixes safe issues
  → Server updates SECURITY_STATUS.json
  → Component calls loadSecurityStatus()
  → Display refreshes with new status
```

## File Structure

```
.openclaw/
├── extensions/agi-farm/
│   ├── server/
│   │   ├── dashboard.js                  # API endpoints
│   │   └── services/
│   │       └── security.js               # Security service
│   └── dashboard-react/
│       ├── src/
│       │   ├── components/tabs/
│       │   │   └── Security.jsx          # Security tab component
│       │   ├── lib/
│       │   │   └── api.js                # API client (apiGet, apiPost)
│       │   └── App.jsx                   # Main app with tab routing
│       └── dist/
│           └── assets/
│               └── Security-DIjUKIjh.js  # Built Security tab
└── workspace/
    └── SECURITY_STATUS.json              # Current security status
```

## Security Status File Schema

```json
{
  "timestamp": "2026-03-07T04:31:00.000Z",
  "grade": "B",
  "score": 85,
  "findings": {
    "critical": 0,
    "high": 1,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "details": {
    "high_findings": [
      {
        "rule": "Description of finding",
        "location": "File path and line number",
        "evidence": "Code snippet",
        "status": "reviewed",
        "notes": "Explanation"
      }
    ]
  },
  "auto_fixed": 0,
  "status": "OK",
  "trend": "stable",
  "last_scan": "2026-03-07T04:31:00.000Z",
  "next_scan": "2026-03-07T14:00:00.000Z",
  "scan_history": [
    {
      "timestamp": "2026-03-07T04:31:00.000Z",
      "grade": "B",
      "score": 85,
      "findings_count": 1
    }
  ],
  "notes": "Additional context"
}
```

## Integration with Daily Cron

The Security dashboard works in conjunction with Vigil's daily security scan cron job:

**Cron Schedule**: Daily at 9:00 AM EST
**Agent**: Vigil (Quality Assurance)
**Actions**:
1. Runs AgentShield scan
2. Updates SECURITY_STATUS.json
3. Creates HITL alerts if grade < B
4. Logs summary to outbox for Cooper

Users can view the latest scan results in the Security tab at any time.

## Testing

### Manual Testing Checklist

1. **Navigate to Security Tab**
   - Open dashboard: http://127.0.0.1:8080
   - Click "Security" in navigation
   - Verify tab loads without errors

2. **Verify Grade Display**
   - Check letter grade (A-F) displays
   - Check numeric score shows
   - Check progress bar renders correctly
   - Check trend indicator appears

3. **Check Findings Summary**
   - Verify 5 severity cards display
   - Check counts match SECURITY_STATUS.json
   - Verify color coding (critical=red, high=orange, etc.)

4. **Test Scan Button**
   - Click "Scan Now"
   - Verify button shows "Scanning..." state
   - Wait for scan to complete (~15-30 seconds)
   - Check status updates

5. **Test Auto-Fix Button**
   - Click "Auto-Fix"
   - Verify button shows "Fixing..." state
   - Wait for fix to complete
   - Check status refreshes

6. **Error Handling**
   - Stop AgentShield (if possible)
   - Click "Scan Now"
   - Verify error message displays

### API Testing

```bash
# Get CSRF token
curl -s http://127.0.0.1:8080/api/session | python3 -m json.tool

# Note: POST endpoints require CSRF token, easier to test via dashboard UI
```

## Troubleshooting

### Issue: Security tab shows "Loading..." indefinitely

**Cause**: SECURITY_STATUS.json doesn't exist
**Fix**: Run initial scan:
```bash
cd ~/.openclaw
npx ecc-agentshield scan --path . --format json > /tmp/scan.json
```

Then manually create SECURITY_STATUS.json or wait for daily cron to run.

### Issue: "Scan Now" button doesn't work

**Cause**: AgentShield not installed or accessible
**Fix**: Install AgentShield (already included in ECC integration):
```bash
npx ecc-agentshield scan --help
```

### Issue: Dashboard shows old security data

**Cause**: Browser cached old SECURITY_STATUS.json
**Fix**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue: CSRF token errors

**Cause**: Session expired or CSRF token invalid
**Fix**: Refresh the entire dashboard page to get new session

## Performance

- **Initial load**: ~100-200ms (reads JSON file)
- **Manual scan**: ~15-30 seconds (AgentShield execution time)
- **Auto-fix**: ~20-40 seconds (scan + fix operations)
- **Status refresh**: ~50-100ms (file read + JSON parse)

## Future Enhancements

### Phase 1 (Optional)
- [ ] Add security widget to Overview tab
- [ ] Real-time updates via SSE when scans complete
- [ ] Badge count in nav showing critical/high findings
- [ ] Detailed findings modal on click

### Phase 2 (Advanced)
- [ ] Security trend charts (last 30 days)
- [ ] Drill-down into specific findings
- [ ] Inline code snippets showing issues
- [ ] One-click manual review marking
- [ ] Custom scan scheduling

### Phase 3 (Enterprise)
- [ ] Multi-workspace comparison
- [ ] Security compliance reports (PDF export)
- [ ] Webhook notifications on grade changes
- [ ] Integration with external SIEM tools

## Credits

- **AgentShield**: Security scanner by [@affaan-m](https://github.com/affaan-m)
- **ECC Integration**: Everything Claude Code resources
- **Dashboard**: AGI Farm plugin team

## References

- [AgentShield Repository](https://github.com/affaan-m/agentshield)
- [AGENTSHIELD_INTEGRATION_PROPOSAL.md](AGENTSHIELD_INTEGRATION_PROPOSAL.md)
- [AGENTSHIELD_IMPLEMENTED.md](AGENTSHIELD_IMPLEMENTED.md)
- [SECURITY_INTEGRATION.md](SECURITY_INTEGRATION.md)
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
