import {
  LayoutDashboard, Users, ListTodo, FolderKanban,
  ShieldCheck, BrainCircuit, Settings, ChevronRight,
  Activity, Zap, AlertTriangle, DollarSign, Clock, Cpu,
  BookOpen, MessageSquare, Target, BellRing
} from 'lucide-react';

const PILLAR_ONE = [
  { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'Agents', icon: Users, label: 'Agents' },
  { id: 'Tasks', icon: ListTodo, label: 'Tasks' },
  { id: 'HITL', icon: BellRing, label: 'HITL', badge: 'hitl' },
  { id: 'Alerts', icon: AlertTriangle, label: 'Alerts', badge: 'alerts' },
  { id: 'Velocity', icon: Zap, label: 'Velocity' },
  { id: 'Budget', icon: DollarSign, label: 'Budget' },
];

const PILLAR_TWO = [
  { id: 'Projects', icon: FolderKanban, label: 'Projects' },
  { id: 'OKRs', icon: Target, label: 'OKRs' },
  { id: 'Approvals', icon: ShieldCheck, label: 'Approvals', badge: 'approvals' },
  { id: 'Knowledge', icon: BookOpen, label: 'Knowledge' },
  { id: 'Comms', icon: MessageSquare, label: 'Comms' },
];

const PILLAR_OTHER = [
  { id: 'Security', icon: Cpu, label: 'Security' },
  { id: 'Crons', icon: Clock, label: 'Jobs & Crons', badge: 'crons' },
  { id: 'Processes', icon: Activity, label: 'Processes' },
  { id: 'Memory', icon: BrainCircuit, label: 'Memory' },
  { id: 'Settings', icon: Settings, label: 'Settings' },
];

function NavSection({ title, items, active, onChange, badges = {} }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, color: 'var(--muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '0 12px', marginBottom: 6
      }}>
        {title}
      </div>
      {items.map(({ id, icon: Icon, label, badge }) => {
        const isActive = active === id;
        const badgeCount = badge ? (badges[badge] || 0) : 0;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isActive ? 'rgba(79,70,229,0.08)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              fontWeight: isActive ? 600 : 400, fontSize: 13,
              fontFamily: 'var(--font-main)', transition: 'all 0.15s ease',
              textAlign: 'left', marginBottom: 2,
            }}
          >
            <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badgeCount > 0 && (
              <span style={{
                background: isActive ? 'var(--accent)' : '#EEF2FF',
                color: isActive ? '#fff' : 'var(--accent)',
                fontSize: 10, fontWeight: 700, borderRadius: 999,
                padding: '1px 6px', minWidth: 18, textAlign: 'center',
              }}>
                {badgeCount}
              </span>
            )}
            {isActive && <ChevronRight size={12} style={{ flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>
  );
}

export default function Nav({ active, onChange, badges = {} }) {
  const mapped = {
    hitl: badges['HITL'],
    alerts: badges['Alerts'],
    crons: badges['Crons'],
    approvals: badges['Approvals'],
  };
  return (
    <nav style={{
      width: 220, background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 8px', overflowY: 'auto',
      boxShadow: 'var(--shadow-sm)', flexShrink: 0,
    }}>
      {/* Branding */}
      <div style={{ padding: '4px 12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🦅</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>AGI Farm</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>Ops Dashboard</div>
        </div>
      </div>

      <NavSection title="Agent Intelligence" items={PILLAR_ONE} active={active} onChange={onChange} badges={mapped} />
      <NavSection title="Project Oversight" items={PILLAR_TWO} active={active} onChange={onChange} badges={mapped} />
      <div style={{ flex: 1 }} />
      <NavSection title="System" items={PILLAR_OTHER} active={active} onChange={onChange} badges={mapped} />
    </nav>
  );
}
