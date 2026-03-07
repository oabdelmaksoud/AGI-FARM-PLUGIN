# Agent Marketplace Foundation

**Version**: 1.0 (v1.6.0 - Foundation)
**Purpose**: Browse, search, and install agent templates from multiple sources
**Status**: Design & Foundation (Phase 5 of Agency-Agents Integration)

---

## 🎯 Vision

The Agent Marketplace provides a unified interface for discovering and installing agent personalities from multiple sources:
- **AGI Farm Core** - 16 foundational agents (Cooper, Forge, Pixel, Vigil, etc.)
- **Everything Claude Code (ECC)** - 16 specialized agents with 69 skills
- **Agency-Agents** - 59 battle-tested personalities across 11 categories
- **Community** - User-contributed agent templates (future)

---

## 📊 Current State (v1.6.0)

### Available Agents

| Source | Count | Categories | Status |
|--------|-------|------------|--------|
| **AGI Farm** | 16 | Core team roles | ✅ Installed |
| **ECC** | 16 | Domain specialists | ✅ Installed |
| **Agency-Agents** | 59 | 11 specializations | ✅ Installed |
| **Community** | 0 | N/A | 🔮 Future |
| **Total** | **91** | **19 unique** | — |

### Agent Categories

```
AGI Farm Core (16):
- Orchestration: Cooper
- Development: Sage, Forge, Pixel
- QA: Vigil
- Product: Vista
- Design: Palette
- DevOps: Harbor
- Data: Loom
- Security: Shield
- ... (7 more)

ECC (16):
- Agent SDK: agent-sdk-verifier-ts, agent-sdk-verifier-py
- Code Quality: code-simplifier, code-reviewer
- Deployment: bug-analyzer
- Documentation: story-generator, dev-planner
- UI/UX: ui-sketcher
- ... (8 more)

Agency-Agents (59):
- Engineering (7): Frontend Developer, Backend Architect, AI Engineer, DevOps Automator, Mobile Builder, Rapid Prototyper, XR Developer
- Design (7): UI Designer, UX Researcher, Brand Guardian, Visual Storyteller, Whimsy Injector, XR Interface Architect
- Marketing (8): Growth Hacker, Content Creator, Twitter Engager, Instagram Curator, TikTok Strategist, Reddit Community Builder, App Store Optimizer
- Product (3): Sprint Prioritizer, Trend Researcher, Feedback Synthesizer
- Project Management (5): Senior PM, Project Shepherd, Studio Producer, Studio Operations, Experiment Tracker
- Testing (7): Evidence Collector, Reality Checker, API Tester, Performance Benchmarker, Test Results Analyzer, Tool Evaluator
- Support (6): Support Responder, Analytics Reporter, Finance Tracker, Infrastructure Maintainer, Legal Compliance, Workflow Optimizer
- Spatial Computing (6): XR Interface Architect, XR Cockpit Specialist, XR Immersive Developer, visionOS Engineer, macOS Spatial/Metal Engineer, WebXR Developer
- Specialized (7): Agents Orchestrator, Data Analytics Reporter, LSP/Index Engineer, + 4 more
- Strategy (3): Executive Brief, Nexus Strategy, Quickstart
```

---

## 🏗️ Architecture

### Data Model

