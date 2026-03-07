import { Scale } from 'lucide-react';

export default function Decisions({ data }) {
  const { decisions = '' } = data || {};
  const lines = (decisions || '').split('\n').filter(l => l.trim());
  const entries = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('#')) {
      if (current) entries.push(current);
      current = { title: line.replace(/^#+\s*/, ''), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) entries.push(current);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Decision Log</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Strategic decisions recorded by agents</p>
      </div>
      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <Scale size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No decisions logged yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((e, i) => (
            <div key={i} className="card">
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={15} color="var(--accent)" /> {e.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {e.body.join('\n')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
