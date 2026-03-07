# Quality Gate Patterns for Vigil

**Based on**: Agency-Agents "Evidence Collector" and "Reality Checker" patterns
**Purpose**: Enhanced QA validation workflows for AGI Farm's Vigil
**Version**: 1.0 (v1.6.0)

---

## 🎯 Overview

Vigil (AGI Farm's QA Specialist) can adopt proven quality gate patterns from Agency-Agents to provide evidence-based validation with systematic quality enforcement.

**Two Core Patterns**:
1. **Evidence Collector** - Task-by-task QA validation (Phase 3: Dev-QA Loop)
2. **Reality Checker** - Production readiness certification (Phase 4: Integration)

---

## 🔍 Pattern 1: Evidence Collector (Task-Level QA)

**When to Use**: During Cooper's Development-QA Loop (Phase 3)
**Purpose**: Validate individual task implementations with visual proof
**Philosophy**: "Default to finding 3-5 issues minimum"

### Core Mindset

```markdown
## Evidence Collector Philosophy

**Default Assumption**: Every implementation has issues
**Minimum Standard**: Find 3-5 issues per validation cycle
**Evidence Requirement**: Visual proof for ALL claims
**Decision Framework**: PASS only when quality overwhelmingly proven

### Validation Priorities (in order)
1. **Functional Correctness** - Does it work as specified?
2. **Edge Cases** - What breaks it?
3. **Security** - What vulnerabilities exist?
4. **Performance** - What bottlenecks exist?
5. **Code Quality** - What technical debt exists?
```

### Vigil's Evidence Collector Workflow

```markdown
## Task Validation Process

### Input from Cooper
- Task ID and description
- Implementation file paths
- Architecture reference
- QA attempt number (1, 2, or 3)

### Step 1: Functional Testing (Required)
1. Read task requirements from task list
2. Read implementation code thoroughly
3. Identify all claimed functionality
4. Test each function with:
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary values

### Step 2: Evidence Collection (Required)
**For Backend/API Tasks**:
```bash
# Run tests and capture output
npm test -- --coverage > qa-evidence/task-{{N}}-tests.txt 2>&1

# Run security scan
npm audit --json > qa-evidence/task-{{N}}-security.json

# Check code coverage
cat coverage/lcov-report/index.html | grep "statements"
```

**For Frontend/UI Tasks**:
```bash
# Run tests
npm test > qa-evidence/task-{{N}}-tests.txt 2>&1

# Take screenshots of all UI states
# (use browser screenshot tools)
# Save to: qa-evidence/task-{{N}}-screenshot-*.png

# Test responsive behavior
# Screenshots at: 320px, 768px, 1024px, 1920px
```

**For All Tasks**:
```bash
# Lint check
npm run lint > qa-evidence/task-{{N}}-lint.txt 2>&1

# Build verification
npm run build > qa-evidence/task-{{N}}-build.txt 2>&1
```

### Step 3: Issue Discovery (Minimum 3-5 Issues)
**Systematic Search Areas**:

1. **Requirements Mismatch**
   - Does implementation match EXACT specification?
   - Are there undocumented features (scope creep)?
   - Are there missing requirements?

2. **Edge Cases**
   - What happens with empty inputs?
   - What happens with maximum values?
   - What happens with invalid data?
   - What happens with network failures?

3. **Security Vulnerabilities**
   - Input validation missing?
   - SQL injection possible?
   - XSS vulnerabilities?
   - Authentication bypasses?
   - Sensitive data exposure?

4. **Performance Issues**
   - Inefficient algorithms (O(n²) where O(n) possible)?
   - Missing database indexes?
   - Unnecessary re-renders?
   - Memory leaks?

5. **Code Quality**
   - Missing error handling?
   - Unclear variable names?
   - Duplicated code?
   - Missing tests?
   - Coverage below 80%?

6. **Architecture Violations**
   - Does it follow architecture document?
   - Proper separation of concerns?
   - Consistent with existing patterns?

### Step 4: Decision - PASS or FAIL

**PASS Criteria** (ALL must be true):
- [ ] Functional tests pass (100%)
- [ ] Coverage ≥ 80%
- [ ] Security scan: No HIGH or CRITICAL issues
- [ ] All edge cases handled
- [ ] Follows architecture patterns
- [ ] Build succeeds
- [ ] Lint passes (or only minor warnings)
- [ ] Visual proof collected for all claims

**FAIL Criteria** (ANY triggers FAIL):
- [ ] Tests failing
- [ ] Coverage < 80%
- [ ] Security issues: HIGH or CRITICAL
- [ ] Missing edge case handling
- [ ] Architecture violations
- [ ] Build failures
- [ ] Major functionality broken

### Step 5: Report Format

**PASS Report Template**:
```markdown
✅ PASS - TASK {{N}} meets quality standards

## Validation Summary
**Task**: {{TASK_DESCRIPTION}}
**QA Attempt**: {{ATTEMPT}}/3
**Evidence**: {{SCREENSHOT_COUNT}} screenshots, {{TEST_COUNT}} tests

## Quality Metrics
✅ **Functional Tests**: {{PASS}}/{{TOTAL}} passed
✅ **Coverage**: {{COVERAGE}}% (≥80% threshold met)
✅ **Security Scan**: {{SEVERITY}} - No critical issues
✅ **Edge Cases**: All {{N}} scenarios handled
✅ **Build**: Success
✅ **Lint**: Pass

## Evidence Files
- Tests: qa-evidence/task-{{N}}-tests.txt
- Security: qa-evidence/task-{{N}}-security.json
- Coverage: qa-evidence/task-{{N}}-coverage.html
- Screenshots: qa-evidence/task-{{N}}-screenshot-*.png ({{COUNT}} files)

## Minor Issues Found (Non-blocking)
1. [LOW] {{ISSUE_1}} - Can be addressed later
2. [LOW] {{ISSUE_2}} - Can be addressed later

## Approval
**Status**: APPROVED for integration
**QA Specialist**: Vigil (Evidence Collector Mode)
**Timestamp**: {{TIMESTAMP}}

---
Task {{N}} is ready to advance in pipeline.
```

**FAIL Report Template**:
```markdown
❌ FAIL - TASK {{N}} needs work

## Validation Summary
**Task**: {{TASK_DESCRIPTION}}
**QA Attempt**: {{ATTEMPT}}/3
**Evidence**: {{SCREENSHOT_COUNT}} screenshots, {{TEST_COUNT}} tests

## Critical Issues Found ({{COUNT}} total)

### 1. [CRITICAL] {{ISSUE_TITLE}}
**Category**: {{Functional|Security|Performance|Quality}}
**Impact**: {{IMPACT_DESCRIPTION}}
**Evidence**: qa-evidence/task-{{N}}-{{EVIDENCE_FILE}}
**Required Action**: {{SPECIFIC_FIX}}

### 2. [HIGH] {{ISSUE_TITLE}}
**Category**: {{CATEGORY}}
**Impact**: {{IMPACT_DESCRIPTION}}
**Evidence**: {{EVIDENCE_REFERENCE}}
**Required Action**: {{SPECIFIC_FIX}}

### 3. [HIGH] {{ISSUE_TITLE}}
[... continue for all issues, minimum 3-5]

## Quality Metrics
❌ **Functional Tests**: {{FAIL}}/{{TOTAL}} failed
⚠️  **Coverage**: {{COVERAGE}}% (below 80% threshold)
❌ **Security Scan**: {{SEVERITY}} - {{COUNT}} critical issues
❌ **Edge Cases**: {{N}} scenarios not handled
{{BUILD_STATUS}}
{{LINT_STATUS}}

## Evidence Files
- Tests: qa-evidence/task-{{N}}-tests.txt
- Security: qa-evidence/task-{{N}}-security.json
- Screenshots: qa-evidence/task-{{N}}-screenshot-*.png ({{COUNT}} files)
- Build Log: qa-evidence/task-{{N}}-build.txt

## Required Actions (Priority Order)
1. **[CRITICAL]** {{ACTION_1}}
2. **[HIGH]** {{ACTION_2}}
3. **[HIGH]** {{ACTION_3}}
4. **[MEDIUM]** {{ACTION_4}}
5. **[MEDIUM]** {{ACTION_5}}

## Next Steps
- Developer must address ALL CRITICAL and HIGH issues
- Re-submit for QA validation (Attempt {{ATTEMPT+1}}/3)
- If attempt 3 fails, task escalates to HITL

**Status**: REJECTED - Needs rework
**QA Specialist**: Vigil (Evidence Collector Mode)
**Timestamp**: {{TIMESTAMP}}

---
Task {{N}} cannot advance until issues resolved.
```

---

## 🛡️ Pattern 2: Reality Checker (Production Readiness)

**When to Use**: During Cooper's Final Integration phase (Phase 4)
**Purpose**: Certify entire system for production deployment
**Philosophy**: "Default to NEEDS WORK unless overwhelming evidence proves READY"

### Core Mindset

```markdown
## Reality Checker Philosophy

**Default Position**: System is NOT production ready
**Burden of Proof**: Overwhelming evidence required for approval
**Risk Tolerance**: Zero tolerance for critical issues
**Decision Framework**: NEEDS WORK until proven otherwise

### Production Readiness Standards
All criteria must have overwhelming evidence:
1. **Integration Tests**: All workflows function end-to-end
2. **Security**: Grade A required (no HIGH/CRITICAL issues)
3. **Performance**: No critical bottlenecks
4. **Documentation**: Complete and accurate
5. **Rollback Plan**: Deployment can be reversed
6. **Monitoring**: Observability in place
```

### Vigil's Reality Checker Workflow

```markdown
## Production Certification Process

### Input from Cooper
- Project name
- All task completion status (all must be ✅)
- Task list file path
- Architecture documentation path
- Cooper's pipeline state file

### Step 1: Integration Testing (Required)

**End-to-End Workflow Validation**:
```bash
# Verify all tasks marked complete
INCOMPLETE=$(grep "^### \[ \]" project-tasks/{{PROJECT}}-tasklist.md | wc -l)
if [ "$INCOMPLETE" -ne 0 ]; then
    echo "❌ FAIL: $INCOMPLETE tasks not complete"
    exit 1
fi

# Run full integration test suite
npm run test:integration > qa-evidence/integration-tests.txt 2>&1

# Run E2E tests (if applicable)
npm run test:e2e > qa-evidence/e2e-tests.txt 2>&1

# Verify build for production
npm run build:production > qa-evidence/production-build.txt 2>&1
```

**Integration Evidence Collection**:
1. Screenshot all major user workflows (minimum 10 screenshots)
2. Test all API endpoints with realistic data
3. Verify database migrations succeed
4. Test authentication/authorization flows
5. Verify error handling in all critical paths

### Step 2: Security Audit (Required)

**Comprehensive Security Scan**:
```bash
# Dependency vulnerabilities
npm audit --production --json > qa-evidence/security-audit.json

# Static security analysis (if available)
npm run security:scan > qa-evidence/security-scan.txt 2>&1

# Check for exposed secrets
git secrets --scan > qa-evidence/secrets-scan.txt 2>&1

# OWASP Top 10 checklist
# Manual review required
```

**Security Grade Calculation**:
```markdown
Grade A: 0 CRITICAL, 0 HIGH, ≤2 MEDIUM
Grade B: 0 CRITICAL, ≤1 HIGH, ≤5 MEDIUM
Grade C: 0 CRITICAL, ≤3 HIGH, any MEDIUM
Grade D: ≥1 CRITICAL, any HIGH, any MEDIUM
Grade F: ≥2 CRITICAL

**PRODUCTION READY requirement**: Grade A only
```

### Step 3: Performance Validation (Required)

**Performance Benchmarks**:
```bash
# API response times
npm run benchmark:api > qa-evidence/performance-api.txt

# Frontend load times
npm run benchmark:frontend > qa-evidence/performance-frontend.txt

# Database query performance
npm run benchmark:db > qa-evidence/performance-db.txt
```

**Performance Standards**:
```markdown
✅ API response time (p95): <500ms
✅ Page load time: <2s
✅ Time to Interactive: <3s
✅ Database queries: <100ms (p95)
✅ No memory leaks detected
✅ No CPU bottlenecks detected

❌ Any metric 50% worse than standard = CRITICAL BLOCKER
```

### Step 4: Documentation Audit (Required)

**Documentation Completeness Check**:
```markdown
Required Documentation (all must exist):
- [ ] README.md with setup instructions
- [ ] Architecture documentation
- [ ] API documentation (if backend)
- [ ] Deployment guide
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting setup
- [ ] Runbook for common issues

**Verification**: Follow setup instructions from scratch on clean system
```

### Step 5: Production Readiness Decision

**PRODUCTION READY Criteria** (ALL must be true):
- [ ] Integration tests: 100% pass
- [ ] E2E tests: 100% pass
- [ ] Security grade: A (0 CRITICAL, 0 HIGH)
- [ ] Performance: All benchmarks meet standards
- [ ] Documentation: Complete and verified
- [ ] Rollback plan: Documented and tested
- [ ] Monitoring: Alerts configured
- [ ] No known CRITICAL or HIGH issues
- [ ] All tasks from task list completed
- [ ] Visual evidence collected (≥10 screenshots)

**NEEDS WORK Criteria** (ANY triggers NEEDS WORK):
- [ ] Integration tests failing
- [ ] Security grade: B or worse
- [ ] Performance benchmarks missed
- [ ] Documentation incomplete
- [ ] No rollback plan
- [ ] Critical issues unresolved

### Step 6: Certification Report

**PRODUCTION READY Certificate**:
```markdown
🎉 PRODUCTION READY - {{PROJECT_NAME}}

## Certification Summary
**Project**: {{PROJECT_NAME}}
**Certification Date**: {{TIMESTAMP}}
**QA Specialist**: Vigil (Reality Checker Mode)
**Total Development Time**: {{DURATION}}

## Quality Metrics

### Integration Testing ✅
- **Integration Tests**: {{PASS}}/{{TOTAL}} passed (100%)
- **E2E Tests**: {{PASS}}/{{TOTAL}} passed (100%)
- **Production Build**: Success
- **Workflows Validated**: {{COUNT}}

### Security Audit ✅
- **Security Grade**: A
- **Critical Issues**: 0
- **High Issues**: 0
- **Medium Issues**: {{COUNT}}
- **Dependencies Scanned**: {{COUNT}}

### Performance Benchmarks ✅
- **API Response Time (p95)**: {{TIME}}ms (<500ms ✅)
- **Page Load Time**: {{TIME}}s (<2s ✅)
- **Time to Interactive**: {{TIME}}s (<3s ✅)
- **Database Queries (p95)**: {{TIME}}ms (<100ms ✅)

### Documentation ✅
- **README**: Complete and verified
- **Architecture**: Comprehensive
- **API Docs**: {{COUNT}} endpoints documented
- **Deployment Guide**: Step-by-step instructions
- **Rollback Plan**: Documented and tested
- **Monitoring**: Alerts configured

## Evidence Portfolio
- **Screenshots**: {{COUNT}} files (all major workflows)
- **Test Results**: qa-evidence/integration-tests.txt
- **Security Audit**: qa-evidence/security-audit.json
- **Performance Reports**: qa-evidence/performance-*.txt
- **Build Logs**: qa-evidence/production-build.txt

## Task Completion
✅ **All {{TOTAL}} tasks completed and validated**
✅ **Zero tasks blocked or incomplete**
✅ **Quality gates passed throughout pipeline**

## Production Deployment Approval

**Status**: ✅ APPROVED FOR PRODUCTION DEPLOYMENT

This system has met all quality gates and is certified production-ready. Deployment may proceed with confidence.

**Deployment Checklist**:
- [ ] Backup current production database
- [ ] Deploy to staging first
- [ ] Verify staging deployment
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for 24 hours
- [ ] Rollback plan ready if needed

**Certified By**: Vigil (Reality Checker Mode)
**Certification ID**: {{UUID}}
**Timestamp**: {{TIMESTAMP}}

---
Pipeline completed successfully. System ready for production.
```

**NEEDS WORK Report**:
```markdown
⚠️ NEEDS WORK - {{PROJECT_NAME}}

## Certification Summary
**Project**: {{PROJECT_NAME}}
**Evaluation Date**: {{TIMESTAMP}}
**QA Specialist**: Vigil (Reality Checker Mode)
**Status**: NOT READY for production

## Critical Blockers Found ({{COUNT}} total)

### 🔴 Blocker 1: {{BLOCKER_TITLE}}
**Category**: {{Integration|Security|Performance|Documentation}}
**Severity**: CRITICAL
**Impact**: {{IMPACT_DESCRIPTION}}
**Evidence**: {{EVIDENCE_FILE}}
**Example**:
```
{{SPECIFIC_EXAMPLE}}
```
**Required Action**: {{SPECIFIC_FIX}}
**Estimated Effort**: {{TIME_ESTIMATE}}

### 🔴 Blocker 2: {{BLOCKER_TITLE}}
[... continue for all blockers]

## Quality Metrics Report

### Integration Testing {{STATUS_EMOJI}}
- **Integration Tests**: {{FAIL}}/{{TOTAL}} failed
- **E2E Tests**: {{FAIL}}/{{TOTAL}} failed
- **Production Build**: {{SUCCESS|FAILURE}}
- **Broken Workflows**: {{LIST}}

### Security Audit {{STATUS_EMOJI}}
- **Security Grade**: {{GRADE}} (A required)
- **Critical Issues**: {{COUNT}} (0 required)
- **High Issues**: {{COUNT}} (0 required)
- **Vulnerabilities**: {{LIST}}

### Performance Benchmarks {{STATUS_EMOJI}}
- **API Response Time (p95)**: {{TIME}}ms ({{COMPARISON}} to 500ms threshold)
- **Page Load Time**: {{TIME}}s ({{COMPARISON}} to 2s threshold)
- **Failed Benchmarks**: {{LIST}}

### Documentation {{STATUS_EMOJI}}
- **Missing Documentation**: {{LIST}}
- **Incomplete Guides**: {{LIST}}
- **Rollback Plan**: {{EXISTS|MISSING}}

## Evidence Files
- Integration Tests: qa-evidence/integration-tests.txt
- Security Audit: qa-evidence/security-audit.json
- Performance Reports: qa-evidence/performance-*.txt
- Screenshots: qa-evidence/screenshots/ ({{COUNT}} files)

## Required Actions Before Production (Priority Order)

### Must Fix (Critical - Deployment Blocked)
1. **{{ACTION_1}}** - Estimated: {{TIME}}
2. **{{ACTION_2}}** - Estimated: {{TIME}}
3. **{{ACTION_3}}** - Estimated: {{TIME}}

### Should Fix (High - Risk Mitigation)
1. **{{ACTION_1}}** - Estimated: {{TIME}}
2. **{{ACTION_2}}** - Estimated: {{TIME}}

### Could Fix (Medium - Quality Improvement)
1. **{{ACTION_1}}** - Estimated: {{TIME}}

## Re-Certification Process
1. Address ALL critical blockers
2. Re-run integration and security scans
3. Collect updated evidence
4. Submit for Reality Checker re-evaluation

**Status**: ❌ NOT APPROVED - NEEDS WORK

This system does NOT meet production readiness standards. Deployment is BLOCKED until critical issues are resolved.

**Evaluated By**: Vigil (Reality Checker Mode)
**Evaluation ID**: {{UUID}}
**Timestamp**: {{TIMESTAMP}}

---
System requires rework before production deployment.
```

---

## 🔄 Integration with Cooper's Pipeline

### Phase 3: Dev-QA Loop (Evidence Collector)

**Cooper's Delegation to Vigil**:
```markdown
---
TASK_ID: {{UUID}}
FROM: main
TO: vigil
TYPE: review
PRIORITY: immediate
---

## Context
Project: {{PROJECT_NAME}}
Task: TASK {{N}} implementation
Developer: {{AGENT_NAME}}
QA Attempt: {{RETRY_COUNT}}/3

## Task
Apply Evidence Collector pattern to validate TASK {{N}}:

1. Read task requirements from task list
2. Test implementation (functional + edge cases)
3. Collect visual evidence (screenshots, test outputs)
4. Run security scan and coverage check
5. Find minimum 3-5 issues (systematic search)
6. Provide PASS or FAIL with specific evidence

## Expected Output
Use Evidence Collector report templates:
- PASS: List evidence files, minor issues only
- FAIL: List 3-5+ issues with severity, evidence, required actions

## Reference
Apply patterns from: templates/QUALITY_GATE_PATTERNS.md (Evidence Collector section)
```

### Phase 4: Integration Validation (Reality Checker)

**Cooper's Delegation to Vigil**:
```markdown
---
TASK_ID: {{UUID}}
FROM: main
TO: vigil
TYPE: review
PRIORITY: immediate
---

## Context
Project: {{PROJECT_NAME}}
Status: All {{N}} tasks individually validated
Pipeline State: pipeline-state/{{PROJECT_NAME}}-state.json

## Task
Apply Reality Checker pattern for production certification:

1. **Default assumption**: System NEEDS WORK
2. Validate integration (end-to-end workflows)
3. Security audit (Grade A required)
4. Performance benchmarks (all thresholds must pass)
5. Documentation completeness
6. Collect overwhelming evidence (≥10 screenshots)
7. Provide PRODUCTION READY or NEEDS WORK certificate

## Expected Output
Use Reality Checker certificate templates:
- PRODUCTION READY: Evidence of all criteria met
- NEEDS WORK: Critical blockers with required actions

## Reference
Apply patterns from: templates/QUALITY_GATE_PATTERNS.md (Reality Checker section)
```

---

## 📊 Quality Metrics Tracking

### Evidence Collector Metrics (Per Task)
```json
{
  "task_id": "{{N}}",
  "qa_attempts": {{RETRY_COUNT}},
  "issues_found": {{COUNT}},
  "severity_breakdown": {
    "critical": {{COUNT}},
    "high": {{COUNT}},
    "medium": {{COUNT}},
    "low": {{COUNT}}
  },
  "evidence_files": {{COUNT}},
  "decision": "PASS|FAIL",
  "timestamp": "{{ISO_TIMESTAMP}}"
}
```

### Reality Checker Metrics (Final Integration)
```json
{
  "project": "{{PROJECT_NAME}}",
  "integration_tests": {
    "total": {{COUNT}},
    "passed": {{COUNT}},
    "failed": {{COUNT}}
  },
  "security_grade": "A|B|C|D|F",
  "security_issues": {
    "critical": {{COUNT}},
    "high": {{COUNT}},
    "medium": {{COUNT}}
  },
  "performance_benchmarks": {
    "api_response_p95": {{MS}},
    "page_load": {{SECONDS}},
    "time_to_interactive": {{SECONDS}}
  },
  "documentation_complete": true|false,
  "evidence_screenshots": {{COUNT}},
  "certification": "PRODUCTION_READY|NEEDS_WORK",
  "blockers": {{COUNT}},
  "timestamp": "{{ISO_TIMESTAMP}}"
}
```

---

## 🎯 Benefits of Quality Gate Patterns

### For Vigil (QA Specialist)
✅ **Clear methodology** - Systematic validation process
✅ **Evidence-based** - All decisions backed by proof
✅ **Consistent standards** - Same quality bar every time
✅ **Comprehensive coverage** - Nothing slips through

### For Cooper (Orchestrator)
✅ **Reliable quality gates** - Predictable PASS/FAIL decisions
✅ **Clear feedback loops** - Specific actions for developers
✅ **Risk mitigation** - Catch issues before production
✅ **Confidence** - Trust in system readiness

### For Developers
✅ **Specific feedback** - Know exactly what to fix
✅ **Fair evaluation** - Consistent standards applied
✅ **Learning** - Understand quality expectations
✅ **Trust** - Quality process is thorough and evidence-based

### For Users
✅ **High quality** - Production systems are battle-tested
✅ **Reliability** - Critical issues caught before release
✅ **Transparency** - Evidence available for review
✅ **Confidence** - Quality certification is rigorous

---

## 🚀 Usage in Vigil

Vigil activates appropriate pattern based on Cooper's delegation:

### Evidence Collector Mode (Task-Level QA)
```
Cooper delegates: "Validate TASK 3 implementation (attempt 1/3)"

Vigil:
1. Activates Evidence Collector mindset
2. Default to finding 3-5 issues
3. Collects visual evidence
4. Reports PASS or FAIL with specifics
5. Returns to Cooper for decision
```

### Reality Checker Mode (Production Certification)
```
Cooper delegates: "Final integration validation, all tasks complete"

Vigil:
1. Activates Reality Checker mindset
2. Default to NEEDS WORK assumption
3. Runs comprehensive integration tests
4. Requires Grade A security, all benchmarks pass
5. Collects overwhelming evidence (≥10 screenshots)
6. Issues PRODUCTION READY or NEEDS WORK certificate
7. Returns to Cooper with final decision
```

---

**Adoption**: Vigil can adopt these patterns immediately. Reference this document in Cooper's delegations to activate specific mode.

**Version**: 1.0
**Last Updated**: March 7, 2026
**Source**: Adapted from Agency-Agents "Evidence Collector" and "Reality Checker" by @msitarzewski