```typescript
interface AgentTemplate {
  // Identity
  id: string;                    // Unique identifier (e.g., "agency-agents-evidence-collector")
  name: string;                  // Display name (e.g., "Evidence Collector")
  slug: string;                  // URL-friendly (e.g., "evidence-collector")

  // Source
  source: 'agi-farm' | 'ecc' | 'agency-agents' | 'community';
  sourceUrl: string;             // Original repository URL
  author: string;                // Creator (e.g., "@msitarzewski")
  authorUrl?: string;            // Creator profile URL

  // Classification
  category: string;              // Primary category (e.g., "testing")
  tags: string[];                // Search tags (e.g., ["qa", "screenshots", "evidence-based"])
  specialization?: string;       // Sub-category (e.g., "Evidence-Based QA")

  // Content
  description: string;           // Short description (1-2 sentences)
  longDescription?: string;      // Detailed description (markdown)
  personality?: string;          // Personality traits (e.g., "Systematic, thorough, evidence-focused")
  philosophy?: string;           // Core philosophy (e.g., "Default to finding 3-5 issues")

  // Usage
  useCases: string[];            // When to use (e.g., ["Task-level QA", "Screenshot validation"])
  workflows?: string[];          // Common workflows
  codeExamples?: string[];       // Code snippets

  // Metadata
  version: string;               // Template version
  installedVersion?: string;     // Currently installed version
  installed: boolean;            // Is this template installed?
  recommended: boolean;          // Is this a recommended template?
  featured: boolean;             // Is this featured in the marketplace?

  // Quality Metrics
  rating?: number;               // Average rating (1-5 stars) - future
  downloads?: number;            // Download count - future
  verified: boolean;             // Verified by AGI Farm team

  // Technical
  templatePath: string;          // File path to SOUL.md template
  dependencies?: string[];       // Required agents/skills
  compatibleWith?: string[];     // Compatible agent versions

  // Timestamps
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  lastSync?: string;             // Last synced from source
}

interface AgentCategory {
  id: string;                    // Category identifier
  name: string;                  // Display name
  description: string;           // Category description
  icon: string;                  // Emoji or icon identifier
  count: number;                 // Number of agents in category
  sources: string[];             // Which sources provide agents in this category
}

interface AgentSource {
  id: 'agi-farm' | 'ecc' | 'agency-agents' | 'community';
  name: string;                  // Display name
  description: string;           // Source description
  url: string;                   // Source repository URL
  verified: boolean;             // Is this an official source?
  count: number;                 // Number of agents from this source
  lastUpdated: string;           // Last update timestamp
  updateAvailable: boolean;      // Are updates available?
}

interface MarketplaceFilters {
  search?: string;               // Search query
  category?: string;             // Filter by category
  source?: string;               // Filter by source
  tags?: string[];               // Filter by tags
  installed?: boolean;           // Show only installed/uninstalled
  featured?: boolean;            // Show only featured
  recommended?: boolean;         // Show only recommended
  sortBy?: 'name' | 'rating' | 'downloads' | 'recent' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
```

### API Endpoints

```typescript
// GET /api/marketplace/agents
// List all available agent templates
// Query params: ?search=&category=&source=&installed=&featured=&sortBy=&sortOrder=
// Response: { agents: AgentTemplate[], total: number, filters: MarketplaceFilters }

// GET /api/marketplace/agents/:id
// Get detailed information about a specific agent
// Response: AgentTemplate with full details

// GET /api/marketplace/categories
// List all categories with agent counts
// Response: { categories: AgentCategory[] }

// GET /api/marketplace/sources
// List all sources with metadata
// Response: { sources: AgentSource[] }

// POST /api/marketplace/agents/:id/install
// Install an agent template
// Body: { workspaceName?: string }
// Response: { success: boolean, installedPath: string }

// POST /api/marketplace/agents/:id/uninstall
// Uninstall an agent template (if installed)
// Response: { success: boolean }

// POST /api/marketplace/agents/:id/update
// Update an installed agent to latest version
// Response: { success: boolean, previousVersion: string, newVersion: string }

// POST /api/marketplace/sync
// Sync marketplace data from all sources
// Response: { success: boolean, synced: { [source]: number } }
```

### Client API Functions

