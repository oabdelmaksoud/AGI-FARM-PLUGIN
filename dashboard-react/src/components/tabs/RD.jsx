import { FlaskConical, Cpu, List, CheckCircle2 } from 'lucide-react';
import LastUpdated from '../LastUpdated';

export default function RD({ data, lastUpdated }) {
  const { experiments = [], backlog = [] } = data || {};
  const benchmarks = data?.benchmarks || {};
  const evaluations = benchmarks?.evaluations || [];
  const lastRun = benchmarks?.last_run;

  const PRIORITY_CFG = {
    P1: { bg: '#FEF2F2', color: 'var(--red)', border: '#FEE2E2' },
    P2: { bg: '#FFFBEB', color: 'var(--amber)', border: '#FEF3C7' },
    P3: { bg: '#F1F5F9', color: 'var(--muted)', border: '#E2E8F0' },
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>R&D Lab</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Experiments, benchmarks, and evolution pipeline</p>
        </div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {/* Experiments */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <FlaskConical size={16} color="var(--accent)" />
          <h2 style={{ fontSize: 15, margin: 0 }}>Active Experiments</h2>
          <span style={{ marginLeft: 'auto', background: '#EEF2FF', color: 'var(--accent)', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{experiments.length}</span>
        </div>

        {experiments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: '#F8FAFC', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <FlaskConical size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>No active experiments</div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Hypothesis', 'Status', 'Started', 'Outcome'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((e, i) => {
                  const st = (e.status || '').toLowerCase();
                  const statusCfg = { complete: { bg: '#ECFDF5', color: 'var(--mint)' }, running: { bg: '#EEF2FF', color: 'var(--accent)' }, failed: { bg: '#FEF2F2', color: 'var(--red)' } }[st] || { bg: '#F1F5F9', color: 'var(--muted)' };
                  return (
                    <tr key={e.id || i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{(e.id || '--').slice(0, 12)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title || e.hypothesis || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 12 }}>{e.started_at ? new Date(e.started_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.result || e.outcome || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Benchmarks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Cpu size={15} color="var(--accent)" />
            <h2 style={{ fontSize: 15, margin: 0 }}>Benchmarks</h2>
            {lastRun && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>Last run: {new Date(lastRun).toLocaleDateString()}</span>}
          </div>
          {evaluations.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No benchmark data yet</div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {['Model', 'Score', 'Latency', 'Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{ev.model}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--amber)', fontWeight: 800 }}>★{(ev.score ?? 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ev.latency_ms ? `${ev.latency_ms}ms` : '—'}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 11 }}>{ev.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Backlog */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <List size={15} color="var(--accent)" />
            <h2 style={{ fontSize: 15, margin: 0 }}>Evolution Pipeline</h2>
            <span style={{ marginLeft: 'auto', background: '#F1F5F9', color: 'var(--muted)', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{backlog.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backlog.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Pipeline is clear</div>
            ) : backlog.slice(0, 15).map((item, i) => {
              const pri = (item.priority || '').toUpperCase();
              const priNorm = pri === 'HIGH' ? 'P1' : pri === 'MEDIUM' ? 'P2' : 'P3';
              const priCfg = PRIORITY_CFG[priNorm];
              const isDone = item.status === 'done';
              return (
                <div key={item.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: isDone ? '#F0FDF4' : '#F8FAFC',
                  border: `1px solid ${isDone ? '#D1FAE5' : 'var(--border)'}`,
                  borderRadius: 10, opacity: isDone ? 0.7 : 1, transition: 'all 0.15s',
                }}>
                  <span style={{ background: priCfg.bg, color: priCfg.color, border: `1px solid ${priCfg.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{priNorm}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isDone ? 'line-through' : 'none' }}>{item.title || item.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{item.category || 'General'}</div>
                  </div>
                  {isDone && <CheckCircle2 size={14} color="var(--mint)" style={{ flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
