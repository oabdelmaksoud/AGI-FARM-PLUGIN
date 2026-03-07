import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';

function relTime(iso) {
  if (!iso) return '—';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return iso; }
}

export default function Approvals({ data, toast }) {
  const { approvals = [], agents = [] } = data || {};
  const [actioned, setActioned] = useState({});
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState({});

  const pending = approvals.filter(a => a.status === 'pending' && !actioned[a.id]);
  const decidedLocal = approvals.filter(a => actioned[a.id]);
  const otherDecided = approvals.filter(a => a.status !== 'pending' && !actioned[a.id]);

  async function decide(approval, action) {
    setLoading(l => ({ ...l, [approval.id]: action }));
    try {
      await apiPost(`/api/approvals/${approval.id}/${action}`, { note: notes[approval.id] || '' });
      setActioned(prev => ({ ...prev, [approval.id]: action }));
      toast?.(`Approval ${action}d`, action === 'approve' ? 'success' : 'error');
    } catch (e) { toast?.(e.message, 'error'); }
    setLoading(l => ({ ...l, [approval.id]: null }));
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Approval Queue</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{pending.length} pending approvals require a decision</p>
      </div>

      {pending.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>All caught up</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>No pending approvals</div>
        </div>
      )}

      {pending.map(ap => {
        const agent = agents.find(a => a.id === ap.requestedBy || a.id === ap.agentId);
        return (
          <div key={ap.id} style={{ background: '#FDFCFF', border: '2px solid #EDE9FE', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{ap.action || 'Action requires approval'}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
                  {agent && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} />{agent.emoji} {agent.name}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{relTime(ap.created_at || ap.requestedAt)}</span>
                </div>
              </div>
              <span style={{ background: '#F5F3FF', color: 'var(--purple)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>Pending</span>
            </div>

            {ap.reason && (
              <div style={{ padding: '12px 14px', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', marginBottom: 4 }}>Reason</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{ap.reason}</div>
              </div>
            )}

            {ap.payload && Object.keys(ap.payload).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Payload</div>
                <pre style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 11, color: 'var(--text-dim)', overflow: 'auto', fontFamily: 'var(--font-mono)', maxHeight: 140 }}>
                  {JSON.stringify(ap.payload, null, 2)}
                </pre>
              </div>
            )}

            <input className="input-base" placeholder="Optional note…"
              value={notes[ap.id] || ''}
              onChange={e => setNotes(n => ({ ...n, [ap.id]: e.target.value }))}
              style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => decide(ap, 'approve')} disabled={!!loading[ap.id]}
                style={{ flex: 1, padding: 12, background: '#ECFDF5', border: '1px solid #6EE7B7', color: 'var(--mint)', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={15} /> {loading[ap.id] === 'approve' ? 'Processing…' : 'Approve'}
              </button>
              <button onClick={() => decide(ap, 'reject')} disabled={!!loading[ap.id]}
                style={{ flex: 1, padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--red)', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <XCircle size={15} /> {loading[ap.id] === 'reject' ? 'Processing…' : 'Reject'}
              </button>
            </div>
          </div>
        );
      })}

      {(decidedLocal.length > 0 || otherDecided.length > 0) && (
        <div>
          <h2 style={{ marginBottom: 12, fontSize: 16, color: 'var(--text-dim)' }}>Resolved</h2>
          {[...decidedLocal, ...otherDecided].map(ap => (
            <div key={ap.id} style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>{ap.action || ap.id}</div>
              <span style={{
                background: (actioned[ap.id] || ap.status) === 'approve' || (actioned[ap.id] || ap.status) === 'approved' ? '#ECFDF5' : '#FEF2F2',
                color: (actioned[ap.id] || ap.status) === 'approve' || (actioned[ap.id] || ap.status) === 'approved' ? 'var(--mint)' : 'var(--red)',
                borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600,
              }}>
                {actioned[ap.id] || ap.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
