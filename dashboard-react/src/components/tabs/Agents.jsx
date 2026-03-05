import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

function HeartbeatBar({ minutes }) {
  const age = minutes ?? 999;
  const color = age < 5 ? 'var(--green)' : age < 15 ? 'var(--amber)' : 'var(--red)';
  const label = age < 999 ? `${age}m ago` : 'STALE';
  const pct = Math.max(0, Math.min(100, 100 - (age / 60) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
        <span>PULSE_SIGNAL</span>
        <span style={{ color }}>{label}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}44`, borderRadius: 2, transition: 'width 1s ease' }} />
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
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 4px ${color}33)` }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color, fontFamily: 'JetBrains Mono, monospace'
      }}>{active}</div>
    </div>
  );
}

function ActiveTaskBadge({ task }) {
  if (!task) {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.05)', fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
        STATUS: IDLE // AWAITING_DIRECTIVE
      </div>
    );
  }
  const pri = (task.sla?.priority || task.priority || '').toUpperCase();
  const priColor = pri === 'P1' ? 'var(--red)' : pri === 'P2' ? 'var(--amber)' : 'var(--cyan)';
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(0,240,255,0.03)', borderRadius: 8, border: '1px solid rgba(0,240,255,0.12)' }}>
      <div style={{ fontSize: 8, color: 'var(--cyan)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>▶ ACTIVE_CYCLE</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {pri && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: `${priColor}15`, color: priColor, border: `1px solid ${priColor}44`, fontWeight: 800 }}>{pri}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{task.id}</div>
    </div>
  );
}

function RecentCycles({ tasks }) {
  const [open, setOpen] = useState(false);
  if (!tasks.length) return null;
  const CLSMAP = { complete: 'var(--green)', failed: 'var(--red)', blocked: 'var(--amber)' };
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
        fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: 0,
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        <span style={{ color: open ? 'var(--cyan)' : 'var(--muted)', transition: 'color 0.2s' }}>{open ? '▾' : '▸'}</span>
        RECENT_CYCLES [{tasks.length}]
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map(t => {
            const c = CLSMAP[t.status] || 'var(--muted)';
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.01)', borderRadius: 6, borderLeft: `2px solid ${c}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}`, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span style={{ fontSize: 9, color: c, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{t.status.toUpperCase()}</span>
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
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <input className="input-base" placeholder="FILTER NEURAL SIGNATURES..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '0 1 220px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
          background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6,
          padding: '5px 10px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700
        }}>
          <option value="all">ALL_STATUS</option>
          <option value="active">ACTIVE</option>
          <option value="available">AVAILABLE</option>
          <option value="busy">BUSY</option>
          <option value="error">ERROR</option>
        </select>

        {/* Fleet Summary */}
        <div style={{ display: 'flex', gap: 10, fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
          <span style={{ color: 'var(--cyan)' }}>◈ {activeCount} ACTIVE</span>
          <span style={{ color: 'var(--muted)' }}>○ {idleCount} IDLE</span>
          {errorCount > 0 && <span style={{ color: 'var(--red)', animation: 'pulse 1.5s infinite' }}>⚠ {errorCount} ERROR</span>}
        </div>

        {cacheAge != null && (
          <span style={{ fontSize: 9, color: cacheAge > 25 ? 'var(--amber)' : 'var(--muted)', fontFamily: 'monospace' }}>
            [CACHE: {cacheAge}s]
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 18 }}>
        {filtered.map((a, i) => <AgentCard key={a.id} agent={a} tasks={tasks} toast={toast} index={i} />)}
      </div>
    </div>
  );
}

