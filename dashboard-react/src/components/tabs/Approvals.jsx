import { useState } from 'react';
import LastUpdated from '../LastUpdated';
import { approveApproval, rejectApproval } from '../../lib/api';

export default function Approvals({ data, lastUpdated }) {
  const { approvals = [], featureFlags = {} } = data || {};
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
        <div className="empty-state">No pending approvals.</div>
      )}

      {pending.map((a) => (
        <div key={a.id} className="card" style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{a.action}</span>
            <span className="badge badge-hitl">pending</span>
            <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{a.id}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Job: {a.jobId}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Reason: {a.note || 'approval required'}</div>
          <input
            value={notes[a.id] || ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
            placeholder="Optional note"
            className="input-base"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onApprove(a.id)} style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,.35)', color: 'var(--green)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Approve
            </button>
            <button onClick={() => onReject(a.id)} className="btn-danger" style={{ fontSize: 11, padding: '5px 10px' }}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
