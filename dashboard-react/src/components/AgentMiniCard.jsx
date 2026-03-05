export default function AgentMiniCard({ agent: a }) {
  const dotCls = { active: 'dot-active', available: 'dot-available', busy: 'dot-busy', error: 'dot-error' }[a.status] || 'dot-offline';
  return (
    <div className="card" style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,240,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          border: '1px solid rgba(0,240,255,0.15)', boxShadow: 'inset 0 0 10px rgba(0,240,255,0.1)'
        }}>
          {a.emoji || '🤖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{a.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.role}</div>
        </div>
        {a.inbox_count > 0 && (
          <span className="text-glow-purple" style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700 }}>📬 {a.inbox_count}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className={`dot ${dotCls}`} style={{ width: 6, height: 6 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{a.status?.toUpperCase()}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--cyan)', fontWeight: 600 }}>
          <span style={{ fontSize: 8, opacity: 0.6, marginRight: 2 }}>SCORE</span>
          {(a.avg_quality || a.quality_score || 0).toFixed(1)}
        </span>
      </div>
    </div>
  );
}
