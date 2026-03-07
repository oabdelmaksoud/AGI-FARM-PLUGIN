import { useState, useMemo } from 'react';
import LastUpdated from '../LastUpdated';

function parseDecisions(md) {
  if (!md || !md.trim()) return [];
  const entries = [];
  const sections = md.split(/^## /gm).filter(s => s.trim());
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled';
    const body = lines.slice(1).join('\n').trim();
    const statusMatch = body.match(/\*\*Status\*\*:\s*(.+)/i) || body.match(/status:\s*(.+)/i);
    const dateMatch = body.match(/\*\*Date\*\*:\s*(.+)/i) || body.match(/date:\s*(.+)/i);
    const deciderMatch = body.match(/\*\*Decided by\*\*:\s*(.+)/i) || body.match(/decided.?by:\s*(.+)/i);
    const contextMatch = body.match(/\*\*Context\*\*:\s*(.+)/i) || body.match(/context:\s*(.+)/i);
    const consequenceMatch = body.match(/\*\*Consequences?\*\*:\s*(.+)/i) || body.match(/consequences?:\s*(.+)/i);
    entries.push({
      title,
      status: statusMatch?.[1]?.trim() || 'accepted',
      date: dateMatch?.[1]?.trim() || '',
      decider: deciderMatch?.[1]?.trim() || '',
      context: contextMatch?.[1]?.trim() || '',
      consequences: consequenceMatch?.[1]?.trim() || '',
      body,
    });
  }
  return entries;
}

const STATUS_COLOR = { accepted: 'var(--green)', proposed: 'var(--amber)', superseded: 'var(--muted)', deprecated: 'var(--red)' };

export default function Decisions({ data, lastUpdated }) {
  const { decisions = '' } = data || {};
  const [search, setSearch] = useState('');

  const entries = useMemo(() => parseDecisions(decisions), [decisions]);

  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.title || '').toLowerCase().includes(q) || (e.context || '').toLowerCase().includes(q) || (e.consequences || '').toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input className="input-base" placeholder="Search decisions..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '0 1 200px' }} />
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} decision{filtered.length !== 1 ? 's' : ''}</span>
        <LastUpdated ts={lastUpdated} />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>&#129504;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No decisions logged</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>{decisions ? 'No decisions match your search.' : 'DECISIONS.md is empty or not yet created.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((e, i) => {
            const color = STATUS_COLOR[e.status.toLowerCase()] || 'var(--muted)';
            return (
              <div key={i} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>&#129504;</span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}44` }}>{e.status}</span>
                  {e.date && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{e.date}</span>}
                </div>
                {e.context && <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 6, padding: '6px 10px', background: 'rgba(0,229,255,.03)', borderRadius: 4 }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Context:</span> {e.context}</div>}
                {e.consequences && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Consequences:</span> {e.consequences}</div>}
                {e.decider && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Decided by: {e.decider}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