```javascript
// Add to dashboard-react/src/lib/api.js

// Marketplace: List agents
export async function listMarketplaceAgents(filters = {}) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== '' && value !== 'all') {
      if (Array.isArray(value)) {
        value.forEach(v => qs.append(key, String(v)));
      } else {
        qs.set(key, String(value));
      }
    }
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiGet(`/api/marketplace/agents${suffix}`);
}

// Marketplace: Get agent details
export async function getMarketplaceAgent(agentId) {
  return apiGet(`/api/marketplace/agents/${agentId}`);
}

// Marketplace: List categories
export async function listMarketplaceCategories() {
  return apiGet('/api/marketplace/categories');
}

// Marketplace: List sources
export async function listMarketplaceSources() {
  return apiGet('/api/marketplace/sources');
}

// Marketplace: Install agent
export async function installMarketplaceAgent(agentId, workspaceName = null) {
  return apiPost(`/api/marketplace/agents/${agentId}/install`, { workspaceName });
}

// Marketplace: Uninstall agent
export async function uninstallMarketplaceAgent(agentId) {
  return apiPost(`/api/marketplace/agents/${agentId}/uninstall`);
}

// Marketplace: Update agent
export async function updateMarketplaceAgent(agentId) {
  return apiPost(`/api/marketplace/agents/${agentId}/update`);
}

// Marketplace: Sync all sources
export async function syncMarketplace() {
  return apiPost('/api/marketplace/sync');
}
```

---

## 🎨 UI Design

### Marketplace Tab (New Dashboard Tab)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🦅 AGI Ops Room  │  Overview  Agents  Projects  Marketplace  HITL  ... │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🏪 Agent Marketplace                              [🔄 Sync Sources]  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Search agents...                                         [🔍]    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Filters:                                                              │
│  [All Sources ▾]  [All Categories ▾]  [All Agents ▾]  [Sort: Name ▾] │
│  ☐ Installed Only  ☐ Featured Only  ☐ Recommended                     │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 91 agents found                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ ⭐ Featured                                                      │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────┐   │  │
│  │  │ 🎭 Agents          │  │ 🔍 Evidence        │  │ 🛡️ Real │   │  │
│  │  │    Orchestrator    │  │    Collector       │  │    Check│   │  │
│  │  │                    │  │                    │  │    er   │   │  │
│  │  │ Pipeline manager   │  │ Screenshot-based   │  │ Prod.   │   │  │
│  │  │ Agency-Agents      │  │ QA validation      │  │ ready   │   │  │
│  │  │ ✅ Installed       │  │ Agency-Agents      │  │ Agency  │   │  │
│  │  │                    │  │ ✅ Installed       │  │ ✅ Inst │   │  │
│  │  │    [View Details]  │  │    [View Details]  │  │ [View]  │   │  │
│  │  └────────────────────┘  └────────────────────┘  └─────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 🧪 Testing (7 agents)                                           │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  [ Evidence Collector ] [ Reality Checker ] [ Performance       │  │
│  │    Benchmarker ] [ API Tester ] [ Test Results Analyzer ]       │  │
│  │    [ Tool Evaluator ]                                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 💻 Engineering (7 agents)                                       │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  [ Frontend Developer ] [ Backend Architect ] [ AI Engineer ]   │  │
│  │    [ DevOps Automator ] [ Mobile Builder ] [ Rapid Prototyper ] │  │
│  │    [ XR Developer ]                                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ... (more categories)                                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Agent Detail Modal

