# Workflow Templates for AGI Farm

**Purpose**: Pre-built workflows for common team compositions
**Version**: 1.0 (v1.6.0)
**Based on**: Agency-Agents recommended starter packs + AGI Farm core agents

---

## 🎯 Overview

This document provides ready-to-use workflow templates for 4 common team compositions. Each template includes:
- **Team composition** - Which agents to deploy
- **Project setup** - How to structure the project
- **Cooper orchestration** - How Cooper coordinates the workflow
- **Success metrics** - How to measure effectiveness

---

## 🚀 Template 1: Startup MVP Team (5 Agents)

**Use Case**: Rapid prototype development, proof-of-concept, MVP launches
**Timeline**: 1-2 weeks for typical MVP
**Team Size**: 5 agents (1 orchestrator + 4 specialists)

### Team Composition

| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| **Cooper** | Orchestrator | Pipeline management, quality gates |
| **Forge** | Backend Developer | API, database, business logic |
| **Pixel** | Frontend Developer | UI implementation, user experience |
| **Vigil** | QA Specialist | Quality validation, evidence collection |
| **marketing-growth-hacker** | Growth | User acquisition, metrics, experimentation |

### Project Structure

```
startup-mvp-project/
├── project-specs/
│   └── mvp-setup.md              # Core feature specification
├── project-tasks/
│   └── mvp-tasklist.md           # Task breakdown
├── project-docs/
│   ├── mvp-architecture.md       # Technical architecture
│   └── mvp-growth-strategy.md    # Growth hacking plan
├── backend/                      # Forge's work
│   ├── api/
│   ├── database/
│   └── tests/
├── frontend/                     # Pixel's work
│   ├── src/
│   ├── public/
│   └── tests/
└── qa-evidence/                  # Vigil's validation evidence
    ├── screenshots/
    └── test-reports/
```

### Cooper's Orchestration Workflow

```markdown
## Startup MVP Pipeline (Cooper)

### Phase 1: Specification & Planning (Day 1)
1. Read project-specs/mvp-setup.md
2. Verify core features are clearly defined
3. Create initial task breakdown:
   - Backend tasks (API, database)
   - Frontend tasks (UI, UX)
   - Integration tasks
   - Growth experiment tasks

### Phase 2: Architecture Foundation (Day 1-2)
**Delegate to Forge**:
```
Create lean backend architecture for MVP:
- Database schema (PostgreSQL/MongoDB)
- REST API structure
- Authentication system (JWT)
- Core business logic

Priority: Speed over perfection, but maintain quality.
Output: mvp-architecture.md + foundation code
```

**Delegate to Pixel**:
```
Create frontend foundation:
- Component structure (React/Vue)
- Routing setup
- State management (lightweight)
- Design system (minimal, consistent)

Priority: Reusable components, clean UX.
Output: Frontend scaffold + component library
```

### Phase 3: Feature Development (Day 2-8)
**Dev-QA Loop for each feature**:

For Backend Features:
```
Cooper → Forge: "Implement Feature X from task list"
Forge → Implements API endpoints, business logic, tests
Cooper → Vigil: "Validate Feature X (Evidence Collector mode)"
Vigil → Tests API, checks coverage, security scan
IF Vigil PASS → Next feature
IF Vigil FAIL → Back to Forge with feedback (max 3 attempts)
```

For Frontend Features:
```
Cooper → Pixel: "Implement UI for Feature X"
Pixel → Builds components, integrates with API, tests
Cooper → Vigil: "Validate Feature X UI (Evidence Collector mode)"
Vigil → Tests workflows, screenshots, responsive design
IF Vigil PASS → Next feature
IF Vigil FAIL → Back to Pixel with feedback (max 3 attempts)
```

### Phase 4: Integration & Growth Setup (Day 8-10)
**Integration Testing**:
```
Cooper → Vigil: "Final integration validation (Reality Checker mode)"
Vigil → End-to-end tests, production readiness check
IF PRODUCTION READY → Proceed to growth experiments
IF NEEDS WORK → Address blockers
```

**Growth Hacking Setup**:
```
Cooper → marketing-growth-hacker:
"Set up growth experiments for MVP launch:
1. Analytics instrumentation (Mixpanel/Amplitude)
2. A/B testing framework
3. Viral loop mechanics (if applicable)
4. Launch plan (Product Hunt, Reddit, Twitter)
5. Key metrics dashboard"
```

### Phase 5: Launch & Iterate (Day 10-14)
1. Deploy to production
2. Monitor analytics (growth-hacker tracks metrics)
3. Run growth experiments
4. Collect user feedback
5. Plan next iteration based on data
```

