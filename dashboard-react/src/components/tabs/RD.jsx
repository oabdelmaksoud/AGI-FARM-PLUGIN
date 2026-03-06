export default function RD({ data }) {
  const { experiments = [], backlog = [] } = data || {};
  const benchmarks = data?.benchmarks || {};
  const evaluations = benchmarks?.evaluations || [];
  const lastRun = benchmarks?.last_run;

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Experiments Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Experiments</div>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--cyan)', fontWeight: 800 }}>Active: {experiments.length}</span>
        </div>

        {experiments.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>🧪</div>
            <div>No active experiments</div>
          </div>
        ) : (
          <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Hypothesis', 'Status', 'Started', 'Outcome'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((e, i) => {
                  const st = (e.status || '').toLowerCase();
                  const color = st === 'complete' ? 'var(--green)' : st === 'running' ? 'var(--cyan)' : st === 'failed' ? 'var(--red)' : 'var(--muted)';
                  return (
                    <tr key={e.id || i} style={{ borderBottom: '1px solid var(--border)' }} className="task-row-hover">
                      <td className="mono" style={{ padding: '12px 14px', color: 'var(--cyan)', fontSize: 10 }}>{e.id || '--'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{e.title || e.hypothesis || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge" style={{
                          fontSize: 9, color, background: `${color}11`, border: `1px solid ${color}33`,
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          {st === 'running' && <div className="status-dot" style={{ background: color }} />}
                          {e.status}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{e.started_at ? new Date(e.started_at).toLocaleDateString() : '--'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {e.result || e.outcome || '--'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Benchmarks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span className="section-title" style={{ marginBottom: 0 }}>Benchmarks</span>
            {lastRun && <span className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)', marginLeft: 'auto' }}>Last run: {new Date(lastRun).toLocaleDateString()}</span>}
          </div>

          {evaluations.length === 0 ? (
            <div className="empty-state">No benchmark data</div>
          ) : (
            <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {['Model', 'Score', 'Latency', 'Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="mono" style={{ padding: '10px 14px', fontSize: 10, color: 'var(--cyan)' }}>{ev.model}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: 'var(--amber)', fontWeight: 800, fontSize: 13 }}>
                          {(ev.score ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '10px 14px', color: 'var(--purple)', fontWeight: 600 }}>
                        {ev.latency_ms ? `${ev.latency_ms}ms` : '--'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 9 }}>{ev.notes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Backlog */}
        <div className="card">
          <div className="section-title">R&D Backlog</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {backlog.length === 0 ? (
              <div className="empty-state">No backlog items</div>
            ) : (
              backlog.slice(0, 15).map((item, i) => {
                const pri = (item.priority || '').toUpperCase();
                const priNorm = pri === 'HIGH' ? 'P1' : pri === 'MEDIUM' ? 'P2' : pri === 'LOW' ? 'P3' : pri;
                const isDone = item.status === 'done';

                return (
                  <div key={item.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: isDone ? 'var(--green-dim)' : 'var(--bg3)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    opacity: isDone ? 0.6 : 1, transition: 'all 0.2s'
                  }} className="task-row-hover">
                    <span className={`pri-tag ${priNorm.toLowerCase()}`} style={{
                      fontSize: 8, fontWeight: 900, width: 20, textAlign: 'center'
                    }}>{priNorm}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.description}</div>
                      <div style={{ fontSize: 8, color: 'var(--text-secondary)', marginTop: 2 }}>{item.category || 'general'}</div>
                    </div>
                    {isDone ? (
                      <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 900 }}>✓</span>
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
