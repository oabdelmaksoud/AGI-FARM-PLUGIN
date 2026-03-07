import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const EVENT_COLOR = {
  broadcast_posted: 'var(--cyan)',
  knowledge_created: 'var(--green)',
  knowledge_deleted: 'var(--red)',
  comms_sent: 'var(--purple)',
  skill_enabled: 'var(--green)',
  skill_disabled: 'var(--amber)',
  approval_approved: 'var(--green)',
  approval_rejected: 'var(--red)',
  policy_denied_api: 'var(--red)',
};

function relTime(iso) {
  if (!iso) return '\u2014';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff}M AGO`;
    if (diff < 1440) return `${Math.round(diff / 60)}H AGO`;
    return `${Math.round(diff / 1440)}D AGO`;
  } catch { return iso; }
}

export default function AuditLog({ data, lastUpdated, toast }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadAudit = useCallback(async () => {
    try {
      const result = await apiGet('/api/audit');
      setEntries(result.entries || []);
      setTotal(result.total || 0);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.event || '').toLowerCase().includes(q) || JSON.stringify(e.payload || {}).toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="fade-in" style={{ textAlign: 'center', padding: 60, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>LOADING_AUDIT_LOG...</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>AUDIT TRAIL</h2>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {total} TOTAL EVENTS // SHOWING {filtered.length}
          </div>
        </div>
        <input className="input-base" placeholder="SEARCH_EVENTS..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240, marginLeft: 'auto', fontFamily: 'var(--font-mono)' }} />
        <button className="btn-secondary" onClick={loadAudit} style={{ padding: '8px 14px', fontSize: 10 }}>REFRESH</button>
        <LastUpdated ts={lastUpdated} />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>&#128203;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No audit events</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>AUDIT_LOG.jsonl is empty or no events match your filter.</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', background: '#050505' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['TIMESTAMP', 'EVENT', 'DETAILS'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 9, color: 'var(--muted)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const color = EVENT_COLOR[entry.event] || 'var(--muted)';
                const payload = entry.payload || {};
                const details = Object.entries(payload).map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`).join(' ');
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {relTime(entry.timestamp)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                        {(entry.event || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text)', fontFamily: 'var(--font-mono)', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {details || '\u2014'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