### Success Metrics

**Development Velocity**:
- [ ] MVP features complete in ≤10 days
- [ ] Tasks pass QA first attempt: ≥70%
- [ ] Zero critical security issues
- [ ] Test coverage: ≥80%

**Product Quality**:
- [ ] All user workflows functional
- [ ] Production readiness: APPROVED
- [ ] No high-severity bugs in first week
- [ ] Page load time: <2s

**Growth Metrics** (post-launch):
- [ ] Analytics tracking: 100% of key events
- [ ] Conversion funnel mapped
- [ ] First experiment running within 48 hours
- [ ] User acquisition cost (UAC) calculated

---

## 📈 Template 2: Marketing Campaign Team (5 Agents)

**Use Case**: Product launches, campaigns, content marketing, community growth
**Timeline**: 2-4 weeks per campaign
**Team Size**: 5 agents (1 orchestrator + 4 marketing specialists)

### Team Composition

| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| **Cooper** | Orchestrator | Campaign coordination, timeline management |
| **marketing-content-creator** | Content | Blog posts, landing pages, email campaigns |
| **marketing-twitter-engager** | Twitter | Thought leadership, community engagement |
| **marketing-reddit-community-builder** | Reddit | Authentic community building, value-driven posts |
| **Analytics Reporter** | Analytics | Campaign performance, A/B testing, reporting |

### Project Structure

```
marketing-campaign-project/
├── project-specs/
│   └── campaign-setup.md          # Campaign goals, target audience
├── project-tasks/
│   └── campaign-tasklist.md       # Content calendar, tasks
├── content/
│   ├── blog-posts/                # Long-form content
│   ├── social-media/              # Twitter threads, Reddit posts
│   ├── email-campaigns/           # Email sequences
│   └── landing-pages/             # Campaign landing pages
├── assets/
│   ├── images/
│   ├── videos/
│   └── graphics/
├── analytics/
│   ├── performance-reports/
│   ├── ab-tests/
│   └── dashboards/
└── community/
    ├── reddit-engagement/
    ├── twitter-engagement/
    └── user-feedback/
```

### Cooper's Orchestration Workflow

```markdown
## Marketing Campaign Pipeline (Cooper)

### Phase 1: Campaign Strategy (Week 1, Day 1-2)
1. Read project-specs/campaign-setup.md
2. Verify campaign goals, target audience, success metrics
3. Create content calendar with milestones

**Delegate to Analytics Reporter**:
```
Analyze target audience and set up tracking:
1. Research competitor campaigns
2. Define key metrics (CAC, conversion rate, engagement)
3. Set up analytics infrastructure
4. Create baseline performance report

Output: campaign-analytics-plan.md
```

### Phase 2: Content Creation (Week 1-2)
**Multi-track parallel content development**:

**Track 1: Long-form Content**
```
Cooper → marketing-content-creator:
"Create campaign content series:
1. Hero blog post (2000+ words)
2. Supporting blog posts (3-5 posts)
3. Landing page copy
4. Email sequence (5 emails)

Tone: {{BRAND_VOICE}}
CTA: {{CONVERSION_GOAL}}
Output: content/blog-posts/, content/landing-pages/, content/email-campaigns/"
```

**Track 2: Twitter Engagement**
```
Cooper → marketing-twitter-engager:
"Build thought leadership campaign:
1. Twitter thread series (5 threads)
2. Daily engagement strategy
3. Influencer outreach list
4. Hashtag strategy

Timeline: Start 1 week before launch
Output: content/social-media/twitter/"
```

**Track 3: Reddit Community Building**
```
Cooper → marketing-reddit-community-builder:
"Authentic community engagement:
1. Identify relevant subreddits (5-10)
2. Build credibility (value-first posts)
3. Prepare launch post (NOT promotional)
4. Engagement plan (comments, AMAs)

