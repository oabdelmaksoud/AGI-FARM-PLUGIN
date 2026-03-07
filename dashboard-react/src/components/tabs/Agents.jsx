import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { MessageSquare, X, Send, CheckCircle2, XCircle, Inbox, Star } from 'lucide-react';

const STATUS_CONFIG = {
  active: { bg: '#EEF2FF', color: 'var(--accent)', label: 'Active' },
  available: { bg: '#ECFDF5', color: 'var(--mint)', label: 'Available' },
  busy: { bg: '#FFFBEB', color: 'var(--amber)', label: 'Busy' },
  error: { bg: '#FEF2F2', color: 'var(--red)', label: 'Error' },
  running: { bg: '#EEF2FF', color: 'var(--accent)', label: 'Running' },
};

function HeartbeatBar({ minutes }) {
  const age = minutes ?? 999;
  const color = age < 5 ? 'var(--mint)' : age < 15 ? 'var(--amber)' : 'var(--red)';
  const pct = Math.max(0, Math.min(100, 100 - (age / 60) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        <span>Heartbeat</span>
        <span style={{ color, fontWeight: 600 }}>{age < 999 ? `${age}m ago` : 'Offline'}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function AgentCard({ agent: a, tasks, toast, index }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const hitlTask = agentTasks.find(t => t.status === 'needs_human_decision');
  const isHitl = !!hitlTask;

  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.available;

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${a.id}/send`, { message: msg.trim() });
      toast?.(`Message sent to ${a.name}`, 'success');
      setMsg(''); setMsgOpen(false);
    } catch (e) { toast?.(e.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="card fade-in" style={{
      animationDelay: `${index * 0.05}s`,
      display: 'flex', flexDirection: 'column', gap: 16,
      borderColor: isHitl ? '#EDE9FE' : a.status === 'error' ? '#FEE2E2' : 'var(--border)',
      borderWidth: isHitl || a.status === 'error' ? 2 : 1,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{a.emoji || '🤖'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.name || a.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{a.role || 'Agent'}</div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, color: cfg.color, borderRadius: 999,
            padding: '2px 10px', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Current Task */}
      {isHitl ? (
        <div style={{ padding: '10px 14px', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>⚡ HITL Required</div>
          <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{hitlTask?.hitl_reason || hitlTask?.title}</div>
        </div>
      ) : activeTask ? (
        <div style={{ padding: '10px 14px', background: '#EEF2FF', border: '1px solid #E0E7FF', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>▶ Working On</div>
          <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTask.title}</div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Idle — awaiting task</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatChip label="Done" value={a.tasks_completed ?? 0} color="var(--mint)" />
        <StatChip label="Failed" value={a.tasks_failed ?? 0} color="var(--red)" />
        <StatChip label="Cred." value={(a.credibility || 1).toFixed(1)} color="var(--accent)" />
      </div>

      <HeartbeatBar minutes={a.heartbeat_age_minutes} />

      {/* Meta */}
      <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>Model</span>
          <span style={{ fontWeight: 600 }}>{a.model || '--'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Inbox size={11} color="var(--muted)" /><span style={{ color: 'var(--muted)' }}>Inbox</span>
          </div>
          <span style={{ fontWeight: 600, color: a.inbox_count > 0 ? 'var(--amber)' : 'var(--text-dim)' }}>
            {a.inbox_count > 0 ? `${a.inbox_count} messages` : 'Empty'}
          </span>
        </div>
      </div>

      {/* Message */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {msgOpen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-base"
              style={{ flex: 1, fontSize: 12 }}
              placeholder="Send a message…"
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <button onClick={handleSend} disabled={sending || !msg.trim()}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
              <Send size={13} /> {sending ? '…' : 'Send'}
            </button>
            <button onClick={() => setMsgOpen(false)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
              <X size={13} color="var(--muted)" />
            </button>
          </div>
        ) : (
          <button onClick={() => setMsgOpen(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10,
            padding: '10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-dim)', fontWeight: 500,
            transition: 'all 0.15s',
          }}>
            <MessageSquare size={13} /> Message Agent
          </button>
        )}
      </div>
    </div>
  );
}

export default function Agents({ data, toast }) {
  const { agents = [], tasks = [] } = data || {};
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !search || (a.name || '').toLowerCase().includes(q) || (a.id || '').toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || a.status === filterStatus;
    return matchQ && matchS;
  });

  const activeCount = agents.filter(a => a.status !== 'available').length;
  const availableCount = agents.filter(a => a.status === 'available').length;
  const errorCount = agents.filter(a => a.status === 'error').length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Agent Directory</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Monitor and message your autonomous agent fleet</p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: `${activeCount} Active`, color: 'var(--accent)', bg: '#EEF2FF', status: 'active' },
          { label: `${availableCount} Idle`, color: 'var(--mint)', bg: '#ECFDF5', status: 'available' },
          { label: `${errorCount} Error`, color: 'var(--red)', bg: '#FEF2F2', status: 'error' },
        ].map(c => (
          <button key={c.status} onClick={() => setFilterStatus(filterStatus === c.status ? 'all' : c.status)}
            style={{
              background: filterStatus === c.status ? c.bg : '#F8FAFC',
              color: filterStatus === c.status ? c.color : 'var(--muted)',
              border: `1px solid ${filterStatus === c.status ? c.color + '44' : 'var(--border)'}`,
              borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
            {c.label}
          </button>
        ))}
        <input
          className="input-base"
          placeholder="Search agents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 220, fontSize: 13 }}
        />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filtered.length > 0 ? filtered.map((a, i) => (
          <AgentCard key={a.id} agent={a} tasks={tasks} toast={toast} index={i} />
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 64, color: 'var(--muted)', fontSize: 13 }}>
            No agents match your filter
          </div>
        )}
      </div>
    </div>
  );
}
