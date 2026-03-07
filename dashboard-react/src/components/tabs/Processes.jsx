import { useState } from 'react';
import LastUpdated from '../LastUpdated';

const MATURITY_COLOR = { L1: 'var(--red)', L2: 'var(--amber)', L3: 'var(--cyan)', L4: 'var(--green)' };

export default function Processes({ data, lastUpdated }) {
  const { processes = [], agents = [] } = data || {};
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = processes.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.id || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q) || (p.owner || '').toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input className="input-base" placeholder="Search processes..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '0 1 200px' }} />
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} process{filtered.length !== 1 ? 'es' : ''}</span>
        <LastUpdated ts={lastUpdated} />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>&#9881;&#65039;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No processes found</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Processes are defined in PROCESSES.json</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Name', 'Owner', 'Maturity', 'Steps', 'Use Count', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const agent = agents.find(a => a.id === p.owner);
                const mat = p.maturity || 'L1';
                const isExp = expanded === p.id;
                return (
                  <>
                    <tr key={p.id} onClick={() => setExpanded(isExp ? null : p.id)}
                      style={{ borderBottom: isExp ? 'none' : '1px solid rgba(255,255,255,.03)', cursor: 'pointer' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--cyan)', fontFamily: 'monospace', fontSize: 11 }}>{p.id || '\u2014'}</td>
                      <td style={{ padding: '8px 12px' }}>{p.name || '\u2014'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{agent ? `${agent.emoji} ${agent.name}` : p.owner || '\u2014'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 600, color: MATURITY_COLOR[mat] || 'var(--muted)', background: `${MATURITY_COLOR[mat] || 'var(--muted)'}18`, border: `1px solid ${MATURITY_COLOR[mat] || 'var(--muted)'}44` }}>{mat}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{(p.steps || []).length}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{p.use_count ?? 0}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 11, textAlign: 'center' }}>{isExp ? '\u25B2' : '\u25BC'}</td>
                    </tr>
                    {isExp && (
                      <tr key={`${p.id}-detail`} style={{ background: 'rgba(0,229,255,.03)', borderBottom: '1px solid rgba(0,229,255,.08)' }}>
                        <td colSpan={7} style={{ padding: '10px 14px 14px 14px' }}>
                          {p.description && <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>{p.description}</div>}
                          {(p.steps || []).length > 0 && (
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Steps</div>
                              {p.steps.map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 11 }}>
                                  <span style={{ color: 'var(--cyan)', fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                                  <span style={{ flex: 1 }}>{typeof s === 'string' ? s : s.description || s.name || JSON.stringify(s)}</span>
                                  {s.owner && <span style={{ color: 'var(--muted)', fontSize: 10 }}>{s.owner}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                            {p.last_used && <span>Last used: {new Date(p.last_used).toLocaleString()}</span>}
                            {p.created_at && <span>Created: {new Date(p.created_at).toLocaleDateString()}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
