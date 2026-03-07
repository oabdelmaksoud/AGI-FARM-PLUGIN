# Agency-Agents Integration Guide

**Version**: 1.6.0
**Status**: ✅ Complete - 59 agents integrated
**Last Updated**: March 7, 2026

---

## 🎯 Overview

AGI Farm now includes **59 specialized agent personalities** from the [Agency-Agents](https://github.com/msitarzewski/agency-agents) repository by [@msitarzewski](https://github.com/msitarzewski). These battle-tested agents bring proven workflows, rich code examples, and strong personalities to your multi-agent teams.

### What You Get

- **59 Agent Templates** across 11 specializations
- **10,000+ lines** of personality definitions and workflows
- **Production-tested** patterns from real-world usage
- **Rich code examples** with technical deliverables
- **Zero additional dependencies** - pure markdown templates

### Total Agent Library

| Source | Count | Type |
|--------|-------|------|
| AGI Farm Defaults | 16 | Core team roles |
| ECC Resources | 16 | Production skills & agents |
| Agency-Agents | 59 | Specialized personalities |
| **TOTAL** | **91 agents** | Complete library |

---

## 📚 Agent Categories

### Engineering (7 agents)
Expert developers and technical specialists

| Agent | Role | Best For |
|-------|------|----------|
| Frontend Developer | React/Vue/Angular specialist | Modern web apps, UI implementation |
| Backend Architect | Scalable system design | Server-side architecture, APIs |
| Mobile App Builder | iOS/Android development | Native and cross-platform apps |
| AI Engineer | ML models and deployment | AI-powered features, data pipelines |
| DevOps Automator | CI/CD and infrastructure | Pipeline automation, cloud ops |
| Rapid Prototyper | Fast POC development | Quick MVPs, hackathons |
| Senior Developer | Laravel/Livewire expert | Complex implementations |

### Design (7 agents)
Visual and UX specialists

| Agent | Role | Best For |
|-------|------|----------|
| UI Designer | Visual design systems | Component libraries, design systems |
| UX Researcher | User testing and analysis | Usability testing, user insights |
| UX Architect | Technical UX foundation | CSS systems, implementation |
| Brand Guardian | Brand identity | Brand strategy, consistency |
| Visual Storyteller | Visual narratives | Brand storytelling, multimedia |
| **Whimsy Injector** | Delightful interactions | Micro-interactions, personality |
| Image Prompt Engineer | AI image generation | Midjourney/DALL-E prompts |

### Marketing (8 agents)
Growth and community specialists

| Agent | Role | Best For |
|-------|------|----------|
| Growth Hacker | Rapid user acquisition | Viral loops, conversion optimization |
| Content Creator | Multi-platform content | Content strategy, copywriting |
| Twitter Engager | Real-time engagement | Twitter/LinkedIn campaigns |
| TikTok Strategist | Viral content creation | Gen Z/Millennial audience |
| Instagram Curator | Visual storytelling | Instagram strategy, aesthetics |
| **Reddit Community Builder** | Authentic engagement | Community trust, Reddit marketing |
| App Store Optimizer | ASO and discoverability | App marketing, store optimization |
| Social Media Strategist | Cross-platform strategy | Multi-platform campaigns |

### Product (3 agents)
Product management and research

| Agent | Role | Best For |
|-------|------|----------|
| Sprint Prioritizer | Agile planning | Sprint planning, backlog management |
| Trend Researcher | Market intelligence | Market research, trend identification |
| Feedback Synthesizer | User feedback analysis | Product insights, priorities |

### Project Management (5 agents)
Coordination and execution

| Agent | Role | Best For |
|-------|------|----------|
| Studio Producer | High-level orchestration | Multi-project oversight |
| Project Shepherd | Cross-functional coordination | End-to-end project coordination |
| **Senior Project Manager** | Spec-to-task conversion | Realistic scoping, task planning |
| Studio Operations | Process optimization | Operational excellence |
| Experiment Tracker | A/B testing | Hypothesis validation, experiments |

### Testing (7 agents)
Quality assurance specialists

| Agent | Role | Best For |
|-------|------|----------|
| **Evidence Collector** | Screenshot-based QA | Visual proof, bug documentation |
| **Reality Checker** | Production readiness | Quality certification, release approval |
| Test Results Analyzer | Test evaluation | Quality metrics, coverage reporting |
| Performance Benchmarker | Performance testing | Speed testing, load testing |
| API Tester | API validation | Endpoint verification, integration QA |
| Tool Evaluator | Technology assessment | Tool selection, tech recommendations |
| Workflow Optimizer | Process improvement | Automation, efficiency gains |

### Support (6 agents)
Operations and support

| Agent | Role | Best For |
|-------|------|----------|
| Support Responder | Customer service | Issue resolution, support operations |
| Analytics Reporter | Data analysis | Business intelligence, KPI tracking |
| Finance Tracker | Financial planning | Budget management, cash flow |
| Infrastructure Maintainer | System reliability | Infrastructure management, monitoring |
| Legal Compliance Checker | Compliance review | Regulatory requirements, risk |
| Executive Summary Generator | C-suite communication | Executive reporting, strategic comms |

### Spatial Computing (6 agents)
Immersive technology specialists

| Agent | Role | Best For |
|-------|------|----------|
| XR Interface Architect | Spatial interaction design | AR/VR/XR interface design |
| macOS Spatial/Metal Engineer | Swift and Metal | macOS spatial computing, Vision Pro |
| XR Immersive Developer | WebXR development | Browser-based AR/VR |
| XR Cockpit Interaction Specialist | Cockpit controls | Immersive control systems |
| visionOS Spatial Engineer | Vision Pro apps | Apple Vision Pro development |
| Terminal Integration Specialist | CLI tools | Terminal workflows, developer tools |

### Specialized (7 agents)
Unique specialists

| Agent | Role | Best For |
|-------|------|----------|
| **Agents Orchestrator** | Multi-agent coordination | Pipeline management, workflows |
| Data Analytics Reporter | Business intelligence | Deep data analysis, strategic insights |
| LSP/Index Engineer | Code intelligence | LSP implementation, semantic indexing |
| Sales Data Extraction Agent | Excel monitoring | Sales metric extraction |
| Data Consolidation Agent | Sales aggregation | Territory summaries, pipeline snapshots |
| Report Distribution Agent | Automated delivery | Report distribution, scheduled sends |
| Agentic Identity Trust | Identity management | Trust systems, authentication |

### Strategy (3 agents)
Strategic planning and execution

| Agent | Role | Best For |
|-------|------|----------|
| Executive Brief | Strategic communication | Executive summaries, decision support |
| Quickstart | Rapid onboarding | Fast setup, getting started guides |
| Nexus Strategy | Product discovery | Market validation, strategic planning |

**Bold agents** = Highly recommended for immediate use

---

## 🚀 Quick Start

### Option 1: Use During Setup

```bash
# Run AGI Farm setup wizard
agi-farm setup

# When prompted for agent templates:
→ Select "Agency-Agents Library (59 specialized personalities)"

# Or combine libraries:
→ Select "All Libraries (AGI Farm + ECC + Agency-Agents = 91 agents)"

# Choose agents by category or search
```

### Option 2: Browse and Copy Manually

```bash
# Browse available Agency-Agents
ls -la ~/.openclaw/workspace/AGI-FARM-PLUGIN/templates/agency-agents/

# Copy a specific agent
cp templates/agency-agents/specialized/agents-orchestrator.md \\
   ~/.openclaw/workspace/agents-workspaces/orchestrator/SOUL.md

# Customize the SOUL.md file for your needs
```

### Option 3: Use Conversion Script

```bash
# Convert a custom agency-agent
cd ~/.openclaw/workspace/AGI-FARM-PLUGIN

node scripts/convert-agency-agent.js \\
  /path/to/custom-agent.md \\
  templates/agency-agents/custom/custom-agent.md
```

---

## 🌟 Recommended Starter Packs

### Startup MVP Team (5 agents)
Perfect for building and launching a product quickly

1. **Frontend Developer** - Build the React/Vue app
2. **Backend Architect** - Design API and database
3. **Growth Hacker** - Plan user acquisition
4. **Rapid Prototyper** - Fast iteration cycles
5. **Reality Checker** - Ensure quality before launch

**Use Case**: Ship faster with specialized expertise at every stage

---

### Marketing Campaign Team (5 agents)
Perfect for multi-channel marketing campaigns

1. **Content Creator** - Develop campaign content
2. **Twitter Engager** - Twitter strategy and execution
3. **Instagram Curator** - Visual content and stories
4. **Reddit Community Builder** - Authentic community engagement
5. **Analytics Reporter** - Track and optimize performance

**Use Case**: Multi-channel coordinated campaign with platform-specific expertise

---

### Enterprise Feature Team (6 agents)
Perfect for complex feature development

1. **Senior Project Manager** - Scope and task planning
2. **Senior Developer** - Complex implementation
3. **UI Designer** - Design system and components
4. **Experiment Tracker** - A/B test planning
5. **Evidence Collector** - Quality verification
6. **Reality Checker** - Production readiness

**Use Case**: Enterprise-grade delivery with quality gates and documentation

---

### Quality-First Team (4 agents)
Perfect for ensuring production-ready code

1. **Evidence Collector** - Screenshot-based QA (default: find 3-5 issues)
2. **Reality Checker** - Production certification (default: "NEEDS WORK")
3. **Performance Benchmarker** - Speed and load testing
4. **API Tester** - Comprehensive API validation

**Use Case**: Rigorous quality standards prevent production bugs

---

## 🎯 Standout Agents

### 1. Agents Orchestrator (specialized/)
**Why use it**: Meta-agent that orchestrates complete development pipelines

**Workflow**:
```
PM → ArchitectUX → [Dev ↔ QA Loop] → Integration
```

**Features**:
- Phase-based pipeline management
- Continuous quality loops (task-by-task validation)
- Intelligent retry logic (3 attempts with feedback)
- Quality gate enforcement
- Autonomous operation

**Perfect for**: Cooper (orchestrator) enhancement

---

### 2. Evidence Collector (testing/)
**Why use it**: Screenshot-obsessed QA specialist

**Philosophy**: "I don't just test your code - I default to finding 3-5 issues and require visual proof for everything."

**Workflow**:
1. Receive task to test
2. Capture screenshots of implementation
3. Default to finding 3-5 issues minimum
4. Provide visual evidence for all findings
5. Give PASS/FAIL decision with specific feedback

**Perfect for**: Vigil (quality assurance) enhancement

---

### 3. Reality Checker (testing/)
**Why use it**: Evidence-based certification

**Philosophy**: Default to "NEEDS WORK" unless overwhelming evidence proves production readiness

**Workflow**:
1. Review all Evidence Collector findings
2. Cross-validate with comprehensive automated screenshots
3. Default to "NEEDS WORK" stance
4. Require overwhelming proof for "PRODUCTION READY"
5. Provide certification with detailed report

**Perfect for**: Final release approval gates

---

### 4. Whimsy Injector (design/)
**Why use it**: Adds personality and delight

**Philosophy**: "Every playful element must serve a functional or emotional purpose. Design delight that enhances rather than distracts."

**Examples**:
- "Let me add a celebration animation that reduces task completion anxiety by 40%"
- Micro-interactions that provide user feedback
- Easter eggs that enhance brand personality
- Playful error messages that reduce frustration

**Perfect for**: Dashboard UX enhancement

---

### 5. Reddit Community Builder (marketing/)
**Why use it**: Authentic community engagement

**Philosophy**: "You're not marketing on Reddit - you're becoming a valued community member who happens to represent a brand."

**Approach**:
- Value-driven content (not promotional)
- Genuine participation in discussions
- Helpful responses and expertise sharing
- Building trust before mentioning product

**Perfect for**: Community-driven growth strategies

---

## 📊 Integration Statistics

### Conversion Results
- **Total Agents Converted**: 59
- **Categories**: 11
- **Conversion Errors**: 0
- **Success Rate**: 100%

### File Breakdown
```
templates/agency-agents/
├── engineering/        7 agents
├── design/             7 agents
├── marketing/          8 agents
├── product/            3 agents
├── project-management/ 5 agents
├── testing/            7 agents
├── support/            6 agents
├── spatial-computing/  6 agents
├── specialized/        7 agents
└── strategy/           3 agents

Total: 59 agent templates
```

### Library Comparison

| Metric | AGI Farm (before) | AGI Farm (after v1.6.0) |
|--------|-------------------|-------------------------|
| Total Agents | 32 (16 AGI + 16 ECC) | **91 (16 AGI + 16 ECC + 59 Agency)** |
| Categories | 8 | **19** |
| Code Examples | Moderate | **Extensive** |
| Workflow Templates | Basic | **Production-tested** |
| Community-tested | Yes (ECC) | **Yes (ECC + Agency)** |

---

## 🔧 Customization Guide

### Adapting an Agent

1. **Copy the template**:
   ```bash
   cp templates/agency-agents/engineering/engineering-frontend-developer.md \\
      ~/.openclaw/workspace/agents-workspaces/frontend-dev/SOUL.md
   ```

2. **Customize the personality**:
   - Edit the "Identity & Memory" section
   - Adjust "Critical Rules" for your context
   - Modify "Technical Deliverables" examples
   - Update "Communication Style"

3. **Add project-specific context**:
   ```markdown
   ## Project-Specific Context

   **Tech Stack**: React 18, TypeScript, Tailwind CSS
   **Code Style**: Prettier with semi-colons, 2-space indent
   **Testing**: Jest + React Testing Library
   **Deployment**: Vercel with preview deployments
   ```

4. **Test the agent**:
   ```bash
   # Start a session with the agent
   openclaw session start frontend-dev --message "Help me build a dashboard component"
   ```

---

## 🎓 Learning Resources

### Understanding Agent Personalities

Each agency-agent is designed with:

1. **Strong Personality** - Unique voice and communication style
2. **Clear Deliverables** - Concrete outputs with code examples
3. **Success Metrics** - Measurable outcomes
4. **Proven Workflows** - Step-by-step processes
5. **Learning Memory** - Pattern recognition and improvement

### Example: Evidence Collector Personality

```markdown
## 🧠 Your Identity & Memory
- **Role**: Screenshot-obsessed QA specialist
- **Personality**: Detail-oriented, evidence-driven, skeptical
- **Memory**: You remember what bugs look like visually
- **Experience**: You've seen products fail due to untested edge cases

## 🎯 Your Core Mission
- Default to finding 3-5 issues minimum
- Require screenshot evidence for all claims
- Give clear PASS/FAIL decisions with specific feedback
- Never let broken functionality advance to next phase
```

This personality **shapes behavior** - the agent will actively look for issues rather than assume everything works.

---

## 🔗 Attribution & License

### Original Repository
- **Repository**: https://github.com/msitarzewski/agency-agents
- **Author**: [@msitarzewski](https://github.com/msitarzewski)
- **License**: MIT License
- **Community**: 50+ requests in first 12 hours on Reddit

### Conversion for AGI Farm
- **Converted by**: AGI Farm Integration Team
- **Conversion Script**: `scripts/convert-agency-agent.js`
- **Format**: Agency-Agents markdown → AGI Farm SOUL.md
- **Preserves**: Personality, workflows, code examples, success metrics
- **Adds**: AGI Farm metadata, usage instructions, customization notes

### Using These Agents

✅ **Permitted**:
- Use in personal or commercial projects
- Modify and customize for your needs
- Share modified versions with attribution
- Contribute improvements back to community

❌ **Not Permitted**:
- Remove attribution to original author
- Claim as your own work
- Use in malicious or harmful ways

**Recommended Attribution**:
```markdown
Agent personality based on Agency-Agents by @msitarzewski
Repository: https://github.com/msitarzewski/agency-agents
Adapted for AGI Farm: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
```

---

## 🚀 Next Steps

### For New Users
1. **Run the wizard**: `agi-farm setup`
2. **Choose "All Libraries"** to access all 91 agents
3. **Select recommended starter pack** (Startup MVP, Marketing Campaign, etc.)
4. **Customize agents** for your project
5. **Launch your team** and start building

### For Existing Users
1. **Update AGI Farm**: `openclaw plugins update agi-farm`
2. **Browse new agents**: `ls templates/agency-agents/`
3. **Add to existing team**: Copy templates to agent workspaces
4. **Enhance current agents**: Merge Agency-Agents patterns into existing SOUL.md files

### For Advanced Users
1. **Study Agents Orchestrator** pattern for Cooper enhancement
2. **Implement Quality Gates** with Evidence Collector + Reality Checker
3. **Create custom workflows** combining multiple agent patterns
4. **Build agent marketplace** with community contributions

---

## 📚 Additional Resources

- **Full Analysis**: [AGENCY_AGENTS_INTEGRATION_ANALYSIS.md](AGENCY_AGENTS_INTEGRATION_ANALYSIS.md)
- **Conversion Script**: [scripts/convert-agency-agent.js](scripts/convert-agency-agent.js)
- **Original Repository**: https://github.com/msitarzewski/agency-agents
- **AGI Farm Plugin**: https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN
- **Examples**: See `templates/agency-agents/strategy/nexus-strategy.md` for 8-agent product discovery example

---

**Guide Version**: 1.0
**Last Updated**: March 7, 2026
**Plugin Version**: 1.6.0
