/**
 * AGI Farm Standard Cron Job Definitions
 */

export const CRON_DEFS = {
    'security-scan': {
        id: 'security-scan',
        label: '🛡️ Security Scan',
        description: 'Run automated vulnerability and dependency scan via AgentShield',
        schedule: '0 0 * * *', // Daily at midnight
        agent: 'vigil',
        command: 'npx ecc-agentshield scan --path . --format json'
    },
    'velocity-report': {
        id: 'velocity-report',
        label: '📈 Velocity Report',
        description: 'Generate weekly team throughput and agent performance metrics',
        schedule: '0 0 * * 0', // Weekly on Sunday
        agent: 'vista',
        command: 'agi-farm status --json > VELOCITY_SNAPSHOT.json'
    },
    'budget-check': {
        id: 'budget-check',
        label: '💰 Budget Audit',
        description: 'Verify current spend against monthly limits and thresholds',
        schedule: '0 */6 * * *', // Every 6 hours
        agent: 'main',
        command: 'agi-farm status --budget'
    },
    'memory-summarize': {
        id: 'memory-summarize',
        label: '🧠 Memory Consolidation',
        description: 'Consolidate and index new team knowledge and task logs',
        schedule: '0 2 * * *', // Daily at 2 AM
        agent: 'cipher',
        command: 'agi-farm rebuild --memory-only'
    }
};

export function getAllCrons() {
    return Object.values(CRON_DEFS);
}
