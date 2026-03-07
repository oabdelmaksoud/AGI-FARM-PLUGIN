import { AlertOctagon, XCircle, Clock } from 'lucide-react';

function relTime(iso) {
  if (!iso) return '';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return ''; }
}

export default function Failures({ data }) {
  const { failures = '' } = data || {};
  const lines = (failures || '').split('\n').filter(l => l.trim());

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Failures Log</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{lines.length} entries in the failure log</p>
      </div>
      {lines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No failures recorded</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Agents log failures to FAILURES.md as they occur</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((line, i) => {
            const isCrit = /critical|fatal|crashed/i.test(line);
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'flex-start',
                background: isCrit ? '#FFF1F2' : '#F8FAFC',
                border: `1px solid ${isCrit ? '#FEE2E2' : 'var(--border)'}`,
                borderRadius: 10,
              }}>
                <XCircle size={15} color={isCrit ? 'var(--red)' : 'var(--muted)'} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{line}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
