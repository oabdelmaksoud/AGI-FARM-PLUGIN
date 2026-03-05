import { useRef, useEffect } from 'react';
import LastUpdated from '../LastUpdated';

export default function Memory({ data, lastUpdated }) {
  const { memory = '', memory_lines = 0 } = data || {};
  const scrollRef = useRef(null);

  const lines = memory ? memory.split('\n') : [];
  const capacity = Math.min(100, Math.round((memory_lines / 200) * 100));
  const capacityColor = capacity > 80 ? 'var(--red)' : capacity > 50 ? 'var(--amber)' : 'var(--cyan)';

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Header Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-title" style={{ fontSize: 8 }}>NEURAL DENSITY</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif' }}>{memory_lines} <span style={{ fontSize: 10, color: 'var(--muted)' }}>NODES</span></div>
        </div>
        <div className="card">
          <div className="section-title" style={{ fontSize: 8 }}>ARCHIVE CAPACITY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div className="progress-track" style={{ flex: 1, height: 8 }}>
              <div className="progress-fill" style={{ width: `${capacity}%`, background: capacityColor, boxShadow: `0 0 10px ${capacityColor}` }} />
            </div>
            <span style={{ fontSize: 13, color: capacityColor, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{capacity}%</span>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LastUpdated ts={lastUpdated} />
        </div>
      </div>

      {/* Terminal Display */}
      {lines.length === 0 ? (
        <div className="card shadow-glow" style={{ textAlign: 'center', color: 'var(--muted)', padding: 60, border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📂</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em' }}>ARCHIVE NULL</div>
          <div style={{ fontSize: 10, marginTop: 8, opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>MEMORY.MD STREAM NOT INITIALIZED</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-h)', background: '#050508' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', opacity: 0.5 }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', opacity: 0.5 }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', opacity: 0.5 }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', marginLeft: 8 }}>NEURAL_ARCHIVE_LOG_STREAM.EXE</span>
          </div>
          <div ref={scrollRef} style={{
            maxHeight: 600, overflowY: 'auto', padding: 20,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.8,
            background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.02) 0%, transparent 100%)'
          }}>
            {lines.map((line, i) => {
              let color = 'rgba(255,255,255,0.7)';
              let bg = 'transparent';
              let weight = 400;
              let glow = 'none';

              if (line.startsWith('# ')) { color = 'var(--cyan)'; weight = 800; glow = '0 0 8px rgba(0,240,255,0.3)'; }
              else if (line.startsWith('## ')) { color = 'var(--cyan)'; weight = 700; }
              else if (line.startsWith('### ')) { color = 'var(--purple)'; weight = 700; }
              else if (line.startsWith('- ')) { color = 'rgba(255,255,255,0.8)'; }
              else if (line.startsWith('**')) { color = 'var(--text)'; weight = 600; }
              else if (line.startsWith('---')) { color = 'rgba(255,255,255,0.1)'; }
              else if (line.startsWith('>')) { color = 'var(--amber)'; bg = 'rgba(255,214,0,0.05)'; }

              return (
                <div key={i} style={{
                  color, background: bg, fontWeight: weight, textShadow: glow,
                  padding: line.startsWith('#') ? '10px 0 4px 0' : '1px 8px',
                  fontSize: line.startsWith('# ') ? 16 : line.startsWith('## ') ? 13 : 11,
                  borderLeft: line.startsWith('>') ? '2px solid var(--amber)' : 'none',
                  opacity: line.length === 0 ? 0 : 1,
                  display: 'flex', gap: 16
                }}>
                  <span style={{ width: 24, color: 'rgba(255,255,255,0.1)', textAlign: 'right', userSelect: 'none' }}>{i + 1}</span>
                  <span>{line || '\u00A0'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
