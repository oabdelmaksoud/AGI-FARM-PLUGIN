import { useState } from 'react';
import LastUpdated from '../LastUpdated';
import { approveApproval, rejectApproval } from '../../lib/api';

export default function Approvals({ data, lastUpdated }) {
  const { approvals = [], featureFlags = {} } = data;
  const [notes, setNotes] = useState({});

  if (!featureFlags.approvals) {
    return <div className="card">Approvals feature is disabled. Enable `featureApprovals` in plugin config.</div>;
  }

  const pending = approvals.filter((a) => a.status === 'pending');

  async function onApprove(id) {
    try { await approveApproval(id, notes[id] || ''); } catch { }
  }

  async function onReject(id) {
    try { await rejectApproval(id, notes[id] || ''); } catch { }
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Approvals ({pending.length} pending)</div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {pending.length === 0 && (
        <div className="card" style={{ color: 'var(--muted)' }}>No pending approvals.</div>
      )}

      {pending.map((a) => (
        <div key={a.id} className="card" style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{a.action}</span>
            <span className="badge badge-hitl">pending</span>
            <span style={{ color: 'var(--muted)', fontSize: 10 }}>{a.id}</span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Job: {a.jobId}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Reason: {a.note || 'approval required'}</div>
          <input
            value={notes[a.id] || ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
            placeholder="Optional note"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px 10px', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onApprove(a.id)} style={{ background: 'rgba(0,230,118,.1)', border: '1px solid rgba(0,230,118,.35)', color: 'var(--green)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Approve
            </button>
            <button onClick={() => onReject(a.id)} style={{ background: 'rgba(255,23,68,.1)', border: '1px solid rgba(255,23,68,.35)', color: 'var(--red)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
