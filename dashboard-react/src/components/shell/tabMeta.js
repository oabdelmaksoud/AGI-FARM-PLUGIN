export const TAB_CONFIG = [
  { id: 'Overview', label: 'Overview', group: 'Command', icon: '◎', description: 'System health, interventions, and mission routing.' },
  { id: 'Projects', label: 'Projects', group: 'Command', icon: '◈', description: 'Mission portfolio, project detail, and intake control.' },
  { id: 'Tasks', label: 'Tasks', group: 'Command', icon: '▣', description: 'Task triage, deadlines, and operational follow-through.' },
  { id: 'Agents', label: 'Agents', group: 'Execution', icon: '◉', description: 'Fleet capacity, comms, and current assignments.' },
  { id: 'Jobs', label: 'Jobs', group: 'Execution', icon: '⌘', description: 'Execution jobs, runs, and background activity.' },
  { id: 'HITL', label: 'HITL', group: 'Execution', icon: '▲', description: 'Human-in-the-loop approvals and blocking decisions.' },
  { id: 'Approvals', label: 'Approvals', group: 'Execution', icon: '✦', description: 'Pending approvals and operator acknowledgements.' },
  { id: 'Usage', label: 'Usage', group: 'Analysis', icon: '◌', description: 'System consumption, usage signals, and telemetry.' },
  { id: 'Velocity', label: 'Velocity', group: 'Analysis', icon: '↗', description: 'Delivery trendlines, throughput, and execution tempo.' },
  { id: 'Budget', label: 'Budget', group: 'Analysis', icon: '$', description: 'Budget targets, spend, and burn visibility.' },
  { id: 'OKRs', label: 'OKRs', group: 'Analysis', icon: '◇', description: 'Objectives, key results, and progress alignment.' },
  { id: 'Knowledge', label: 'Knowledge', group: 'Knowledge', icon: '⌬', description: 'Shared knowledge, memory, and operating context.' },
  { id: 'Comms', label: 'Comms', group: 'Knowledge', icon: '✉', description: 'Inbox traffic, coordination, and communication streams.' },
  { id: 'Broadcast', label: 'Broadcast', group: 'Knowledge', icon: '☰', description: 'Broadcast log, events, and command messages.' },
  { id: 'R&D', label: 'R&D', group: 'Knowledge', icon: '⟁', description: 'Experiments, exploration, and model benchmarking.' },
  { id: 'Crons', label: 'Crons', group: 'System', icon: '⏱', description: 'Scheduled jobs, daemon health, and recurring work.' },
  { id: 'Alerts', label: 'Alerts', group: 'System', icon: '⚠', description: 'Critical issues, warnings, and system anomalies.' },
];

export const TAB_GROUP_ORDER = ['Command', 'Execution', 'Analysis', 'Knowledge', 'System'];

export function getTabMeta(tabId) {
  return TAB_CONFIG.find((tab) => tab.id === tabId) || TAB_CONFIG[0];
}
