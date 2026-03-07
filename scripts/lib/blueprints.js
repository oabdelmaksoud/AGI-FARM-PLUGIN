/**
 * AGI Farm Team Blueprints (v2.0)
 * 15 specialized blueprints across 5 industry verticals
 */

export const TEAM_BLUEPRINTS = {
    // ── Software Engineering ───────────────────────────────────────────────────
    'startup-mvp': {
        name: 'Startup MVP',
        emoji: '🚀',
        industry: 'Software Engineering',
        description: 'Rapid prototype development, proof-of-concept, MVP launches',
        timeline: '1-2 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Backend Developer', workspace: 'forge' },
            { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Frontend Developer', workspace: 'pixel' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Specialist', workspace: 'vigil' },
            { id: 'growth-hacker', template: 'agency-agents/marketing/growth-hacker.md', name: 'Growth Hacker', emoji: '📈', role: 'Growth & Experiments', workspace: 'growth-hacker' }
        ],
        okrs: [
            { objective: 'Launch functional MVP', keyResults: ['Complete 5 core features', 'Zero critical bugs in production'] },
            { objective: 'Establish growth foundation', keyResults: ['Set up 3 growth experiments', 'Integrate analytics tracking'] }
        ],
        crons: ['security-scan', 'velocity-report'],
        featureFlags: { jobs: true, skills: true, memory: true, policy: true, approvals: true, metering: true },
        hitlPolicy: { threshold: 0.7 },
        starterProject: {
            name: 'MVP Launch',
            description: 'Initial build and launch of the minimum viable product',
            tasks: [
                { id: 'mvp-1', title: 'Architect core backend', assigned_to: 'forge' },
                { id: 'mvp-2', title: 'Implement hero section UI', assigned_to: 'pixel' }
            ]
        }
    },
    'fullstack-product': {
        name: 'Full-Stack Product',
        emoji: '🌐',
        industry: 'Software Engineering',
        description: 'Professional product development with full lifecycle support',
        timeline: '4-8 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Product Manager', workspace: 'vista' },
            { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Backend/API Developer', workspace: 'forge' },
            { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Frontend/UI Developer', workspace: 'pixel' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Engineer', workspace: 'vigil' },
            { id: 'devops', template: 'agency-agents/engineering/devops-automator.md', name: 'DevOps', emoji: '♾️', role: 'Infrastructure/CI/CD', workspace: 'devops' }
        ],
        okrs: [
            { objective: 'Build robust product architecture', keyResults: ['Design scalable database schema', 'Document all API contracts'] },
            { objective: 'High-quality implementation', keyResults: ['Maintain >80% test coverage', 'Pass all integration tests'] }
        ],
        crons: ['security-scan', 'velocity-report', 'budget-check'],
        featureFlags: { jobs: true, skills: true, memory: true, policy: true, approvals: true, metering: true },
        hitlPolicy: { threshold: 0.75 },
        starterProject: {
            name: 'Project Foundation',
            description: 'Setting up the base architecture and core features',
            tasks: [
                { id: 'base-1', title: 'Define product requirements', assigned_to: 'vista' },
                { id: 'base-2', title: 'Configure CI/CD pipeline', assigned_to: 'devops' }
            ]
        }
    },
    'mobile-first': {
        name: 'Mobile-First App',
        emoji: '📱',
        industry: 'Software Engineering',
        description: 'iOS/Android focus with cross-platform excellence',
        timeline: '3-6 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'mobile-builder', template: 'agency-agents/engineering/mobile-app-builder.md', name: 'Mobile Build', emoji: '📲', role: 'Cross-Platform Dev', workspace: 'mobile' },
            { id: 'ui-designer', template: 'agency-agents/design/ui-designer.md', name: 'Designer', emoji: '🎨', role: 'Mobile UI/UX', workspace: 'designer' },
            { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'Mobile API/Backend', workspace: 'forge' },
            { id: 'performance', template: 'agency-agents/testing/performance-benchmarker.md', name: 'Perf Check', emoji: '⚡', role: 'Quality & Speed', workspace: 'perf' }
        ],
        okrs: [
            { objective: 'App Store Readiness', keyResults: ['Pass all mobile performance benchmarks', 'Complete all UI/UX mobile screens'] }
        ],
        crons: ['security-scan', 'velocity-report'],
        featureFlags: { jobs: true, skills: true, memory: true, policy: true, approvals: true, metering: true },
        hitlPolicy: { threshold: 0.7 },
        starterProject: {
            name: 'Mobile MVP',
            description: 'First version of the mobile application',
            tasks: [
                { id: 'mob-1', title: 'Design mobile navigation flow', assigned_to: 'ui-designer' },
                { id: 'mob-2', title: 'Setup mobile build environment', assigned_to: 'mobile-builder' }
            ]
        }
    },
    'ai-ml-system': {
        name: 'AI/ML System',
        emoji: '🧠',
        industry: 'Software Engineering',
        description: 'Data science, model training, and AI feature engineering',
        timeline: '4-12 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'ai-engineer', template: 'agency-agents/engineering/ai-engineer.md', name: 'ML Engineer', emoji: '🧪', role: 'Model & Training', workspace: 'ml-eng' },
            { id: 'researcher', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Data Researcher', workspace: 'research' },
            { id: 'nova', template: 'SOUL.md.nova', name: 'Nova', emoji: '🧪', role: 'R&D/Experimentation', workspace: 'rd' },
            { id: 'forge', template: 'SOUL.md.forge', name: 'Forge', emoji: '⚒️', role: 'AI API/Integrations', workspace: 'forge' }
        ],
        okrs: [
            { objective: 'Model Performance', keyResults: ['Achieve >90% prediction accuracy', 'Optimize inference latency <100ms'] }
        ],
        crons: ['security-scan', 'velocity-report'],
        hitlPolicy: { threshold: 0.6 },
        starterProject: {
            name: 'Model v1 Training',
            description: 'Researching data and training the first model',
            tasks: [
                { id: 'ai-1', title: 'Prepare training dataset', assigned_to: 'ai-engineer' },
                { id: 'ai-2', title: 'Benchmark baseline models', assigned_to: 'nova' }
            ]
        }
    },

    // ── Marketing & Growth ─────────────────────────────────────────────────────
    'marketing-campaign': {
        name: 'Marketing Campaign',
        emoji: '📈',
        industry: 'Marketing & Growth',
        description: 'Product launches, campaigns, content marketing, community growth',
        timeline: '2-4 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'content-creator', template: 'agency-agents/marketing/content-creator.md', name: 'Content', emoji: '✍️', role: 'Copy/Content', workspace: 'content' },
            { id: 'twitter', template: 'agency-agents/marketing/twitter-engager.md', name: 'Twitter', emoji: '🐦', role: 'Social Media', workspace: 'twitter' },
            { id: 'reddit', template: 'agency-agents/marketing/reddit-community-builder.md', name: 'Reddit', emoji: '👥', role: 'Community', workspace: 'reddit' },
            { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Analytics', emoji: '📊', role: 'Metrics Specialist', workspace: 'analytics' }
        ],
        okrs: [
            { objective: 'Campaign Reach', keyResults: ['Generate 50k social impressions', 'Publish 5 high-quality articles'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.8 },
        starterProject: {
            name: 'Launch Campaign',
            description: 'Coordinated launch across multiple social channels',
            tasks: [
                { id: 'mkt-1', title: 'Draft hero blog post', assigned_to: 'content-creator' },
                { id: 'mkt-2', title: 'Setup Reddit engagement strategy', assigned_to: 'reddit' }
            ]
        }
    },
    'brand-launch': {
        name: 'Brand Launch',
        emoji: '🏷️',
        industry: 'Marketing & Growth',
        description: 'New brand identity, PR, and market positioning',
        timeline: '4-8 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'brand-guardian', template: 'agency-agents/design/brand-guardian.md', name: 'Guardian', emoji: '🛡️', role: 'Identy & Tone', workspace: 'brand' },
            { id: 'storyteller', template: 'agency-agents/design/visual-storyteller.md', name: 'Storyteller', emoji: '📖', role: 'Visual Narrative', workspace: 'story' },
            { id: 'content', template: 'agency-agents/marketing/content-creator.md', name: 'Content', emoji: '✍️', role: 'Copywriting', workspace: 'content' },
            { id: 'pr', template: 'agency-agents/marketing/social-media-strategist.md', name: 'PR/Social', emoji: '📣', role: 'Strategy', workspace: 'strategy' }
        ],
        okrs: [
            { objective: 'Brand Identity Lock', keyResults: ['Complete brand book/style guide', 'Define unified brand voice/tone'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.8 },
        starterProject: {
            name: 'Identity Workshop',
            description: 'Defining core brand values and visual language',
            tasks: [
                { id: 'brand-1', title: 'Create mood board and palette', assigned_to: 'storyteller' },
                { id: 'brand-2', title: 'Write brand positioning statement', assigned_to: 'brand-guardian' }
            ]
        }
    },
    'performance-marketing': {
        name: 'Performance Marketing',
        emoji: '💰',
        industry: 'Marketing & Growth',
        description: 'Paid acquisition, landing page optimization, and high ROI growth',
        timeline: 'Ongoing',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'hacker', template: 'agency-agents/marketing/growth-hacker.md', name: 'Growth', emoji: '📈', role: 'ROI Experiments', workspace: 'hacker' },
            { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Metrics', emoji: '📊', role: 'Tracking/Ads', workspace: 'analytics' },
            { id: 'content', template: 'agency-agents/marketing/content-creator.md', name: 'Ads/Copy', emoji: '✍️', role: 'Ad Copywriter', workspace: 'content' },
            { id: 'experiment', template: 'agency-agents/project-management/experiment-tracker.md', name: 'A/B Tracker', emoji: '🧪', role: 'Optimization', workspace: 'ab' }
        ],
        okrs: [
            { objective: 'Conversion Efficiency', keyResults: ['Reduce CPA by 20%', 'Increase LP conversion rate to 5%'] }
        ],
        crons: ['velocity-report', 'budget-check'],
        hitlPolicy: { threshold: 0.75 },
        starterProject: {
            name: 'Ad Funnel Setup',
            description: 'Building and testing the initial paid acquisition funnel',
            tasks: [
                { id: 'perf-1', title: 'Draft initial ad set copy', assigned_to: 'content' },
                { id: 'perf-2', title: 'Configure tracking conversion pixels', assigned_to: 'analytics' }
            ]
        }
    },

    // ── Enterprise & Regulated ──────────────────────────────────────────────────
    'enterprise-feature': {
        name: 'Enterprise Feature',
        emoji: '🏢',
        industry: 'Enterprise & Regulated',
        description: 'Complex feature development, enterprise systems, high-stakes projects',
        timeline: '4-8 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Product Manager', workspace: 'vista' },
            { id: 'sage', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Senior Developer', workspace: 'sage' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA Specialist', workspace: 'vigil' },
            { id: 'experiment', template: 'agency-agents/project-management/experiment-tracker.md', name: 'Experiments', emoji: '🧪', role: 'A/B Testing', workspace: 'experiments' },
            { id: 'reality', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Check', emoji: '🛡️', role: 'Certification', workspace: 'cert' }
        ],
        okrs: [
            { objective: 'Enterprise Delivery', keyResults: ['Complete feature with 0 high-risk security flaws', 'Pass 100% of enterprise acceptance tests'] }
        ],
        crons: ['security-scan', 'velocity-report', 'budget-check'],
        hitlPolicy: { threshold: 0.6 },
        starterProject: {
            name: 'Feature Specification',
            description: 'Analysing requirements for an enterprise feature',
            tasks: [
                { id: 'ent-1', title: 'Document enterprise requirements', assigned_to: 'vista' },
                { id: 'ent-2', title: 'Draft technical architecture', assigned_to: 'sage' }
            ]
        }
    },
    'security-critical': {
        name: 'Security-Critical',
        emoji: '🔐',
        industry: 'Enterprise & Regulated',
        description: 'High-security applications, financial systems, and zero-trust',
        timeline: 'Ongoing',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'security', template: 'agency-agents/support/legal-compliance-checker.md', name: 'Auditor', emoji: '🕵️', role: 'Security Compliance', workspace: 'auditor' },
            { id: 'sage', template: 'SOUL.md.sage', name: 'Sage', emoji: '🔮', role: 'Secure Architect', workspace: 'sage' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'Penetration Tester', workspace: 'vigil' },
            { id: 'reality', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Check', emoji: '🛡️', role: 'Hardness Certification', workspace: 'cert' }
        ],
        okrs: [
            { objective: 'Zero Critical Vulns', keyResults: ['Maintain Grade A Security posture', 'Zero unmitigated critical vulnerabilities'] }
        ],
        crons: ['security-scan', 'velocity-report'],
        hitlPolicy: { threshold: 0.5 },
        starterProject: {
            name: 'Security Audit',
            description: 'Comprehensive security sweep of the system',
            tasks: [
                { id: 'sec-1', title: 'Audit auth flows for injection points', assigned_to: 'vigil' },
                { id: 'sec-2', title: 'Review encryption documentation', assigned_to: 'security' }
            ]
        }
    },
    'compliance-audit': {
        name: 'Compliance & Audit',
        emoji: '⚖️',
        industry: 'Enterprise & Regulated',
        description: 'Regulatory compliance focused (SOC2, GDPR, HIPAA)',
        timeline: 'Recurring',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'legal', template: 'agency-agents/support/legal-compliance-checker.md', name: 'Compliance', emoji: '📜', role: 'Legal Tech', workspace: 'legal' },
            { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Reporter', emoji: '📈', role: 'Audit Analytics', workspace: 'analytics' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'Compliance QA', workspace: 'vigil' },
            { id: 'vista', template: 'SOUL.md.vista', name: 'Vista', emoji: '🔭', role: 'Policy Manager', workspace: 'vista' },
            { id: 'exec', template: 'agency-agents/support/executive-summary-generator.md', name: 'Executive', emoji: '📝', role: 'Audit reporting', workspace: 'exec' }
        ],
        okrs: [
            { objective: 'Compliance Readiness', keyResults: ['Collect 100% of necessary audit evidence', 'Resolve all major compliance findings'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.6 },
        starterProject: {
            name: 'Audit Prep',
            description: 'Gathering evidence for upcoming regulatory audit',
            tasks: [
                { id: 'aud-1', title: 'Map system architecture to SOC2 criteria', assigned_to: 'legal' },
                { id: 'aud-2', title: 'Generate security history snapshot', assigned_to: 'analytics' }
            ]
        }
    },

    // ── Research & Development ──────────────────────────────────────────────────
    'quality-first': {
        name: 'Quality-First',
        emoji: '🔬',
        industry: 'Research & Development',
        description: 'Zero-defect requirements, high-reliability software',
        timeline: 'Quality-driven',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'vigil', template: 'SOUL.md.vigil', name: 'Vigil', emoji: '🛡️', role: 'QA (Evidence Collector)', workspace: 'vigil' },
            { id: 'reality', template: 'agency-agents/testing/reality-checker.md', name: 'Reality Check', emoji: '🛡️', role: 'Hardness Cert', workspace: 'cert' },
            { id: 'perf', template: 'agency-agents/testing/performance-benchmarker.md', name: 'Perf Check', emoji: '⚡', role: 'Benchmark QA', workspace: 'perf' }
        ],
        okrs: [
            { objective: 'Flawless Quality', keyResults: ['Zero production issues for 30 days', 'Test coverage >95% everywhere'] }
        ],
        crons: ['security-scan', 'velocity-report'],
        hitlPolicy: { threshold: 0.55 },
        starterProject: {
            name: 'Quality Sweep',
            description: 'Bringing existing systems up to quality standards',
            tasks: [
                { id: 'qa-1', title: 'Run comprehensive TDD sweep', assigned_to: 'vigil' },
                { id: 'qa-2', title: 'Establish performance baselines', assigned_to: 'perf' }
            ]
        }
    },
    'research-discovery': {
        name: 'Research & Discovery',
        emoji: '🔭',
        industry: 'Research & Development',
        description: 'Trend analysis, knowledge curation, and intellectual discovery',
        timeline: '4-12 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'trend', template: 'agency-agents/product/trend-researcher.md', name: 'Trend', emoji: '📈', role: 'Market Intelligence', workspace: 'trend' },
            { id: 'nova', template: 'SOUL.md.nova', name: 'Nova', emoji: '🧪', role: 'R&D Head', workspace: 'rd' },
            { id: 'cipher', template: 'SOUL.md.cipher', name: 'Cipher', emoji: '🔊', role: 'Knowledge Curator', workspace: 'cipher' },
            { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Analyst', emoji: '📊', role: 'Data Analysis', workspace: 'analytics' },
            { id: 'content', template: 'agency-agents/marketing/content-creator.md', name: 'Content', emoji: '✍️', role: 'Knowledge Sharing', workspace: 'content' }
        ],
        okrs: [
            { objective: 'Systemic Knowledge Expansion', keyResults: ['Produce 10 high-value internal research whitepapers', 'Surface 5 major industry shifts/trends'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.7 },
        starterProject: {
            name: 'Industry Landscape Research',
            description: 'Mapping the currently known space and identifying unknowns',
            tasks: [
                { id: 'res-1', title: 'Index competitive landscape data', assigned_to: 'cipher' },
                { id: 'res-2', title: 'Formulate 3 testable hypotheses', assigned_to: 'nova' }
            ]
        }
    },

    // ── Creative & Content ─────────────────────────────────────────────────────
    'content-studio': {
        name: 'Content Studio',
        emoji: '🎬',
        industry: 'Creative & Content',
        description: 'High-volume high-quality content production factory',
        timeline: 'Weekly',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'content', template: 'agency-agents/marketing/content-creator.md', name: 'Creator', emoji: '✍️', role: 'Chief Copywriter', workspace: 'content' },
            { id: 'insta', template: 'agency-agents/marketing/instagram-curator.md', name: 'Insta', emoji: '📸', role: 'Visual Social', workspace: 'insta' },
            { id: 'tiktok', template: 'agency-agents/marketing/tiktok-strategist.md', name: 'TikTok', emoji: '🎵', role: 'Viral Strategy', workspace: 'tiktok' },
            { id: 'whimsy', template: 'agency-agents/design/whimsy-injector.md', name: 'Whimsy', emoji: '✨', role: 'Delight Specialist', workspace: 'whimsy' },
            { id: 'analytics', template: 'agency-agents/support/analytics-reporter.md', name: 'Metrics', emoji: '📊', role: 'Performance QA', workspace: 'analytics' }
        ],
        okrs: [
            { objective: 'Content Factory Throughput', keyResults: ['Publish 20 multi-channel asset sets weekly', 'Increase net engagement rate by 15%'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.8 },
        starterProject: {
            name: 'Content Production Loop',
            description: 'Setup and execution of the weekly content production workflow',
            tasks: [
                { id: 'studio-1', title: 'Draft next week\'s topic ideas', assigned_to: 'content' },
                { id: 'studio-2', title: 'Create base visual template', assigned_to: 'whimsy' }
            ]
        }
    },
    'design-sprint': {
        name: 'Product Design Sprint',
        emoji: '🖍️',
        industry: 'Creative & Content',
        description: 'User-centered design discovery and UI prototyping',
        timeline: '1-4 weeks',
        agents: [
            { id: 'main', template: 'SOUL.md.main', name: 'Cooper', emoji: '🦅', role: 'Orchestrator', workspace: '.' },
            { id: 'ux-research', template: 'agency-agents/design/ux-researcher.md', name: 'Research', emoji: '🔍', role: 'User Insights', workspace: 'ux-res' },
            { id: 'ui-designer', template: 'agency-agents/design/ui-designer.md', name: 'Designer', emoji: '🎨', role: 'UI Implementation', workspace: 'design' },
            { id: 'ux-arch', template: 'agency-agents/design/ux-architect.md', name: 'UX Arch', emoji: '🏗️', role: 'Technical UX', workspace: 'ux-arch' },
            { id: 'pixel', template: 'SOUL.md.pixel', name: 'Pixel', emoji: '🐛', role: 'Web/Poc Builder', workspace: 'pixel' },
            { id: 'evidence', template: 'agency-agents/testing/evidence-collector.md', name: 'Evidence', emoji: '📸', role: 'Visual QA', workspace: 'evidence' }
        ],
        okrs: [
            { objective: 'Handoff Ready Design', keyResults: ['Complete high-fidelity prototype', 'Achieve >80% task success rate in user tests'] }
        ],
        crons: ['velocity-report'],
        hitlPolicy: { threshold: 0.7 },
        starterProject: {
            name: 'Discovery Sprint',
            description: 'Rapid research and wireframing for the new concept',
            tasks: [
                { id: 'ds-1', title: 'Analyze user pain points', assigned_to: 'ux-research' },
                { id: 'ds-2', title: 'Create initial wireframe flow', assigned_to: 'ux-arch' }
            ]
        }
    }
};

export function getBlueprintById(id) {
    return TEAM_BLUEPRINTS[id] || null;
}

export function getBlueprintGroups() {
    const industries = [...new Set(Object.values(TEAM_BLUEPRINTS).map(b => b.industry))];
    const groups = {};

    industries.forEach(ind => {
        groups[ind] = Object.entries(TEAM_BLUEPRINTS)
            .filter(([_, b]) => b.industry === ind)
            .map(([id, b]) => ({ id, ...b }));
    });

    return groups;
}