function AgentCard({ agent: a, tasks, toast, index }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const dotCls = { active: 'dot-active', available: 'dot-available', busy: 'dot-busy', error: 'dot-error' }[a.status] || 'dot-offline';
  const badgeCls = { active: 'badge-active', available: 'badge-available', busy: 'badge-busy', error: 'badge-error' }[a.status] || 'badge-offline';
  const cred = a.credibility ?? 1.0;

  // Compute agent's tasks from global task list
  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const recentDone = agentTasks.filter(t => ['complete', 'failed', 'blocked'].includes(t.status)).slice(-3).reverse();
  const workingCount = agentTasks.filter(t => ['in-progress', 'blocked', 'needs_human_decision'].includes(t.status)).length;
  const totalAssigned = agentTasks.length;

  const isError = a.status === 'error';
  const isHitl = agentTasks.some(t => t.status === 'needs_human_decision');
  const borderColor = isError ? 'rgba(255,42,85,0.5)' : isHitl ? 'rgba(181,53,255,0.4)' : activeTask ? 'rgba(0,240,255,0.15)' : 'var(--border)';

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${a.id}/send`, { message: msg.trim() });
      toast(`Transmission sent to ${a.name}`, 'success');
      setMsg(''); setMsgOpen(false);
    } catch (e) { toast(e.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="card fade-in" style={{ animationDelay: `${index * 0.04}s`, display: 'flex', flexDirection: 'column', gap: 14, borderColor, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'rgba(181,83,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          border: `1px solid ${borderColor}`, boxShadow: `inset 0 0 15px rgba(181,83,255,0.1)`, flexShrink: 0
        }}>
          {a.emoji || '🤖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em' }}>{a.name.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginTop: 2 }}>{a.role} // {a.id}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`dot ${dotCls}`} style={{ width: 6, height: 6 }} />
            <span className={`badge ${badgeCls}`}>{a.status}</span>
          </div>
          {a.inbox_count > 0 && (
            <div style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 800, animation: 'pulse 2s infinite' }}>📬 {a.inbox_count}</div>
          )}
        </div>
        <WorkloadRing active={workingCount} total={Math.max(totalAssigned, 1)} />
      </div>

      {/* Active Task */}
      <ActiveTaskBadge task={activeTask} />

      {/* HITL Alert */}
      {isHitl && (
        <div style={{ padding: '6px 10px', background: 'rgba(181,53,255,0.08)', border: '1px solid rgba(181,53,255,0.3)', borderRadius: 6, fontSize: 9, fontWeight: 800, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>
          🚨 HITL_DECISION_REQUIRED // AWAITING_HUMAN_GATE
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Stat label="SUCCESS" value={a.tasks_completed ?? 0} color="var(--green)" />
        <Stat label="FAILURE" value={a.tasks_failed ?? 0} color="var(--red)" />
        <Stat label="QUALITY" value={(a.quality_score || 0).toFixed(1)} color="var(--amber)" />
      </div>

      {/* Credibility Gauge */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
          <span>NEURAL_CREDIBILITY</span>
          <span style={{ color: 'var(--text)' }}>{(cred * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, display: 'flex', gap: 2 }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '100%', borderRadius: 1,
              background: (i / 10) < cred ? 'var(--cyan)' : 'rgba(255,255,255,0.03)',
              boxShadow: (i / 10) < cred ? '0 0 5px var(--cyan)' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Heartbeat */}
      <HeartbeatBar minutes={a.heartbeat_age_minutes} />

      {/* Model + Specs */}
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>MODEL:</span><span style={{ color: 'var(--cyan)' }}>{a.model || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ASSIGNED:</span><span>{totalAssigned} CYCLES</span>
        </div>
      </div>

      {/* Specializations */}
      {a.specializations?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {a.specializations.map(s => (
            <span key={s} style={{ fontSize: 8, fontWeight: 700, padding: '3px 7px', background: 'rgba(0,240,255,0.03)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 4, textTransform: 'uppercase' }}>{s}</span>
          ))}
        </div>
      )}

      {/* Recent cycles */}
      <RecentCycles tasks={recentDone} />

      {/* Comms */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        {msgOpen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} placeholder="SEND TRANSMISSION..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} maxLength={2000} />
            <button className="btn-primary" onClick={handleSend} disabled={sending || !msg.trim()}>{sending ? '...' : 'SEND'}</button>
            <button className="input-base" style={{ cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setMsgOpen(false)}>✕</button>
          </div>
        ) : (
          <button className="btn-primary" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--muted)', letterSpacing: '0.05em', fontSize: 10 }} onClick={() => setMsgOpen(true)}>OPEN TRANSMISSION CHANNEL</button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'var(--text)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
      <div className="section-title" style={{ fontSize: 8, marginBottom: 5, letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Rajdhani, sans-serif' }}>{value}</div>
    </div>
  );
}
