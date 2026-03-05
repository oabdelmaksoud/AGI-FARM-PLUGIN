import { useRef, useEffect } from 'react';
import LastUpdated from '../LastUpdated';

export default function Memory({ data, lastUpdated }) {
  const { memory = '', memory_lines = 0 } = data;
  const scrollRef = useRef(null);

  const lines = memory ? memory.split('\n') : [];
  const capacity = Math.min(100, Math.round((memory_lines / 200) * 100));
  const capacityColor = capacity > 80 ? 'var(--red)' : capacity > 50 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{memory_lines} lines</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Capacity:</span>
          <div className="progress-track" style={{ width: 80 }}>
            <div className="progress-fill" style={{ width: `${capacity}%`, background: capacityColor }} />
          </div>
          <span style={{ fontSize: 10, color: capacityColor, fontWeight: 600 }}>{capacity}%</span>
        </div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {lines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>&#128024;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No memory content</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>MEMORY.md is empty or not yet created.</div>
        </div>
      ) : (
        <div ref={scrollRef} className="card" style={{ maxHeight: 600, overflowY: 'auto', padding: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, padding: 14 }}>
            {lines.map((line, i) => {
              let color = 'var(--text)';
              if (line.startsWith('# ')) color = 'var(--cyan)';
              else if (line.startsWith('## ')) color = 'var(--cyan)';
              else if (line.startsWith('### ')) color = 'var(--amber)';
              else if (line.startsWith('- ')) color = 'var(--muted)';
              else if (line.startsWith('**')) color = 'var(--text)';
              else if (line.startsWith('---')) color = 'rgba(255,255,255,.1)';
              else if (line.startsWith('>')) color = 'var(--purple)';
              return (
                <div key={i} style={{
                  color,
                  padding: '1px 0',
                  fontWeight: line.startsWith('#') ? 700 : 400,
                  fontSize: line.startsWith('# ') ? 14 : line.startsWith('## ') ? 12 : 11,
                  borderBottom: line.startsWith('---') ? '1px solid rgba(255,255,255,.06)' : 'none',
                }}>
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
