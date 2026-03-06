import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

function HeartbeatBar({ minutes }) {
  const age = minutes ?? 999;
  const color = age < 5 ? 'var(--green)' : age < 15 ? 'var(--amber)' : 'var(--red)';
  const label = age < 999 ? `${age}m ago` : 'Stale';
  const pct = Math.max(0, Math.min(100, 100 - (age / 60) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        <span>Heartbeat</span>
        <span style={{ color, fontWeight: 600 }}>{label}</span>
      </div>
      <div className="progress-track" style={{ height: 4 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function WorkloadRing({ active, total, size = 36 }) {
  const pct = total > 0 ? (active / total) * 100 : 0;
  const color = pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--cyan)';
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color
      }}>{active}</div>
    </div>
  );
}

function ActiveTaskBadge({ task }) {
  if (!task) {
    return (
      <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, border: '1px dashed var(--border)', fontSize: 12, color: 'var(--muted)' }}>
        Idle &mdash; awaiting assignment
      </div>
    );
  }
  const pri = (task.sla?.priority || task.priority || '').toUpperCase();
  const priColor = pri === 'P1' ? 'var(--red)' : pri === 'P2' ? 'var(--amber)' : 'var(--cyan)';
  return (
    <div style={{ padding: '10px 14px', background: 'var(--cyan-dim)', borderRadius: 8, border: '1px solid rgba(0,212,255,0.15)' }}>
      <div style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 600, marginBottom: 4 }}>Active Task</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {pri && <span className={pri === 'P1' ? 'p1' : pri === 'P2' ? 'p2' : 'p3'}>{pri}</span>}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{task.id}</div>
    </div>
  );
}

function RecentCycles({ tasks }) {
  const [open, setOpen] = useState(false);
  if (!tasks.length) return null;
  const CLSMAP = { complete: 'var(--green)', failed: 'var(--red)', blocked: 'var(--amber)' };
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="btn-ghost" style={{
        padding: 0, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)'
      }}>
        <span>{open ? '\u25BE' : '\u25B8'}</span>
        Recent tasks ({tasks.length})
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map(t => {
            const c = CLSMAP[t.status] || 'var(--muted)';
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6, borderLeft: `3px solid ${c}` }}>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span className="mono" style={{ fontSize: 11, color: c, fontWeight: 600 }}>{t.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Agents({ data, lastUpdated, toast }) {
  const { agents = [], tasks = [], cache_age_seconds } = data || {};
  const cacheAge = cache_age_seconds ?? null;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !search || (a.name || '').toLowerCase().includes(q) || (a.id || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || a.status === filterStatus;
    return matchQ && matchS;
  });

  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const idleCount = agents.filter(a => a.status === 'available').length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <input className="input-base" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '0 1 240px' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="error">Error</option>
        </select>

        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{activeCount} active</span>
          <span style={{ color: 'var(--text-secondary)' }}>{idleCount} idle</span>
          {errorCount > 0 && <span style={{ color: 'var(--red)', fontWeight: 600 }}>{errorCount} error</span>}
        </div>

        {cacheAge != null && (
          <span className="mono" style={{ fontSize: 11, color: cacheAge > 25 ? 'var(--amber)' : 'var(--muted)' }}>
            Cache: {cacheAge}s
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
        {filtered.map((a, i) => <AgentCard key={a.id} agent={a} tasks={tasks} toast={toast} index={i} />)}
      </div>
    </div>
  );
}

function AgentCard({ agent: a, tasks, toast, index }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const badgeCls = { active: 'badge-active', available: 'badge-available', busy: 'badge-busy', error: 'badge-error' }[a.status] || 'badge-offline';
  const cred = a.credibility ?? 1.0;

  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const recentDone = agentTasks.filter(t => ['complete', 'failed', 'blocked'].includes(t.status)).slice(-3).reverse();
  const workingCount = agentTasks.filter(t => ['in-progress', 'blocked', 'needs_human_decision'].includes(t.status)).length;
  const totalAssigned = agentTasks.length;

  const isError = a.status === 'error';
  const isHitl = agentTasks.some(t => t.status === 'needs_human_decision');
  const borderColor = isError ? 'rgba(239,68,68,0.4)' : isHitl ? 'rgba(167,139,250,0.3)' : activeTask ? 'rgba(0,212,255,0.15)' : 'var(--border)';

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${a.id}/send`, { message: msg.trim() });
      toast(`Message sent to ${a.name}`, 'success');
      setMsg(''); setMsgOpen(false);
    } catch (e) { toast(e.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="card fade-in" style={{ animationDelay: `${index * 0.04}s`, display: 'flex', flexDirection: 'column', gap: 14, borderColor, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          border: '1px solid var(--border)', flexShrink: 0
        }}>
          {a.emoji || '\u{1F916}'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.role} &middot; {a.id}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className={`badge ${badgeCls}`}>{a.status}</span>
          {a.inbox_count > 0 && (
            <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600 }}>{a.inbox_count} messages</div>
          )}
        </div>
        <WorkloadRing active={workingCount} total={Math.max(totalAssigned, 1)} />
      </div>

      {/* Active Task */}
      <ActiveTaskBadge task={activeTask} />

      {/* HITL Alert */}
      {isHitl && (
        <div style={{ padding: '8px 12px', background: 'var(--purple-dim)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--purple)' }}>
          Human decision required
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatMini label="Completed" value={a.tasks_completed ?? 0} color="var(--green)" />
        <StatMini label="Failed" value={a.tasks_failed ?? 0} color="var(--red)" />
        <StatMini label="Quality" value={(a.quality_score || 0).toFixed(1)} color="var(--amber)" />
      </div>

      {/* Credibility */}
      <div style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
          <span>Credibility</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{(cred * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-track" style={{ height: 5 }}>
          <div className="progress-fill" style={{ width: `${cred * 100}%`, background: cred > 0.7 ? 'var(--cyan)' : cred > 0.4 ? 'var(--amber)' : 'var(--red)' }} />
        </div>
      </div>

      {/* Heartbeat */}
      <HeartbeatBar minutes={a.heartbeat_age_minutes} />

      {/* Model info */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>Model</span>
          <span className="mono" style={{ color: 'var(--cyan)' }}>{a.model || '\u2014'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>Assigned</span>
          <span>{totalAssigned} tasks</span>
        </div>
      </div>

      {/* Specializations */}
      {a.specializations?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {a.specializations.map(s => (
            <span key={s} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: 4 }}>{s}</span>
          ))}
        </div>
      )}

      <RecentCycles tasks={recentDone} />

      {/* Comms */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        {msgOpen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ flex: 1 }} placeholder="Send message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} maxLength={2000} />
            <button className="btn-primary" onClick={handleSend} disabled={sending || !msg.trim()} style={{ padding: '8px 14px' }}>{sending ? '...' : 'Send'}</button>
            <button className="btn-secondary" onClick={() => setMsgOpen(false)}>&times;</button>
          </div>
        ) : (
          <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setMsgOpen(true)}>Send Message</button>
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value, color = 'var(--text)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--bg3)', borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