Philosophy: 'Become valued member, not marketer'
Output: community/reddit-engagement/"
```

### Phase 3: Campaign Launch (Week 3)
**Coordinated multi-channel launch**:

Day 1 (Internal):
```
Cooper verification checklist:
- [ ] All content created and reviewed
- [ ] Landing pages deployed and tested
- [ ] Analytics tracking verified
- [ ] Email sequences loaded
- [ ] Social media scheduled
- [ ] Reddit credibility established
```

Day 2 (Soft Launch):
```
Cooper → marketing-twitter-engager: "Start Twitter thread series"
Cooper → marketing-reddit-community-builder: "Begin value-adding posts"
Cooper → Analytics Reporter: "Monitor early engagement"
```

Day 3-5 (Full Launch):
```
Cooper coordinates simultaneous push:
- Blog posts published
- Landing page live
- Email campaign starts
- Twitter amplification
- Reddit launch post (if appropriate)
```

### Phase 4: Performance Tracking (Week 3-4)
**Daily analytics review**:
```
Cooper → Analytics Reporter (daily):
"Campaign performance report:
1. Traffic sources breakdown
2. Conversion funnel metrics
3. Engagement rates (Twitter, Reddit, email)
4. Cost per acquisition
5. ROI calculation
6. Optimization recommendations

Output: analytics/performance-reports/day-{{N}}.md"
```

**Content iteration based on data**:
```
IF Analytics shows:
- Low email open rate → Cooper → marketing-content-creator: "Revise subject lines"
- Low landing page conversion → Cooper → marketing-content-creator: "A/B test CTAs"
- Low Reddit engagement → Cooper → marketing-reddit-community-builder: "Adjust strategy"
```

### Phase 5: Retrospective (Week 4)
```
Cooper → All agents:
"Campaign retrospective contributions:
1. What worked well?
2. What underperformed?
3. Unexpected insights?
4. Recommendations for next campaign?"

Cooper synthesizes into: campaign-retrospective.md
```
```

### Success Metrics

**Content Production**:
- [ ] All content delivered on schedule
- [ ] Content quality score: ≥8/10
- [ ] Zero missed deadlines
- [ ] Brand voice consistency: 100%

**Engagement**:
- [ ] Twitter impressions: {{TARGET}}
- [ ] Twitter engagement rate: ≥3%
- [ ] Reddit upvote ratio: ≥80%
- [ ] Email open rate: ≥25%
- [ ] Email click rate: ≥5%

**Conversion**:
- [ ] Landing page conversion: ≥{{TARGET}}%
- [ ] Cost per acquisition: ≤${{TARGET}}
- [ ] ROI: ≥3x
- [ ] New signups: ≥{{TARGET}}

---

## 🏢 Template 3: Enterprise Feature Team (6 Agents)

**Use Case**: Complex feature development, enterprise software, high-stakes projects
**Timeline**: 4-8 weeks per major feature
**Team Size**: 6 agents (1 orchestrator + 5 specialists)

### Team Composition

| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| **Cooper** | Orchestrator | Pipeline management, stakeholder coordination |
| **Vista** | Product Manager | Requirements analysis, stakeholder management |
| **Sage** | Senior Developer | Architecture, complex implementations |
| **Vigil** | QA Specialist | Comprehensive testing, quality gates |
| **Experiment Tracker** | A/B Testing | Feature experiments, data-driven decisions |
| **testing-reality-checker** | Final Certification | Production readiness, risk assessment |

### Project Structure

```
enterprise-feature-project/
├── project-specs/
│   ├── feature-requirements.md    # Stakeholder requirements
│   ├── technical-spec.md          # Technical specification
│   └── acceptance-criteria.md     # Definition of done
├── project-tasks/
│   ├── feature-tasklist.md
│   └── sprint-plan.md
├── project-docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── database-schema.md
│   ├── security-review.md
│   └── performance-requirements.md
├── implementation/
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   └── tests/
├── experiments/
│   ├── feature-flags/
│   ├── ab-tests/
│   └── rollout-plan.md
├── qa-evidence/
│   ├── unit-tests/
│   ├── integration-tests/
│   ├── security-scans/
│   ├── performance-benchmarks/
│   └── screenshots/
└── documentation/
    ├── user-guide.md
    ├── admin-guide.md
    ├── api-docs.md
    └── runbook.md
```

### Cooper's Orchestration Workflow

```markdown
## Enterprise Feature Pipeline (Cooper)

### Phase 1: Requirements & Planning (Week 1)
**Stakeholder alignment**:
```
Cooper → Vista:
"Requirements analysis and stakeholder management:
1. Review feature-requirements.md
2. Identify ambiguities and gaps
3. Conduct stakeholder interviews (HITL as needed)
4. Create comprehensive task breakdown
5. Estimate effort and timeline
6. Define acceptance criteria

