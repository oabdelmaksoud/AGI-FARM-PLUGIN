import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

const SEV_CONFIG = {
  critical: { bg: '#FEF2F2', border: '#FEE2E2', color: 'var(--red)', label: 'Critical' },
  high: { bg: '#FFF7ED', border: '#FED7AA', color: 'var(--amber)', label: 'High' },
  medium: { bg: '#FFFBEB', border: '#FEF3C7', color: '#D97706', label: 'Medium' },
  low: { bg: '#F8FAFC', border: 'var(--border)', color: 'var(--muted)', label: 'Low' },
};
const TYPE_ICON = { hitl: '🔔', sla_breach: '⏰', agent_error: '🔴', cron_error: '⚙️', blocked: '🚫' };
const TYPE_LABEL = { hitl: 'HITL', sla_breach: 'SLA Breach', agent_error: 'Agent Error', cron_error: 'Cron Error', blocked: 'Blocked' };

function relTime(iso) {
  if (!iso) return '';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.round(diff / 60)}h ago`;
  } catch { return ''; }
}

export default function AlertsTab({ data }) {
  const { alerts = [], agents = [] } = data || {};
  const [dismissed, setDismissed] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');

  const active = alerts.filter(a => !dismissed.has(a.id));
  const filtered = active.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (sevFilter === 'all' || a.severity === sevFilter)
  );

  const types = ['all', ...new Set(alerts.map(a => a.type))];
  const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
  active.forEach(a => { if (bySev[a.severity] !== undefined) bySev[a.severity]++; });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Alert Center</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{active.length} active alerts across the system</p>
      </div>

      {/* Severity Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(bySev).map(([sev, count]) => {
          const cfg = SEV_CONFIG[sev];
          return (
            <button key={sev} onClick={() => setSevFilter(sevFilter === sev ? 'all' : sev)}
              style={{
                background: sevFilter === sev ? cfg.bg : '#F8FAFC',
                border: `1px solid ${sevFilter === sev ? cfg.border : 'var(--border)'}`,
                borderRadius: 14, padding: '16px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: count > 0 ? cfg.color : 'var(--muted)' }}>{count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'capitalize', marginTop: 4 }}>{sev}</div>
            </button>
          );
        })}
      </div>

      {/* Type + Actions bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            background: typeFilter === t ? 'var(--accent)' : '#F8FAFC',
            color: typeFilter === t ? '#fff' : 'var(--text-dim)',
            border: `1px solid ${typeFilter === t ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {TYPE_ICON[t] || ''} {TYPE_LABEL[t] || t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {dismissed.size > 0 && (
          <button onClick={() => setDismissed(new Set())} style={{
            marginLeft: 'auto', background: '#F8FAFC', border: '1px solid var(--border)',
            color: 'var(--muted)', borderRadius: 8, padding: '5px 12px', fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <RotateCcw size={12} /> Restore {dismissed.size} dismissed
          </button>
        )}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {alerts.length === 0 ? 'No alerts — all systems nominal' : 'All alerts filtered or dismissed'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(alert => {
            const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.low;
            const agent = agents.find(a => a.id === alert.agent_id);
            return (
              <div key={alert.id} style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 14,
                display: 'flex', gap: 14, padding: '16px 18px', alignItems: 'flex-start',
                transition: 'transform 0.15s', cursor: 'default',
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICON[alert.type] || '⚠️'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{alert.title}</span>
                    <span style={{
                      background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}44`,
                      borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 8px',
                    }}>{cfg.label}</span>
                  </div>
                  {alert.detail && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 6 }}>{alert.detail}</div>}
                  <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {agent && <span>{agent.emoji} {agent.name}</span>}
                    <span>{TYPE_LABEL[alert.type] || alert.type}</span>
                    <span>{relTime(alert.ts)}</span>
                    {alert.task_id && <span style={{ fontFamily: 'var(--font-mono)' }}>{alert.task_id}</span>}
                  </div>
                </div>
                <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))} style={{
                  background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '4px 8px', cursor: 'pointer', flexShrink: 0,
                }}>
                  <X size={12} color="var(--muted)" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
