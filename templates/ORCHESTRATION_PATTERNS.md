# Orchestration Patterns for Cooper

**Based on**: Agency-Agents "Agents Orchestrator" pattern
**Purpose**: Enhanced pipeline orchestration workflows for AGI Farm's Cooper
**Version**: 1.0 (v1.6.0)

---

## 🎯 Overview

Cooper (AGI Farm's Orchestrator) can adopt proven pipeline patterns from the Agency-Agents "Agents Orchestrator" to manage complex multi-agent workflows with quality gates and retry logic.

---

## 🔄 Pipeline Pattern: PM → Architect → Dev-QA Loop → Integration

### Phase 1: Project Analysis & Planning

**Objective**: Convert specifications into actionable task lists

**Cooper's Actions**:
1. Verify project specification exists
2. Delegate to appropriate agent (Sage or Vista) for analysis
3. Request comprehensive task list creation
4. Verify task list quality before proceeding

**Example Delegation**:
```markdown
---
TASK_ID: {{UUID}}
FROM: main
TO: vista
TYPE: analysis
PRIORITY: immediate
---

## Context
User provided project specification for: {{PROJECT_NAME}}
Located at: {{SPEC_PATH}}

## Task
Analyze specification and create comprehensive task list:
1. Read specification thoroughly
2. Extract EXACT requirements (do not add features not mentioned)
3. Break into granular, actionable tasks
4. Organize by dependency order
5. Estimate effort for each task

## Expected Output
Create file: `project-tasks/{{PROJECT_NAME}}-tasklist.md`

Format:
### [ ] Task 1: [Description]
**Depends on**: None
**Estimated effort**: [time]
**Deliverable**: [specific output]

### [ ] Task 2: [Description]
...

## Constraints
- Quote EXACT requirements from spec
- No luxury features
- Each task must have clear deliverable
- Dependencies must be explicit

## Escalation
If specification is ambiguous or incomplete, create HITL request for user clarification
```

**Quality Check**:
```markdown
Cooper verifies:
- [ ] Task list file exists
- [ ] All tasks have clear descriptions
- [ ] Dependencies are explicit
- [ ] Deliverables are defined
- [ ] No tasks contradict specification
```

---

### Phase 2: Technical Architecture

**Objective**: Create solid technical foundation for implementation

**Cooper's Actions**:
1. Verify task list from Phase 1 exists
2. Delegate to Sage (architect) for technical design
3. Request architecture that developers can implement confidently
4. Verify architecture deliverables before proceeding

**Example Delegation**:
```markdown
---
TASK_ID: {{UUID}}
FROM: main
TO: sage
TYPE: implementation
PRIORITY: immediate
---

## Context
Project: {{PROJECT_NAME}}
Task list: project-tasks/{{PROJECT_NAME}}-tasklist.md
Specification: {{SPEC_PATH}}

## Task
Create technical architecture and implementation foundation:

1. **System Architecture**
   - Component diagram
   - Data flow
   - API contracts
   - Technology choices

2. **Implementation Foundation**
   - Directory structure
   - Configuration files
   - Shared utilities
   - Testing infrastructure

3. **Developer Guide**
   - Setup instructions
   - Code conventions
   - Build process
   - Deployment process

## Expected Output
Create files:
- `project-docs/{{PROJECT_NAME}}-architecture.md`
- `project-docs/{{PROJECT_NAME}}-developer-guide.md`
- Foundation code (configs, structure, utils)

## Constraints
- Apply @architect, @api-design ECC resources
- Follow TDD principles
- Design for testability
- Clear separation of concerns

## Escalation
If specification lacks technical details, propose options and request HITL decision
```

**Quality Check**:
```markdown
Cooper verifies:
- [ ] Architecture document exists and is comprehensive
- [ ] Developer guide provides clear instructions
- [ ] Foundation code is buildable
- [ ] No architectural decisions are arbitrary
```

---

### Phase 3: Development-QA Continuous Loop

**Objective**: Implement and validate each task with quality gates

**Cooper's Core Loop**:
```
For each task in task list:
  1. Delegate to appropriate developer (Forge, Pixel, etc.)
  2. Wait for implementation completion
  3. Delegate to Vigil for QA validation
  4. Receive QA result (PASS or FAIL)
  5. IF PASS:
       - Mark task complete
       - Move to next task
     IF FAIL:
       - Increment retry counter
       - IF retries < 3:
           - Delegate back to developer with QA feedback
           - Loop to step 2
         ELSE:
           - Escalate to HITL
           - Request user guidance
```

**Example: Task Implementation Delegation**:
```markdown
---
TASK_ID: {{UUID}}
FROM: main
TO: forge
TYPE: implementation
PRIORITY: normal
---

## Context
Project: {{PROJECT_NAME}}
Task: TASK {{N}} from project-tasks/{{PROJECT_NAME}}-tasklist.md
Architecture: project-docs/{{PROJECT_NAME}}-architecture.md
Previous tasks: TASK 1-{{N-1}} completed and validated

## Task
Implement TASK {{N}} ONLY from the task list:

**Task Description**: {{TASK_DESCRIPTION}}
**Depends on**: {{DEPENDENCIES}}
**Deliverable**: {{DELIVERABLE}}

Follow architecture foundation created by Sage.

## Expected Output
1. Implementation code with tests
2. Updated task list (mark task complete)
3. Brief implementation notes in outbox

## Constraints
- Apply @tdd-workflow, @verification-loop ECC resources
- Tests must pass (80%+ coverage)
- Follow architecture patterns
- Implement ONLY this task (no scope creep)

## Escalation
If dependencies are broken or architecture is insufficient, escalate to Cooper
```

**Example: QA Validation Delegation**:
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
Developer: Forge
Task: TASK {{N}} implementation
Implementation: {{IMPLEMENTATION_PATH}}
QA Attempt: {{RETRY_COUNT}} of 3

## Task
Validate TASK {{N}} implementation:

1. **Functional Testing**
   - Does it meet task requirements?
   - Does it follow architecture?
   - Are edge cases handled?

2. **Quality Gates**
   - Tests exist and pass
   - Coverage ≥ 80%
   - No critical security issues
   - Code follows conventions

3. **Evidence Collection**
   - Run tests, capture output
   - Run security scan
   - Check coverage report
   - Screenshot proof if UI changes

## Expected Output
Provide clear PASS or FAIL decision:

**PASS Format**:
```
✅ PASS - TASK {{N}} meets quality standards

Evidence:
- Tests: {{N}} passed, 0 failed
- Coverage: {{X}}%
- Security: No issues found
- Functional: All requirements met

APPROVED for integration.
```

**FAIL Format**:
```
❌ FAIL - TASK {{N}} needs work

Issues Found ({{COUNT}} total):
1. [CRITICAL] {{ISSUE_1}}
2. [HIGH] {{ISSUE_2}}
...

Required Actions:
- {{ACTION_1}}
- {{ACTION_2}}

Evidence: {{PROOF_LINKS}}
```

## Constraints
- Apply @code-review, @security-scan, @verification-loop
- Default to finding 3-5 issues (Evidence Collector mindset)
- Visual proof required for all claims
- Clear, actionable feedback

## Escalation
If implementation fundamentally violates architecture, escalate to Cooper
```

**Cooper's Decision Logic**:
```python
# Pseudocode for Cooper's loop management

task_list = read_task_list()
retry_counts = {}

for task in task_list:
    task_id = task.id
    retry_counts[task_id] = 0

    while True:
        # Delegate to developer
        delegate_to_developer(task)
        wait_for_completion()

        # Delegate to QA
        qa_result = delegate_to_qa(task, retry_counts[task_id])

        if qa_result == "PASS":
            mark_task_complete(task)
            update_task_list(task_id, "✅")
            log_success(task_id)
            break  # Move to next task

        elif qa_result == "FAIL":
            retry_counts[task_id] += 1

            if retry_counts[task_id] < 3:
                # Loop back with feedback
                qa_feedback = get_qa_feedback(task)
                log_retry(task_id, retry_counts[task_id], qa_feedback)
                # Continue loop
            else:
                # Escalate to HITL
                hitl_request(task_id, qa_feedback, retry_counts[task_id])
                user_decision = wait_for_hitl_response()

                if user_decision == "SKIP":
                    mark_task_blocked(task)
                    break  # Move to next task
                elif user_decision == "REASSIGN":
                    reassign_to_different_agent(task)
                    retry_counts[task_id] = 0
                    # Continue loop
                else:
                    # User provides guidance, continue loop
                    pass
```

---

### Phase 4: Final Integration & Validation

**Objective**: Ensure all tasks integrate correctly and system is production-ready

**Cooper's Actions**:
1. Verify all tasks marked complete
2. Delegate to Vigil for integration testing
3. Request evidence-based production readiness certification
4. Deliver final summary to user

**Example: Integration Testing Delegation**:
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
Status: All {{N}} tasks implemented and individually validated
Task list: project-tasks/{{PROJECT_NAME}}-tasklist.md (all ✅)

## Task
Perform final integration testing and production readiness certification:

1. **Integration Testing**
   - All components work together
   - No broken dependencies
   - End-to-end workflows function
   - No regression in existing features

2. **Quality Gates (Reality Checker Mode)**
   - DEFAULT TO "NEEDS WORK" unless proven ready
   - Overwhelming evidence required for "PRODUCTION READY"
   - Security scan: Grade A required
   - Performance: No critical bottlenecks
   - Documentation: Complete and accurate

3. **Evidence Collection**
   - Screenshots of all major workflows
   - Test results (unit + integration)
   - Performance benchmarks
   - Security scan output

## Expected Output
Production Readiness Certificate:

**FORMAT (if READY)**:
```
🎉 PRODUCTION READY - {{PROJECT_NAME}}

Integration Status: PASS
Quality Grade: {{GRADE}}
Security Score: {{SCORE}}

Evidence:
- Integration tests: {{N}} passed
- Performance: {{METRICS}}
- Security: Grade A, {{SCORE}}/100
- Documentation: Complete

Certification: APPROVED for production deployment.

Screenshots: {{LINKS}}
```

**FORMAT (if NEEDS WORK)**:
```
⚠️ NEEDS WORK - {{PROJECT_NAME}}

Blockers ({{COUNT}} found):
1. [CRITICAL] {{BLOCKER_1}}
2. [HIGH] {{BLOCKER_2}}

Must fix before production:
- {{FIX_1}}
- {{FIX_2}}

Evidence: {{PROOF_LINKS}}

Status: NOT READY for production.
```

## Constraints
- Apply Reality Checker mindset (default: NEEDS WORK)
- Require overwhelming proof for PRODUCTION READY
- Evidence must be visual and comprehensive
- No assumptions, only facts

## Escalation
If system fundamentally doesn't meet specification, escalate to Cooper with full report
```

---

## 📊 Pipeline State Tracking

Cooper maintains state throughout pipeline:

**File**: `pipeline-state/{{PROJECT_NAME}}-state.json`

```json
{
  "project": "{{PROJECT_NAME}}",
  "current_phase": "dev_qa_loop",
  "phase_history": [
    {
      "phase": "planning",
      "started": "2026-03-07T10:00:00Z",
      "completed": "2026-03-07T10:15:00Z",
      "status": "COMPLETE",
      "agent": "vista",
      "deliverables": ["project-tasks/example-tasklist.md"]
    },
    {
      "phase": "architecture",
      "started": "2026-03-07T10:16:00Z",
      "completed": "2026-03-07T11:00:00Z",
      "status": "COMPLETE",
      "agent": "sage",
      "deliverables": [
        "project-docs/example-architecture.md",
        "project-docs/example-developer-guide.md"
      ]
    },
    {
      "phase": "dev_qa_loop",
      "started": "2026-03-07T11:01:00Z",
      "completed": null,
      "status": "IN_PROGRESS",
      "current_task": 3,
      "total_tasks": 8
    }
  ],
  "tasks": {
    "1": {"status": "COMPLETE", "retries": 0, "agent": "forge"},
    "2": {"status": "COMPLETE", "retries": 1, "agent": "forge"},
    "3": {"status": "IN_PROGRESS", "retries": 0, "agent": "forge"},
    "4": {"status": "PENDING", "retries": 0, "agent": null},
    "5": {"status": "PENDING", "retries": 0, "agent": null},
    "6": {"status": "PENDING", "retries": 0, "agent": null},
    "7": {"status": "PENDING", "retries": 0, "agent": null},
    "8": {"status": "PENDING", "retries": 0, "agent": null}
  },
  "quality_metrics": {
    "tasks_passed_first_attempt": 1,
    "average_retries_per_task": 0.33,
    "total_qa_cycles": 3,
    "blockers_escalated": 0
  }
}
```

---

## 🎯 Benefits of Pipeline Pattern

### For Cooper (Orchestrator)
✅ **Systematic approach** - Clear phases, no guesswork
✅ **Quality gates** - Nothing advances without validation
✅ **Retry logic** - Automatic handling of failures
✅ **State tracking** - Always know pipeline status
✅ **HITL escalation** - Clear escalation paths

### For Team
✅ **Clear handoffs** - Each agent knows what's expected
✅ **Proper context** - Agents receive all needed information
✅ **Quality focus** - QA integrated into workflow, not afterthought
✅ **Evidence-based** - Decisions based on facts, not assumptions

### For Users
✅ **Predictable** - Consistent workflow every time
✅ **Transparent** - State tracking shows progress
✅ **High quality** - Quality gates prevent broken features
✅ **Recoverable** - Retry logic handles temporary failures

---

## 🚀 Usage in Cooper

Cooper can activate pipeline mode with user request:

```
User: "Use pipeline mode to implement the user authentication feature"

Cooper:
1. Verifies specification exists (or requests it)
2. Enters Phase 1 (Planning) - delegates to Vista/Sage
3. Waits for task list
4. Enters Phase 2 (Architecture) - delegates to Sage
5. Waits for architecture
6. Enters Phase 3 (Dev-QA Loop) - iterates through all tasks
7. Enters Phase 4 (Integration) - delegates to Vigil
8. Delivers final result to user

Throughout: Updates pipeline-state.json, provides status updates, escalates to HITL when needed
```

---

## 📝 Cooper's Status Reporting

During pipeline execution, Cooper provides regular updates:

```markdown
📊 Pipeline Status: {{PROJECT_NAME}}

**Current Phase**: Development-QA Loop (Phase 3/4)
**Progress**: 3 of 8 tasks complete (37%)
**Current Task**: Implementing OAuth provider integration
**Agent**: Forge
**QA Attempts**: 1 of 3

**Quality Metrics**:
- Tasks passed first attempt: 2/3 (67%)
- Average retries: 0.33
- QA cycles completed: 4
- Blockers escalated: 0

**Next Steps**:
1. Forge completes OAuth implementation
2. Vigil validates (attempt 1)
3. If PASS → Task 4 (User profile endpoints)
   If FAIL → Retry with feedback

**Estimated Completion**: 2-3 hours (based on current velocity)
```

---

**Adoption**: Cooper can adopt this pattern immediately. No code changes required - just follow the workflows in this document.

**Version**: 1.0
**Last Updated**: March 7, 2026
**Source**: Adapted from Agency-Agents "Agents Orchestrator" by @msitarzewski
