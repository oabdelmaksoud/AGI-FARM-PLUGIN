export default function RD({ data }) {
  const { experiments = [], backlog = [] } = data || {};
  const benchmarks = data?.benchmarks || {};
  const evaluations = benchmarks?.evaluations || [];
  const lastRun = benchmarks?.last_run;

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Experiments Section */}
      <div className="card shadow-glow" style={{ border: '1px solid var(--cyan-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>NEURAL EXPERIMENTATION LAB</div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>ACTIVE_CYCLES: {experiments.length}</span>
        </div>

        {experiments.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>🧪</div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em' }}>LABORATORY_IDLE // NO ACTIVE HYPOTHESES</div>
          </div>
        ) : (
          <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                  {['VECTOR_ID', 'HYPOTHESIS', 'COGNITION_STATE', 'INITIALIZED', 'OUTCOME'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((e, i) => {
                  const st = (e.status || '').toLowerCase();
                  const color = st === 'complete' ? 'var(--green)' : st === 'running' ? 'var(--cyan)' : st === 'failed' ? 'var(--red)' : 'var(--muted)';
                  return (
                    <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} className="task-row-hover">
                      <td style={{ padding: '12px 14px', color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e.id || '--'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{e.title || e.hypothesis || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge" style={{
                          fontSize: 9, color, background: `${color}11`, border: `1px solid ${color}33`,
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          {st === 'running' && <div className="status-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />}
                          {e.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{e.started_at ? new Date(e.started_at).toLocaleDateString() : '--'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--muted)', fontSize: 10, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
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
            <span className="section-title" style={{ marginBottom: 0 }}>KINETIC PERFORMANCE MATRIX</span>
            {lastRun && <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>SYNC: {new Date(lastRun).toLocaleDateString()}</span>}
          </div>

          {evaluations.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 10 }}>MATRIX_EMPTY // NO DATA POINTS</div>
          ) : (
            <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                    {['MODEL_KERNEL', 'RATING', 'LATENCY', 'LOG'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: 'var(--muted)', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.02)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--cyan)' }}>{ev.model}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: 'var(--amber)', fontWeight: 800, fontSize: 13, textShadow: '0 0 10px rgba(255,214,0,0.3)' }}>
                          ★{(ev.score ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                        {ev.latency_ms ? `${ev.latency_ms}MS` : '--'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 9 }}>{ev.notes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Backlog */}
        <div className="card">
          <div className="section-title">NEURAL EVOLUTION PIPELINE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {backlog.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 10 }}>PIPELINE_CLEAR</div>
            ) : (
              backlog.slice(0, 15).map((item, i) => {
                const pri = (item.priority || '').toUpperCase();
                const priNorm = pri === 'HIGH' ? 'P1' : pri === 'MEDIUM' ? 'P2' : pri === 'LOW' ? 'P3' : pri;
                const isDone = item.status === 'done';

                return (
                  <div key={item.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: isDone ? 'rgba(0,255,157,0.02)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6,
                    opacity: isDone ? 0.6 : 1, transition: 'all 0.2s'
                  }} className="task-row-hover">
                    <span className={`pri-tag ${priNorm.toLowerCase()}`} style={{
                      fontSize: 8, fontWeight: 900, width: 20, textAlign: 'center'
                    }}>{priNorm}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.description}</div>
                      <div style={{ fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{item.category || 'GENERAL_EVO'}</div>
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
