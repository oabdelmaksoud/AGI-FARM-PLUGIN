import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

/* ─── Components ────────────────────────────────────────────────── */

function HeartbeatStatus({ minutes }) {
  const age = minutes ?? 999;
  const color = age < 5 ? 'var(--mint)' : age < 15 ? 'var(--amber)' : 'var(--red)';
  const pct = Math.max(0, Math.min(100, 100 - (age / 60) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
        <span>PULSE_SIGNAL</span>
        <span style={{ color }}>{age < 999 ? `${age}M AGO` : 'OFFLINE'}</span>
      </div>
      <div className="progress-track" style={{ height: '2px' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function WorkloadMeter({ active, total }) {
  const pct = total > 0 ? (active / total) * 100 : 0;
  const color = pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--accent)';
  return (
    <div style={{ width: '40px', flexShrink: 0 }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color, fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
        {active}<span style={{ color: 'var(--muted)', fontSize: '9px', fontWeight: 400 }}>/{total}</span>
      </div>
      <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800, textAlign: 'center', marginTop: '2px' }}>LOAD</div>
    </div>
  );
}

function ActiveTaskSignifier({ task }) {
  if (!task) return (
    <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '2px' }}>
      // AWAITING_INSTRUCTIONS
    </div>
  );
  return (
    <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '10px', margin: '4px 0' }}>
      <div style={{ fontSize: '8px', color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>ACTIVE_PROCESS</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {(task.title || '').toUpperCase()}
      </div>
    </div>
  );
}

/* ─── Main View ─────────────────────────────────────────────────── */

export default function Agents({ data, lastUpdated, toast }) {
  const { agents = [], tasks = [], cache_age_seconds } = data || {};
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !search || (a.name || '').toLowerCase().includes(q) || (a.id || '').toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || a.status === filterStatus;
    return matchQ && matchS;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <input
          className="input-base"
          placeholder="SEARCH_FLEET_ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '240px', fontFamily: 'var(--font-mono)' }}
        />
        <select
          className="input-base"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: '140px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
        >
          <option value="all">ALL_STATUS</option>
          <option value="active">ACTIVE</option>
          <option value="available">AVAILABLE</option>
          <option value="busy">BUSY</option>
          <option value="error">ERROR</option>
        </select>

        <div style={{ display: 'flex', gap: 16, fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          <span style={{ color: 'var(--accent)' }}>● {agents.filter(a => a.status === 'active').length} ACTIVE</span>
          <span style={{ color: 'var(--muted)' }}>● {agents.filter(a => a.status === 'available').length} IDLE</span>
        </div>

        <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filtered.map((a, i) => <AgentCard key={a.id} agent={a} tasks={tasks} toast={toast} index={i} />)}
      </div>
    </div>
  );
}

function AgentCard({ agent: a, tasks, toast, index }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const workingCount = agentTasks.filter(t => ['in-progress', 'blocked', 'needs_human_decision'].includes(t.status)).length;
  const isHitl = agentTasks.some(t => t.status === 'needs_human_decision');

  const borderColor = a.status === 'error' ? 'var(--red)' : (isHitl ? 'var(--purple)' : 'var(--border)');

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${a.id}/send`, { message: msg.trim() });
      toast?.(`Signal transmitted to ${a.name}`, 'success');
      setMsg(''); setMsgOpen(false);
    } catch (e) { toast?.(e.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="card fade-in" style={{
      animationDelay: `${index * 0.05}s`,
      display: 'flex', flexDirection: 'column', gap: 16,
      borderColor: a.status === 'error' || isHitl ? borderColor : 'var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: '24px', flexShrink: 0 }}>{a.emoji || '🤖'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(a.name || '').toUpperCase()}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {(a.role || '').toUpperCase()} // {a.id}
          </div>
        </div>
        <WorkloadMeter active={workingCount} total={agentTasks.length} />
      </div>

      <ActiveTaskSignifier task={activeTask} />

      {isHitl && (
        <div style={{ padding: '6px 10px', background: 'rgba(181, 53, 255, 0.05)', border: '1px solid var(--purple)', borderRadius: '2px', fontSize: '9px', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
          [!] ACTION_REQUIRED: HITL_GATE_OPEN
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="card" style={{ padding: '8px', textAlign: 'center', background: 'transparent' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--mint)' }}>{a.tasks_completed ?? 0}</div>
          <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800 }}>SUCCESS</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center', background: 'transparent' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{a.tasks_failed ?? 0}</div>
          <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800 }}>FAILURES</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center', background: 'transparent' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{(a.credibility || 1).toFixed(1)}</div>
          <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800 }}>CREDENCE</div>
        </div>
      </div>

      <HeartbeatStatus minutes={a.heartbeat_age_minutes} />

      <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>MODEL_ID:</span><span style={{ color: '#fff' }}>{a.model?.toUpperCase() || '--'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>MEMORY_TAG:</span><span style={{ color: '#fff' }}>{a.inbox_count > 0 ? `INBOX[${a.inbox_count}]` : 'NOMINAL'}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
        {msgOpen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-base"
              style={{ flex: 1 }}
              placeholder="ENCRYPTED_SIGNAL..."
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-primary" onClick={handleSend} disabled={sending || !msg.trim()}>
              {sending ? '...' : 'SEND'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setMsgOpen(false)}>✕</button>
          </div>
        ) : (
          <button
            className="btn-secondary"
            style={{ width: '100%', fontSize: '10px', color: 'var(--muted)' }}
            onClick={() => setMsgOpen(true)}
          >
            ESTABLISH COMMS CHANNEL
          </button>
        )}
      </div>
    </div>
  );
}