```
┌────────────────────────────────────────────────────────────────┐
│ Agent Details                                       [✕ Close]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔍 Evidence Collector                                 ⭐ 4.8  │
│  by @msitarzewski (Agency-Agents)            ✅ Installed     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Screenshot-obsessed QA specialist requiring visual       │ │
│  │ proof for everything. Default to finding 3-5 issues      │ │
│  │ minimum.                                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Category: Testing  │  Source: Agency-Agents  │  v1.0         │
│                                                                │
│  📋 Use Cases                                                  │
│  • Task-level QA validation in Dev-QA loops                   │
│  • Screenshot-based evidence collection                       │
│  • Systematic issue discovery (functional, security, perf.)   │
│  • PASS/FAIL decisions with specific feedback                 │
│                                                                │
│  💭 Philosophy                                                 │
│  "Default to finding 3-5 issues minimum. Require visual       │
│   proof for all validation claims. Evidence over assumptions."│
│                                                                │
│  🔧 Recommended For                                            │
│  • Cooper's Dev-QA Loop (Phase 3)                             │
│  • Vigil enhancements (evidence-based QA)                     │
│  • Quality-First teams                                        │
│  • Enterprise Feature teams                                   │
│                                                                │
│  📦 Dependencies                                               │
│  • None (standalone agent)                                    │
│                                                                │
│  🔗 Resources                                                  │
│  • Template: templates/agency-agents/testing/evidence-qa.md   │
│  • Guide: AGENCY_AGENTS_GUIDE.md                              │
│  • Patterns: templates/QUALITY_GATE_PATTERNS.md               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  [✓ Installed]  [Update Available: v1.1]  [Uninstall]   │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Source Filter Badges

```
┌─────────────────────────────────────────────────────┐
│ Filter by Source:                                   │
│                                                     │
│  [✓ AGI Farm (16)]  [✓ ECC (16)]                   │
│  [✓ Agency-Agents (59)]  [ Community (0)]          │
│                                                     │
│  91 agents total                                    │
└─────────────────────────────────────────────────────┘
```

---

## 📂 File Structure

```
AGI-FARM-PLUGIN/
├── marketplace/
│   ├── registry.json              # Marketplace registry (generated)
│   ├── sources/
│   │   ├── agi-farm.json          # AGI Farm source metadata
│   │   ├── ecc.json               # ECC source metadata
│   │   ├── agency-agents.json     # Agency-Agents source metadata
│   │   └── community.json         # Community source metadata (future)
│   ├── agents/
│   │   ├── agi-farm/
│   │   │   ├── cooper.json        # Cooper metadata
│   │   │   ├── forge.json         # Forge metadata
│   │   │   └── ...
│   │   ├── ecc/
│   │   │   ├── code-reviewer.json
│   │   │   └── ...
│   │   └── agency-agents/
│   │       ├── agents-orchestrator.json
│   │       ├── evidence-collector.json
│   │       └── ...
│   └── categories.json             # Category definitions
├── scripts/
│   └── sync-marketplace.js        # Sync marketplace registry
└── dashboard-react/
    └── src/
        ├── components/
        │   └── Marketplace/
        │       ├── MarketplacePage.jsx       # Main marketplace UI
        │       ├── AgentCard.jsx             # Agent card component
        │       ├── AgentDetailModal.jsx      # Detail modal
        │       ├── CategoryFilter.jsx        # Category filter
        │       └── SourceFilter.jsx          # Source filter
        └── lib/
            └── api.js                         # API functions (extended)
```

---

## 🔧 Implementation Plan

### Phase 5.1: Data Layer (Completed in v1.6.0 Foundation)
- [x] Define data models (AgentTemplate, AgentCategory, AgentSource)
- [x] Create marketplace file structure
- [x] Document API endpoints
- [x] Document client API functions

### Phase 5.2: Registry Generation (Future: v1.7.0)
- [ ] Create `scripts/sync-marketplace.js` to scan template directories
- [ ] Extract metadata from SOUL.md templates (frontmatter + content)
- [ ] Generate `marketplace/registry.json` with all agents
- [ ] Generate individual agent JSON files in `marketplace/agents/`
- [ ] Create category mapping and counts
- [ ] Add to build process

### Phase 5.3: Backend API (Future: v1.7.0)
- [ ] Implement `GET /api/marketplace/agents` (list with filters)
- [ ] Implement `GET /api/marketplace/agents/:id` (details)
- [ ] Implement `GET /api/marketplace/categories` (categories)
- [ ] Implement `GET /api/marketplace/sources` (sources)
- [ ] Implement `POST /api/marketplace/agents/:id/install` (install)
- [ ] Implement `POST /api/marketplace/sync` (refresh registry)

### Phase 5.4: Frontend UI (Future: v1.7.0)
- [ ] Create `MarketplacePage.jsx` with grid layout
- [ ] Create `AgentCard.jsx` component
- [ ] Create `AgentDetailModal.jsx` with full details
- [ ] Create `CategoryFilter.jsx` and `SourceFilter.jsx`
- [ ] Implement search functionality
- [ ] Add sort options (name, rating, downloads, recent)
- [ ] Add "Installed" badges
- [ ] Add "Update Available" indicators

### Phase 5.5: Installation Flow (Future: v1.8.0)
- [ ] Implement one-click install (copy SOUL.md to workspace)
- [ ] Add installation confirmation
- [ ] Add uninstall capability
- [ ] Add update mechanism (check for newer versions)
- [ ] Integrate with wizard (`agi-farm setup` agent selection)

### Phase 5.6: Community Features (Future: v2.0.0)
- [ ] Community agent submission workflow
- [ ] Rating and review system
- [ ] Download tracking
- [ ] Agent verification process
- [ ] Popular/Trending sections
- [ ] Search by tags

---

## 🎯 Success Metrics

### v1.6.0 (Foundation - Current)
- [x] Data models documented
- [x] API endpoints specified
- [x] UI mockups created
- [x] File structure defined
- [x] Implementation plan created

### v1.7.0 (Basic Marketplace - Future)
- [ ] All 91 agents indexed in registry
- [ ] Browse by category functional
- [ ] Search functional
- [ ] Agent details viewable
- [ ] One-click install working
- [ ] Dashboard tab live

### v1.8.0 (Enhanced Features - Future)
- [ ] Source filtering working
- [ ] Update detection functional
- [ ] Uninstall capability
- [ ] Featured/Recommended sections
- [ ] Integration with setup wizard

### v2.0.0 (Community Marketplace - Future)
- [ ] Community submission workflow
- [ ] Rating system (≥50 ratings)
- [ ] ≥10 community-contributed agents
- [ ] Popular/Trending algorithms
- [ ] Verification badges

---

## 🚀 Quick Start (Future)

### For Users
```bash
# Option 1: Dashboard UI
# 1. Open dashboard → Marketplace tab
# 2. Browse or search for agents
# 3. Click "Install" on desired agent
# 4. Agent SOUL.md copied to workspace
# 5. Use in next team generation