Output:
- feature-tasklist.md
- acceptance-criteria.md
- sprint-plan.md"
```

**Quality gate**: Cooper verifies all requirements are EXACT and unambiguous.

### Phase 2: Technical Architecture (Week 1-2)
**Senior developer creates foundation**:
```
Cooper → Sage:
"Enterprise-grade architecture:
1. System design (scalability, reliability)
2. API contracts (versioned, backward-compatible)
3. Database schema (migrations, indexes)
4. Security architecture (auth, encryption, audit logs)
5. Performance requirements (latency, throughput)
6. Testing strategy (unit, integration, E2E)
7. Deployment architecture (blue-green, canary)

Constraints:
- Must integrate with existing systems
- Must meet enterprise security standards
- Must support 10,000+ concurrent users
- Must have 99.9% uptime

Output:
- architecture.md
- api-contracts.md
- database-schema.md
- security-review.md"
```

**Quality gate**: Cooper reviews architecture with Vista (product alignment) and Vigil (testability).

### Phase 3: Phased Implementation (Week 2-6)
**Sprint-based development with experiments**:

**Sprint 1-2: Core Functionality**
```
Cooper → Sage: "Implement Phase 1 tasks (core business logic)"
Sage → Implements backend, APIs, database

Cooper → Vigil: "Validate Phase 1 (Evidence Collector mode)"
Vigil → Comprehensive testing:
- Unit tests (≥90% coverage for enterprise)
- Integration tests
- Security scan (Grade A required)
- Performance benchmarks
- API contract validation

IF Vigil PASS → Proceed to Phase 2
IF Vigil FAIL → Back to Sage with detailed feedback (max 3 attempts)
```

**Sprint 3-4: Feature Completion**
```
Cooper → Sage: "Implement Phase 2 tasks (UI, advanced features)"
Sage → Completes implementation

Cooper → Experiment Tracker: "Set up feature flag and A/B test"
Experiment Tracker → Configures:
- Feature flag system (gradual rollout)
- A/B test framework (variant testing)
- Metrics tracking (hypothesis validation)
- Rollback mechanism

Cooper → Vigil: "Validate Phase 2 (Evidence Collector mode)"
Vigil → Full validation suite
```

**Sprint 5-6: Integration & Documentation**
```
Cooper → Sage: "Integration with existing systems"
Sage → Integrates, creates migration plan

Cooper → Vista: "Create user and admin documentation"
Vista → Writes comprehensive guides:
- User guide (screenshots, workflows)
- Admin guide (configuration, monitoring)
- API documentation (examples, edge cases)
- Runbook (troubleshooting, common issues)

Cooper → Vigil: "Final integration tests"
Vigil → End-to-end validation
```

### Phase 4: Production Readiness Certification (Week 7)
**Rigorous production certification**:
```
Cooper → testing-reality-checker:
"Enterprise production readiness certification:

Default assumption: NOT READY (prove otherwise)

Validation requirements:
1. Integration Testing
   - All user workflows (happy path + edge cases)
   - Cross-system integration verified
   - Data migration tested on production-like data
   - Rollback tested and verified

2. Security Audit (STRICT)
   - Security grade: A (zero tolerance for HIGH/CRITICAL)
   - Penetration testing completed
   - Compliance validated (SOC2, GDPR, etc.)
   - Audit logs comprehensive

3. Performance Validation (STRICT)
   - Load testing: 10,000 concurrent users
   - Latency (p95): <200ms
   - Database query performance: optimized
   - No memory leaks
   - Stress testing passed

4. Operational Readiness
   - Monitoring: All critical metrics
   - Alerting: Configured and tested
   - Rollback plan: Documented and tested
   - Runbook: Complete
   - On-call training: Completed

5. Documentation
   - User guide: Complete
   - Admin guide: Complete
   - API docs: Complete
   - Architecture docs: Current
   - Migration guide: Step-by-step

Provide PRODUCTION READY or NEEDS WORK certificate with overwhelming evidence."
```

**Quality gate**: PRODUCTION READY certificate required to proceed.

### Phase 5: Gradual Rollout (Week 8)
**Experiment-driven deployment**:
```
Cooper → Experiment Tracker:
"Execute gradual rollout plan:

