const BADGE_COLOR = { 'HITL': 'red', 'Alerts': 'red', 'Crons': 'amber', 'Approvals': 'purple' };

const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [
      { id: 'Overview', label: 'Overview' },
      { id: 'Agents', label: 'Agents' },
      { id: 'Tasks', label: 'Tasks' },
      { id: 'Projects', label: 'Projects' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'Jobs', label: 'Jobs' },
      { id: 'Crons', label: 'Schedules' },
      { id: 'Approvals', label: 'Approvals' },
      { id: 'HITL', label: 'Human-in-Loop' },
      { id: 'Alerts', label: 'Alerts' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'Velocity', label: 'Velocity' },
      { id: 'Budget', label: 'Budget' },
      { id: 'Usage', label: 'Usage' },
      { id: 'OKRs', label: 'OKRs' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'Knowledge', label: 'Knowledge' },
      { id: 'Comms', label: 'Comms' },
      { id: 'R&D', label: 'R&D' },
      { id: 'Broadcast', label: 'Broadcast' },
    ],
  },
];

const ICON_MAP = {
  'Overview': '\u25A6', 'Agents': '\u2318', 'Tasks': '\u2611', 'Projects': '\u25CB',
  'Jobs': '\u25B6', 'Crons': '\u23F0', 'Approvals': '\u2714', 'HITL': '\u26A0', 'Alerts': '\u26A1',
  'Velocity': '\u2197', 'Budget': '\u25C8', 'Usage': '\u2261', 'OKRs': '\u25CE',
  'Knowledge': '\u2302', 'Comms': '\u2709', 'R&D': '\u2697', 'Broadcast': '\u25C9',
};

export default function Nav({ tabs, active, onChange, badges = {} }) {
  return (
    <nav className="sidebar-nav">
      {NAV_SECTIONS.map(section => (
        <div key={section.label}>
          <div className="nav-section-label">{section.label}</div>
          {section.items.map(item => {
            const isActive = active === item.id;
            const badge = badges[item.id];
            const badgeColor = BADGE_COLOR[item.id];
            return (
              <button
                key={item.id}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => onChange(item.id)}
              >
                <span className="nav-item-icon">{ICON_MAP[item.id] || '\u25A0'}</span>
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className={`nav-item-badge ${badgeColor || ''}`}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
