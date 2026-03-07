import LastUpdated from '../LastUpdated';

/* ─── Design Tokens & Helpers ───────────────────────────────────── */
const STATUS_COLORS = {
  healthy: 'var(--mint)',
  'at-risk': 'var(--amber)',
  critical: 'var(--red)',
  active: 'var(--accent)',
  idle: 'var(--muted)',
  hitl: 'var(--purple)',
};

function getProjectHealth(p) {
  const tc = p._task_counts || {};
  const due = p.target_completion ? Math.ceil((new Date(p.target_completion) - Date.now()) / 86400000) : 999;
  if ((tc.blocked || 0) > 2 || due < -3) return 'critical';
  if ((tc.hitl || 0) > 0 || due < 0) return 'at-risk';
  return 'healthy';
}

function enrichProject(p, tasks, agents) {
  const pTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
  const done = pTasks.filter(t => t.status === 'complete').length;
  const total = pTasks.length;
  const teamAgents = (p.team || []).map(id => agents.find(a => a.id === id)).filter(Boolean);
  return {
    ...p,
    _task_counts: {
      total, done,
      active: pTasks.filter(t => t.status === 'in-progress').length,
      blocked: pTasks.filter(t => t.status === 'blocked').length,
      hitl: pTasks.filter(t => t.status === 'needs_human_decision').length,
    },
    _progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
    _team_agents: teamAgents,
    _active_tasks: pTasks.filter(t => t.status === 'in-progress'),
  };
}

/* ─── Strategic Project Matrix (Grid Item) ───────────────────────── */
function ProjectMatrixItem({ project: p }) {
  const health = getProjectHealth(p);
  const color = STATUS_COLORS[health];
  const pct = p._progress_pct ?? 0;
  const tc = p._task_counts || {};

  return (
    <div className="card fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(p.id || '').toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {(p.name || '').toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{pct}%</div>
      </div>

      <div className="progress-track" style={{ height: '1px' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { v: tc.done, t: tc.total, l: 'DONE', c: 'var(--mint)' },
          { v: tc.active, l: 'ACTV', c: 'var(--accent)' },
          { v: tc.hitl, l: 'HITL', c: 'var(--purple)' },
          { v: tc.blocked, l: 'BLOC', c: tc.blocked ? 'var(--red)' : 'var(--muted)' },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>
              {s.t != null ? `${s.v}/${s.t}` : s.v}
            </div>
            <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {p._team_agents?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
          {p._team_agents.slice(0, 5).map(a => (
            <span key={a.id} title={a.name} style={{ fontSize: '12px' }}>{a.emoji || '🤖'}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Fleet Pulse (Agent Row) ───────────────────────────────────── */
function AgentPulseRow({ agent: a, tasks, projects }) {
  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const hitlTask = agentTasks.find(t => t.status === 'needs_human_decision');
  const age = a.heartbeat_age_minutes ?? 999;

  const statusColor = a.status === 'error' ? 'var(--red)' : (activeTask ? 'var(--accent)' : 'var(--muted)');
  const hbColor = age < 5 ? 'var(--mint)' : age < 15 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
      borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: '120px' }}>
        <span style={{ fontSize: '14px' }}>{a.emoji || '🤖'}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(a.name || a.id || '').toUpperCase()}
          </div>
          <div style={{ fontSize: '8px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            STATUS: {(a.status || '').toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {hitlTask ? (
          <div style={{ fontSize: '10px', color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            [!] HITL: {(hitlTask.title || '').toUpperCase()}
          </div>
        ) : activeTask ? (
          <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {`> ${(activeTask.title || '').toUpperCase()}`}
          </div>
        ) : (
          <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>IDLE</div>
        )}
      </div>

      <div style={{ width: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{a.tasks_completed ?? 0}</div>
        <div style={{ fontSize: '7px', color: 'var(--muted)' }}>CYCLES</div>
      </div>

      <div style={{ width: '40px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: hbColor, fontFamily: 'var(--font-mono)' }}>
        {age < 999 ? `${age}m` : '--'}
      </div>
    </div>
  );
}

/* ─── Main Overview ───────────────────────────────────────────────── */
export default function Overview({ data, lastUpdated }) {
  const {
    agents = [], tasks = [], task_counts: tc = {},
    projects: rawProjects = [], budget = {}, broadcast = '',
    crons = [], alerts = [],
  } = data || {};

  const projects = rawProjects.map(p => enrichProject(p, tasks, agents));
  const activeProjects = projects.filter(p => ['active', 'ACTIVE'].includes(p.status));
  const spent = budget.current?.daily_usd ?? 0;
  const limit = budget.limits?.daily_usd ?? 1;
  const broadcastLines = (broadcast || '').split('\n').filter(l => l.trim()).slice(-5);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── TOP BAR: Global Pulse ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="section-title">ACTIVE PROJECTS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{activeProjects.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: 4 }}>OF {projects.length} TOTAL IN MATRIX</div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="section-title">FLEET CAPACITY</div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            {agents.filter(a => a.status === 'active').length}<span style={{ color: 'var(--muted)', fontSize: '16px' }}>/{agents.length}</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: 4 }}>AGENTS DEPLOYED</div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="section-title">RESOURCE SPEND</div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            ${spent.toFixed(2)}<span style={{ color: 'var(--muted)', fontSize: '14px' }}>/${limit}</span>
          </div>
          <div className="progress-track" style={{ height: '2px', marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (spent / limit) * 100)}%` }} />
          </div>
        </div>
        <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <LastUpdated ts={lastUpdated} />
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: 4 }}>NEXT SYNC: ~60s</div>
        </div>
      </div>

      {/* ── STRATEGIC PROJECT MATRIX ── */}
      <div>
        <div className="section-title">STRATEGIC PROJECT MATRIX</div>
        {activeProjects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {activeProjects.map(p => <ProjectMatrixItem key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            NO ACTIVE PROJECTS IN MATRIX
          </div>
        )}
      </div>

      {/* ── FLEET PULSE & EVENT STREAM ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24 }}>

        {/* Fleet Pulse */}
        <div>
          <div className="section-title">FLEET PULSE</div>
          <div className="card" style={{ padding: 0 }}>
            {agents.length > 0 ? (
              agents.map(a => <AgentPulseRow key={a.id} agent={a} tasks={tasks} projects={rawProjects} />)
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px' }}>NO AGENTS FOUND</div>
            )}
          </div>
        </div>

        {/* System Event Stream (Terminal Style) */}
        <div>
          <div className="section-title">SYSTEM EVENT STREAM</div>
          <div style={{
            background: '#000', border: '1px solid var(--border)', padding: '16px',
            borderRadius: 'var(--radius)', height: '100%', display: 'flex', flexDirection: 'column', gap: 8,
            fontFamily: 'var(--font-mono)', minHeight: '260px'
          }}>
            {broadcastLines.length > 0 ? (
              broadcastLines.map((line, i) => {
                const isCrit = line.toUpperCase().includes('CRITICAL') || line.toUpperCase().includes('FAILED');
                const isHitl = line.toUpperCase().includes('HITL');
                return (
                  <div key={i} style={{ fontSize: '10px', display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span style={{
                      color: isCrit ? 'var(--red)' : (isHitl ? 'var(--purple)' : 'var(--text-dim)'),
                      wordBreak: 'break-all'
                    }}>
                      {line.toUpperCase()}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: '10px' }}>// AWAITING FEED...</div>
            )}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: 8, fontSize: '9px', color: 'var(--accent)', animation: 'pulse 2s infinite' }}>
              ● LIVE_FEED_STATUS: NOMINAL
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