Week 1: Internal users (5%)
Week 2: Beta customers (25%)
Week 3: General availability (100%)

For each phase:
1. Enable feature flag for cohort
2. Monitor metrics (errors, performance, engagement)
3. Collect user feedback
4. Validate hypothesis
5. Decision: Proceed, iterate, or rollback

Daily reports to Cooper with GO/NO-GO recommendation."
```

**Cooper monitors rollout**:
- Daily metrics review
- Incident tracking
- User feedback synthesis
- Go/No-Go decisions at each phase gate
```

### Success Metrics

**Development Quality**:
- [ ] Requirements fully met (100% of acceptance criteria)
- [ ] Test coverage: ≥90% (enterprise standard)
- [ ] Security grade: A (zero HIGH/CRITICAL issues)
- [ ] Performance benchmarks: All passed
- [ ] Tasks passed first QA attempt: ≥60%

**Production Readiness**:
- [ ] Production certification: APPROVED
- [ ] Load testing: 10,000+ concurrent users
- [ ] Rollback plan: Tested and verified
- [ ] Documentation: Complete and accurate
- [ ] Monitoring: All metrics tracked

**Business Impact** (post-launch):
- [ ] Feature adoption: ≥{{TARGET}}%
- [ ] User satisfaction: ≥8/10
- [ ] Zero critical incidents in first month
- [ ] Performance SLA: 99.9% uptime
- [ ] Experiment hypothesis: Validated

---

## 🔬 Template 4: Quality-First Team (4 Agents)

**Use Case**: Security-critical systems, regulated industries, zero-defect requirements
**Timeline**: Varies (quality-driven, not deadline-driven)
**Team Size**: 4 agents (1 orchestrator + 3 QA specialists)

### Team Composition

| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| **Cooper** | Orchestrator | Quality gate enforcement, risk management |
| **Vigil** (Evidence Collector) | Task-Level QA | Screenshot-based validation, comprehensive testing |
| **testing-reality-checker** | Production Certification | Production readiness, overwhelming evidence required |
| **testing-performance-benchmarker** | Performance QA | Load testing, stress testing, optimization |

**Note**: Development agents (Forge, Pixel, Sage) are used as needed, but QA agents are core team.

### Project Structure

```
quality-first-project/
├── project-specs/
│   ├── requirements.md
│   ├── security-requirements.md
│   └── compliance-requirements.md
├── qa-strategy/
│   ├── test-plan.md
│   ├── security-test-plan.md
│   ├── performance-test-plan.md
│   └── compliance-checklist.md
├── implementation/
│   └── [standard code structure]
├── qa-evidence/
│   ├── unit-tests/
│   ├── integration-tests/
│   ├── security-tests/
│   ├── performance-tests/
│   ├── compliance-evidence/
│   ├── screenshots/ (100+ files)
│   └── audit-trail/
├── quality-reports/
│   ├── daily-quality-metrics.md
│   ├── security-audit-reports/
│   ├── performance-reports/
│   └── final-certification.md
└── documentation/
    ├── security-documentation/
    ├── compliance-documentation/
    └── audit-reports/
```

### Cooper's Orchestration Workflow

```markdown
## Quality-First Pipeline (Cooper)

### Phase 1: Quality Planning (Before Development)
**Comprehensive quality strategy**:
```
Cooper creates quality plan:
1. Identify all quality requirements
2. Define quality gates for each task
3. Establish evidence requirements
4. Plan security testing strategy
5. Plan performance testing strategy
6. Define "done" criteria (strict)

Output: qa-strategy/test-plan.md
```

**Quality gates definition**:
```
Task-level quality gates:
- Unit test coverage: ≥95%
- Integration test coverage: ≥90%
- Security scan: Grade A (0 HIGH/CRITICAL)
- Code review: 2 reviewers
- Performance: No regressions
- Documentation: Complete

Feature-level quality gates:
- End-to-end tests: 100% pass
- Security penetration test: Pass
- Load testing: Performance targets met
- Compliance: All requirements met

Production quality gates:
- Integration testing: 100% pass
- Security audit: Clean
- Performance benchmarks: All met
- Compliance certification: Complete
- Risk assessment: Acceptable
```

### Phase 2: Development with Continuous QA (Iterative)
**Every task goes through rigorous QA loop**:

**Task Implementation**:
```
Cooper → [Developer Agent]: "Implement Task X"
Developer → Implements with TDD approach
Developer → Self-validates before QA submission
```

**Task-Level QA (Vigil - Evidence Collector)**:
```
Cooper → Vigil:
"Evidence Collector validation for Task X (Attempt {{N}}/5):