# Option 2: Setup Wizard Integration
agi-farm setup
# → Team size? "Custom"
# → Browse marketplace to select agents
# → Wizard generates team with selected agents
```

### For Developers
```javascript
// Programmatic marketplace access
import {
  listMarketplaceAgents,
  getMarketplaceAgent,
  installMarketplaceAgent
} from './lib/api.js';

// List all testing agents
const testingAgents = await listMarketplaceAgents({
  category: 'testing',
  source: 'agency-agents'
});

// Get Evidence Collector details
const agent = await getMarketplaceAgent('agency-agents-evidence-collector');

// Install agent
await installMarketplaceAgent('agency-agents-evidence-collector');
```

---

## 📚 References

- **Agent Templates**:
  - AGI Farm: `templates/*.md` (16 agents)
  - ECC: `templates/ecc/*.md` (16 agents)
  - Agency-Agents: `templates/agency-agents/*/*.md` (59 agents)

- **Guides**:
  - [Agency-Agents Integration Guide](AGENCY_AGENTS_GUIDE.md)
  - [ECC Integration Guide](docs/ECC_INTEGRATION_GUIDE.md)
  - [Orchestration Patterns](templates/ORCHESTRATION_PATTERNS.md)
  - [Quality Gate Patterns](templates/QUALITY_GATE_PATTERNS.md)
  - [Workflow Templates](templates/WORKFLOW_TEMPLATES.md)

---

**Version**: 1.0 (Foundation)
**Status**: Design Complete, Implementation: Future (v1.7.0+)
**Last Updated**: March 7, 2026

---

## 💡 Future Enhancements

### v2.1.0: Advanced Search
- Full-text search across agent descriptions
- Tag-based filtering with AND/OR logic
- "Similar agents" recommendations
- "Frequently installed together" suggestions

### v2.2.0: Agent Bundles
- Pre-configured team bundles (e.g., "Startup MVP Pack")
- One-click install entire teams
- Bundle versioning
- Custom bundle creation

### v2.3.0: Analytics
- Usage analytics per agent
- Success metrics tracking
- A/B testing different agents for same role
- Performance comparisons

### v3.0.0: Ecosystem
- Third-party marketplace support
- Private marketplace hosting
- Enterprise agent catalogs
- Marketplace API for external tools
