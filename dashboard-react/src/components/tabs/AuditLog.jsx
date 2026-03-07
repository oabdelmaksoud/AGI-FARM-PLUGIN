import { Clock, User, Tag } from 'lucide-react';

function relTime(iso) {
  if (!iso) return '';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return ''; }
}

const EVENT_ICON = {
  policy_denied_api: '🚫',
  policy_approval_requested_api: '🔔',
  intake_task_created: '📥',
  job_status_changed: '↔',
  project_created: '📁',
  project_updated: '✏️',
  task_created: '📋',
  task_updated: '✏️',
};

export default function AuditLog({ data }) {
  const audit = data?.audit || data?.audit_log || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Audit Log</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{audit.length} audit events</p>
      </div>
      {audit.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 13 }}>
          No audit events recorded yet
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {audit.slice().reverse().map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{EVENT_ICON[entry.action] || '📝'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {entry.action?.replace(/_/g, ' ')}
                </div>
                {entry.agentId && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={10} /> {entry.agentId}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {relTime(entry.ts)}</span>
                {entry.rule && <span style={{ background: '#F1F5F9', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>Rule: {entry.rule}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