Quality requirements (STRICT):
- Unit tests: ≥95% coverage
- All edge cases: Tested with proof
- Security: Static analysis + manual review
- Performance: No regressions (benchmarks)
- Code quality: Lint pass, clean code principles
- Documentation: Function docs + integration docs

Evidence requirements:
- Test results: All outputs captured
- Coverage report: Detailed breakdown
- Security scan: Full report
- Code review: 2 reviewers signed off
- Screenshots: All workflows (if UI)

Default to finding 5-10 issues (higher bar for quality-first).
Max 5 retry attempts (vs. 3 in standard pipeline)."
```

**Quality gate decision**:
```
IF Vigil PASS (high confidence):
  Cooper → testing-performance-benchmarker: "Performance regression check"

  IF Performance PASS:
    Task approved → Next task
  ELSE:
    Back to developer with performance feedback
ELSE (Vigil FAIL):
  IF Attempt < 5:
    Back to developer with detailed feedback
  ELSE:
    Escalate to HITL with full evidence
```

### Phase 3: Feature-Level QA (Per Feature)
**After all tasks for a feature complete**:

**Integration Testing**:
```
Cooper → Vigil:
"Feature integration validation:
1. All user workflows end-to-end
2. Integration with other features
3. Error handling comprehensive
4. Security: Feature-level penetration test
5. Performance: Feature load test
6. Compliance: Feature compliance check

Evidence: ≥20 screenshots for this feature alone."
```

**Performance Testing**:
```
Cooper → testing-performance-benchmarker:
"Feature performance validation:
1. Load testing (realistic scenarios)
2. Stress testing (edge of failure)
3. Endurance testing (memory leaks)
4. Scalability testing (concurrent users)

Benchmarks must meet or exceed targets.
Evidence: Performance reports + graphs."
```

**Quality gate**: Both must PASS to proceed.

### Phase 4: Production Certification (Final)
**Reality Checker with MAXIMUM rigor**:
```
Cooper → testing-reality-checker:
"Production readiness certification (MAXIMUM RIGOR):

Default assumption: ABSOLUTELY NOT READY

Overwhelming evidence required for approval:

1. Functional Quality (NO EXCEPTIONS)
   - Integration tests: 100% pass (zero tolerance for failures)
   - E2E tests: 100% pass
   - All user workflows: Validated with screenshots
   - All edge cases: Handled with proof
   - Regression tests: 100% pass

2. Security Quality (ZERO TOLERANCE)
   - Security grade: A+ (not just A)
   - Penetration testing: PASSED
   - Vulnerability scan: 0 MEDIUM+ issues
   - Compliance: All requirements met with documentation
   - Audit trail: Complete and immutable

3. Performance Quality (STRICT)
   - Load testing: 2x expected load handled
   - Stress testing: Graceful degradation proven
   - Endurance testing: 72+ hours stable
   - Latency (p99): Meets targets (not just p95)
   - Zero memory leaks
   - Zero performance regressions

4. Operational Readiness (COMPREHENSIVE)
   - Monitoring: All metrics + alerts configured
   - Rollback: Tested multiple times successfully
   - Disaster recovery: Tested and documented
   - Runbook: Comprehensive (100+ scenarios)
   - On-call training: Completed and verified

5. Documentation (COMPLETE)
   - User documentation: Comprehensive
   - Admin documentation: Comprehensive
   - Security documentation: Compliance-ready
   - Architecture: Current and detailed
   - Audit documentation: Complete

6. Evidence Requirements (OVERWHELMING)
   - ≥50 screenshots (all workflows, all edge cases)
   - ≥100 test results
   - Full security audit report
   - Full performance test report
   - Compliance certification documents

ONLY provide PRODUCTION READY if you have OVERWHELMING evidence that system is ABSOLUTELY ready for production in a quality-critical environment.

Default to NEEDS WORK. Be EXTREMELY rigorous."
```

**Quality gate**: PRODUCTION READY certificate with overwhelming evidence required.

### Phase 5: Monitored Rollout (Post-Deployment)
**Continuous quality monitoring**:
```
Cooper → Vigil (daily for first month):
"Production quality monitoring:
1. Error rate: Must be <0.01%
2. Performance: Must meet SLAs
3. Security: Any incidents?
4. User feedback: Any quality concerns?

