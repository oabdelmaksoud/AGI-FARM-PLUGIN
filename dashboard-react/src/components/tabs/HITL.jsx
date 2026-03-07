import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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

function HITLCard({ task, agents, onAction, toast }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(null);
  const agent = agents.find(a => a.id === task.assigned_to);
  const pri = (task.sla?.priority || task.priority || '').toUpperCase();

  async function act(action) {
    setLoading(action);
    try {
      await apiPost(`/api/hitl/${task.id}/${action}`, { note: note || undefined });
      onAction(task.id, action);
    } catch (e) { toast?.(e.message, 'error'); }
    setLoading(null);
  }

  return (
    <div style={{
      background: '#FDFCFF', border: '2px solid #EDE9FE', borderRadius: 16,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
      boxShadow: '0 4px 24px rgba(139,92,246,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{task.title}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{task.id}</span>
            {pri && (
              <span style={{
                background: pri === 'P1' ? '#FEF2F2' : '#F1F5F9',
                color: pri === 'P1' ? 'var(--red)' : 'var(--muted)',
                borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              }}>{pri}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {agent && <span>{agent.emoji} {agent.name} ·</span>}
            <Clock size={11} style={{ flexShrink: 0 }} />
            <span>Waiting <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{relTime(task.created_at)}</span></span>
            {task.sla?.deadline && <span>· Due {new Date(task.sla.deadline).toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {/* HITL Reason */}
      <div style={{ padding: '14px 16px', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>⚡ Decision Required</div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{task.hitl_reason || 'Human decision required before agent can proceed.'}</div>
      </div>

      {task.description && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Context</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>{task.description}</div>
        </div>
      )}

      {/* Note input */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 6 }}>Add a note for the agent (optional)</div>
        <input
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="Provide guidance or context…"
          className="input-base"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => act('approve')} disabled={!!loading} style={{
          flex: 1, padding: '12px', background: loading === 'approve' ? '#D1FAE5' : '#ECFDF5',
          border: '1px solid #6EE7B7', color: 'var(--mint)', borderRadius: 12,
          fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s',
        }}>
          <CheckCircle2 size={16} /> {loading === 'approve' ? 'Processing…' : '✅ Approve — Continue'}
        </button>
        <button onClick={() => act('reject')} disabled={!!loading} style={{
          flex: 1, padding: '12px', background: loading === 'reject' ? '#FEE2E2' : '#FEF2F2',
          border: '1px solid #FCA5A5', color: 'var(--red)', borderRadius: 12,
          fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s',
        }}>
          <XCircle size={16} /> {loading === 'reject' ? 'Processing…' : '❌ Reject — Block'}
        </button>
      </div>
    </div>
  );
}

export default function HITLTab({ data, toast }) {
  const { hitl_tasks = [], agents = [] } = data || {};
  const [resolved, setResolved] = useState(new Set());
  const pending = hitl_tasks.filter(t => !resolved.has(t.id));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>HITL Queue</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Human-in-the-loop decisions requiring your input</p>
      </div>

      {/* Status Banner */}
      <div style={{
        padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
        background: pending.length > 0 ? '#FFF7ED' : '#ECFDF5',
        border: `1px solid ${pending.length > 0 ? '#FED7AA' : '#A7F3D0'}`,
      }}>
        <span style={{ fontSize: 22 }}>{pending.length > 0 ? '🔔' : '✅'}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: pending.length > 0 ? 'var(--amber)' : 'var(--mint)' }}>
            {pending.length > 0 ? `${pending.length} decision${pending.length > 1 ? 's' : ''} awaiting your input` : 'All clear — no pending decisions'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            {pending.length > 0 ? 'Agents are paused at approval gates below' : 'All agents are running autonomously'}
          </div>
        </div>
        {resolved.size > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mint)', fontWeight: 600 }}>
            {resolved.size} resolved this session
          </div>
        )}
      </div>

      {pending.map(t => (
        <HITLCard key={t.id} task={t} agents={agents} toast={toast}
          onAction={id => setResolved(prev => new Set([...prev, id]))} />
      ))}
    </div>
  );
}
