/* Sidebar.jsx — Vertical Navigation */

const GROUP_LABELS = {
    'Overview': null,          // no group
    'Agents': 'FLEET',
    'Tasks': null,
    'Projects': null,
    'Jobs': null,
    'Approvals': null,
    'Usage': 'ANALYTICS',
    'Crons': null,
    'HITL': 'OPERATIONS',
    'Alerts': null,
    'Velocity': null,
    'Budget': 'RESOURCES',
    'OKRs': null,
    'Knowledge': 'INTEL',
    'Comms': null,
    'R&D': 'LABS',
    'Broadcast': null,
};

const TAB_ICONS = {
    'Overview': '⬡', 'Agents': '🤖', 'Tasks': '✓', 'Projects': '◈',
    'Jobs': '⚙', 'Approvals': '✉', 'Usage': '◉', 'Crons': '⏱',
    'HITL': '⚑', 'Alerts': '⚠', 'Velocity': '▲', 'Budget': '$',
    'OKRs': '◎', 'Knowledge': '◷', 'Comms': '◆', 'R&D': '⬡', 'Broadcast': '📡',
};

export default function Sidebar({ tabs, active, onChange, badges = {}, collapsed, onToggleCollapse, data, connected }) {
    const agents = data?.agents || [];
    const activeCount = agents.filter(a => a.status === 'active').length;
    const gatewayOnline = connected && (data?.gateway_online !== false);
    const statusColor = !connected ? 'var(--red)' : !gatewayOnline ? 'var(--amber)' : 'var(--mint)';
    const statusLabel = !connected ? 'Offline' : !gatewayOnline ? 'Degraded' : 'Live';

    const W = collapsed ? 64 : 220;

    return (
        <aside style={{
            width: W, minWidth: W, flexShrink: 0,
            height: '100vh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1), min-width 0.25s cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden', zIndex: 200,
        }}>
            {/* Logo */}
            <div style={{
                height: 60, display: 'flex', alignItems: 'center', padding: '0 16px',
                gap: 10, borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🦅</span>
                {!collapsed && (
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', letterSpacing: '0.03em' }}>AGI_FARM_OS</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>v1.4.0</div>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    style={{
                        marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-dim)', fontSize: 14, padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '›' : '‹'}
                </button>
            </div>

            {/* Status chip */}
            {!collapsed && (
                <div style={{ margin: '12px 12px 4px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-dot ${!connected ? 'error' : !gatewayOnline ? 'warning' : 'live'}`} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, fontFamily: 'var(--font-mono)' }}>{statusLabel}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {activeCount}/{agents.length}
                        </span>
                    </div>
                </div>
            )}

            {/* Nav Items */}
            <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {tabs.map((tab, idx) => {
                    const id = tab.id || tab;
                    const label = tab.label || tab;
                    const icon = TAB_ICONS[id] || '·';
                    const badge = badges[id];
                    const isActive = active === id;
                    const grpLabel = GROUP_LABELS[id];
                    const showGroup = grpLabel && (idx === 0 || GROUP_LABELS[(tabs[idx - 1]?.id || tabs[idx - 1])] !== grpLabel);

                    return (
                        <div key={id}>
                            {showGroup && !collapsed && (
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', padding: '12px 8px 4px', textTransform: 'uppercase' }}>
                                    {grpLabel}
                                </div>
                            )}
                            <button
                                onClick={() => onChange(id)}
                                title={collapsed ? label : undefined}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    gap: collapsed ? 0 : 10, padding: collapsed ? '10px 0' : '9px 10px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                                    border: 'none', borderRadius: 'var(--radius-sm)',
                                    color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                                    cursor: 'pointer', fontSize: isActive ? '18px' : '17px',
                                    transition: 'all 0.15s ease', position: 'relative',
                                    borderLeft: isActive && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                                }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text)'; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; } }}
                            >
                                <span style={{ flexShrink: 0, fontSize: 14, width: collapsed ? 'auto' : 18, textAlign: 'center' }}>{icon}</span>
                                {!collapsed && (
                                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{label}</span>
                                )}
                                {badge > 0 && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 5px', borderRadius: 9, fontFamily: 'var(--font-mono)',
                                        background: isActive ? 'var(--accent)' : 'var(--red)',
                                        color: '#fff', position: collapsed ? 'absolute' : 'relative',
                                        top: collapsed ? 4 : 'auto', right: collapsed ? 4 : 'auto', flexShrink: 0,
                                    }}>
                                        {badge > 9 ? '9+' : badge}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>AGI Farm Plugin</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>OpenClaw v1.4.0</div>
                </div>
            )}
        </aside>
    );
}
