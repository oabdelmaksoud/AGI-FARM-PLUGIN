import { useState, useMemo } from 'react';
import LastUpdated from '../LastUpdated';

function parseFailures(md) {
  if (!md || !md.trim()) return [];
  const entries = [];
  const sections = md.split(/^## /gm).filter(s => s.trim());
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled';
    const body = lines.slice(1).join('\n').trim();
    const typeMatch = body.match(/\*\*Type\*\*:\s*(.+)/i) || body.match(/type:\s*(.+)/i);
    const rootMatch = body.match(/\*\*Root Cause\*\*:\s*(.+)/i) || body.match(/root.?cause:\s*(.+)/i);
    const dateMatch = body.match(/\*\*Date\*\*:\s*(.+)/i) || body.match(/date:\s*(.+)/i);
    const agentMatch = body.match(/\*\*Agent\*\*:\s*(.+)/i) || body.match(/agent:\s*(.+)/i);
    const lessonMatch = body.match(/\*\*Lesson\*\*:\s*(.+)/i) || body.match(/lesson:\s*(.+)/i);
    entries.push({
      title,
      type: typeMatch?.[1]?.trim() || 'unknown',
      rootCause: rootMatch?.[1]?.trim() || '',
      date: dateMatch?.[1]?.trim() || '',
      agent: agentMatch?.[1]?.trim() || '',
      lesson: lessonMatch?.[1]?.trim() || '',
      body,
    });
  }
  return entries;
}

const TYPE_COLOR = { bug: 'var(--red)', error: 'var(--red)', timeout: 'var(--amber)', sla_breach: 'var(--amber)', logic: 'var(--purple)', unknown: 'var(--muted)' };

export default function Failures({ data, lastUpdated }) {
  const { failures = '' } = data;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const entries = useMemo(() => parseFailures(failures), [failures]);
  const types = useMemo(() => [...new Set(entries.map(e => e.type))], [entries]);

  const filtered = entries.filter(e => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.rootCause.toLowerCase().includes(q) || e.lesson.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="input-base" placeholder="Search failures..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '0 1 200px' }} />
        <select className="input-base" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} failure{filtered.length !== 1 ? 's' : ''}</span>
        <LastUpdated ts={lastUpdated} />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>&#128218;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No failures logged</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>{failures ? 'No failures match your filter.' : 'FAILURES.md is empty or not yet created.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((e, i) => {
            const color = TYPE_COLOR[e.type.toLowerCase()] || TYPE_COLOR.unknown;
            return (
              <div key={i} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>&#128680;</span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}44` }}>{e.type}</span>
                  {e.date && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{e.date}</span>}
                </div>
                {e.rootCause && <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Root Cause:</span> {e.rootCause}</div>}
                {e.lesson && <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Lesson:</span> {e.lesson}</div>}
                {e.agent && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Agent: {e.agent}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