Provide daily quality report."
```

**Performance monitoring**:
```
Cooper → testing-performance-benchmarker (weekly):
"Production performance analysis:
1. Latency trends
2. Throughput trends
3. Resource utilization
4. Optimization opportunities

Weekly performance report."
```
```

### Success Metrics

**Quality Metrics** (Pre-Production):
- [ ] Unit test coverage: ≥95%
- [ ] Integration test coverage: ≥90%
- [ ] Security grade: A+
- [ ] Security vulnerabilities: 0 MEDIUM+
- [ ] Performance benchmarks: All met (with margin)
- [ ] Tasks passed first QA: ≥50% (higher bar = lower first-pass)
- [ ] Evidence files: ≥200 (screenshots + reports)

**Production Certification**:
- [ ] Integration tests: 100% pass
- [ ] E2E tests: 100% pass
- [ ] Security: Penetration test PASSED
- [ ] Performance: 2x load capacity proven
- [ ] Endurance: 72+ hours stable
- [ ] Compliance: All requirements met
- [ ] Documentation: 100% complete
- [ ] Production certificate: APPROVED with overwhelming evidence

**Post-Production** (First Month):
- [ ] Error rate: <0.01%
- [ ] Performance SLA: 99.99% uptime
- [ ] Security incidents: 0
- [ ] Performance regressions: 0
- [ ] User-reported bugs: <5 (minor only)

---

## 🎛️ Dashboard Integration (Future)

### Projects Tab - Workflow Template Selector

**UI Mockup**:
```
┌─────────────────────────────────────────────────────┐
│ Create New Project                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Project Name: [___________________________]        │
│                                                     │
│ Workflow Template:                                 │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 🚀 Startup MVP Team                          │   │
│ │ Timeline: 1-2 weeks | Agents: 5              │   │
│ │ Best for: Rapid prototypes, MVP launches     │   │
│ │                                   [Select]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📈 Marketing Campaign Team                   │   │
│ │ Timeline: 2-4 weeks | Agents: 5              │   │
│ │ Best for: Product launches, campaigns        │   │
│ │                                   [Select]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 🏢 Enterprise Feature Team                   │   │
│ │ Timeline: 4-8 weeks | Agents: 6              │   │
│ │ Best for: Complex features, enterprise       │   │
│ │                                   [Select]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 🔬 Quality-First Team                        │   │
│ │ Timeline: Varies | Agents: 4                 │   │
│ │ Best for: Security-critical, regulated       │   │
│ │                                   [Select]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ ⚙️ Custom Team                               │   │
│ │ Build your own team composition              │   │
│ │                                   [Select]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│                              [Cancel] [Create]     │
└─────────────────────────────────────────────────────┘
```

### API Endpoints (Future Implementation)

```javascript
// POST /api/projects
// Body:
{
  "name": "My Startup MVP",
  "workflowTemplate": "startup-mvp", // or "marketing-campaign", "enterprise-feature", "quality-first", "custom"
  "spec": "# Product Specification\n...",
  "customAgents": [] // if template === "custom"
}

// Response:
{
  "projectId": "uuid",
  "name": "My Startup MVP",
  "workflowTemplate": "startup-mvp",
  "agents": [
    {"id": "cooper", "role": "orchestrator"},
    {"id": "forge", "role": "backend"},
    {"id": "pixel", "role": "frontend"},
    {"id": "vigil", "role": "qa"},
    {"id": "marketing-growth-hacker", "role": "growth"}
  ],
  "status": "planning",
  "created": "2026-03-07T10:00:00Z"
}
```

---

## 📚 References

- **Orchestration Patterns**: templates/ORCHESTRATION_PATTERNS.md
- **Quality Gate Patterns**: templates/QUALITY_GATE_PATTERNS.md
- **Agency-Agents Guide**: AGENCY_AGENTS_GUIDE.md
- **ECC Skills**: Templates for @tdd-workflow, @security-scan, @verification-loop

---

**Adoption**: These workflow templates can be used immediately. Cooper can reference this document when starting projects to activate appropriate workflow patterns.

**Version**: 1.0
**Last Updated**: March 7, 2026
**Source**: Combination of Agency-Agents recommended starter packs + AGI Farm core agents + ECC skills
