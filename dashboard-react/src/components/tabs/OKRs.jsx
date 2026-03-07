import { Target, TrendingUp } from 'lucide-react';

function KRBar({ kr }) {
  const pct = Math.round((kr.current ?? 0) / (kr.target ?? 1) * 100);
  const clampedPct = Math.min(100, Math.max(0, pct));
  const color = clampedPct >= 100 ? 'var(--mint)' : clampedPct >= 60 ? 'var(--accent)' : clampedPct >= 30 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: 'var(--text)', fontWeight: 500, flex: 1, paddingRight: 12 }}>{kr.description || kr.id}</span>
        <span style={{ fontWeight: 700, color, flexShrink: 0 }}>{clampedPct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clampedPct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{kr.current ?? 0} / {kr.target ?? '?'} {kr.unit || ''}</div>
    </div>
  );
}

export default function OKRs({ data }) {
  const { okrs = {} } = data || {};
  const objectives = okrs.objectives || okrs.okrs || (Array.isArray(okrs) ? okrs : []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>OKRs & Goals</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Objectives and key results tracking</p>
      </div>
      {objectives.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <Target size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No OKRs configured</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Define objectives in OKRs.json</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {objectives.map((obj, i) => {
            const krs = obj.key_results || obj.krs || [];
            const overallPct = krs.length > 0 ? Math.round(krs.reduce((s, kr) => s + Math.min(100, (kr.current ?? 0) / (kr.target ?? 1) * 100), 0) / krs.length) : 0;
            const color = overallPct >= 80 ? 'var(--mint)' : overallPct >= 50 ? 'var(--accent)' : 'var(--amber)';
            return (
              <div key={obj.id || i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Target size={16} color="var(--accent)" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{obj.objective || obj.title || obj.id}</span>
                    </div>
                    {obj.owner && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Owner: {obj.owner}</div>}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{overallPct}%</div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${overallPct}%`, background: color }} />
                </div>
                {krs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Key Results</div>
                    {krs.map((kr, j) => <KRBar key={kr.id || j} kr={kr} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
