import { Users, FolderKanban, DollarSign, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap } from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────────────── */
function getProjectHealth(p) {
  const tc = p._task_counts || {};
  const due = p.target_completion
    ? Math.ceil((new Date(p.target_completion) - Date.now()) / 86400000)
    : 999;
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
  };
}

const HEALTH_CONFIG = {
  healthy: { color: 'var(--mint)', bg: '#ECFDF5', text: 'On Track', borderColor: '#D1FAE5' },
  'at-risk': { color: 'var(--amber)', bg: '#FFFBEB', text: 'At Risk', borderColor: '#FEF3C7' },
  critical: { color: 'var(--red)', bg: '#FEF2F2', text: 'Critical', borderColor: '#FEE2E2' },
};

/* ─── KPI Card ───────────────────────────────────────────────────── */
function KPICard({ icon: Icon, label, value, sub, color, accentBg }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: accentBg || '#EEF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color || 'var(--accent)'} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Project Card ───────────────────────────────────────────────── */
function ProjectCard({ project: p }) {
  const health = getProjectHealth(p);
  const cfg = HEALTH_CONFIG[health] || HEALTH_CONFIG.healthy;
  const pct = p._progress_pct ?? 0;
  const tc = p._task_counts || {};

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.borderColor}`, borderRadius: 16,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
            {p.name || p.id}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.color + '22', color: cfg.color, borderRadius: 999,
            padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
            {cfg.text}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{pct}%</div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: cfg.color }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center' }}>
        {[
          { v: `${tc.done}/${tc.total}`, l: 'Done' },
          { v: tc.active, l: 'Active' },
          { v: tc.hitl, l: 'HITL' },
          { v: tc.blocked, l: 'Blocked' },
        ].map(s => (
          <div key={s.l} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 4px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.v ?? 0}</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {p._team_agents?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {p._team_agents.slice(0, 6).map(a => (
            <span key={a.id} title={a.name} style={{ fontSize: 14 }}>{a.emoji || '🤖'}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Agent Row ───────────────────────────────────────────────────── */
function AgentRow({ agent: a, tasks }) {
  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const hitlTask = agentTasks.find(t => t.status === 'needs_human_decision');
  const age = a.heartbeat_age_minutes ?? 999;
  const isActive = !!activeTask;
  const isHitl = !!hitlTask;

  const statusBg = isHitl ? '#F5F3FF' : isActive ? '#EEF2FF' : '#F8FAFC';
  const statusColor = isHitl ? 'var(--purple)' : isActive ? 'var(--accent)' : 'var(--muted)';
  const hbColor = age < 5 ? 'var(--mint)' : age < 15 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      borderBottom: '1px solid var(--border)', background: statusBg,
      transition: 'background 0.2s',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{a.emoji || '🤖'}</span>
      <div style={{ minWidth: 120, flex: '0 0 120px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.name || a.id}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize', fontWeight: 500 }}>{a.status || 'unknown'}</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isHitl ? (
          <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>
            🔔 HITL: {hitlTask.title}
          </span>
        ) : isActive ? (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            ▶ {activeTask.title}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Idle</span>
        )}
      </div>

      <div style={{ textAlign: 'center', minWidth: 50 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{a.tasks_completed ?? 0}</div>
        <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Done</div>
      </div>

      <div style={{ minWidth: 38, textAlign: 'right', fontSize: 11, fontWeight: 700, color: hbColor }}>
        {age < 999 ? `${age}m` : '--'}
      </div>
    </div>
  );
}

/* ─── Event Feed ───────────────────────────────────────────────────── */
function EventFeed({ broadcast }) {
  const lines = (broadcast || '').split('\n').filter(l => l.trim()).slice(-8);
  return (
    <div style={{
      background: '#FAFAFA', border: '1px solid var(--border)', borderRadius: 16,
      padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 260,
      overflowY: 'auto',
    }}>
      {lines.length > 0 ? lines.map((line, i) => {
        const isCrit = /critical|failed/i.test(line);
        const isHitl = /hitl/i.test(line);
        const isOk = /success|complete|done/i.test(line);
        const color = isCrit ? 'var(--red)' : isHitl ? 'var(--purple)' : isOk ? 'var(--mint)' : 'var(--text-dim)';
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: 1 }}>
              {new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: 12, color, lineHeight: 1.5 }}>{line}</span>
          </div>
        );
      }) : (
        <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
          Awaiting live events…
        </div>
      )}
      <div style={{
        marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 10, color: 'var(--mint)', fontWeight: 600 }}>Live</span>
      </div>
    </div>
  );
}

/* ─── Main Overview ─────────────────────────────────────────────── */
export default function Overview({ data }) {
  const {
    agents = [], tasks = [], task_counts: tc = {},
    projects: rawProjects = [], budget = {}, broadcast = '', alerts = [],
  } = data || {};

  const projects = rawProjects.map(p => enrichProject(p, tasks, agents));
  const activeProjects = projects.filter(p => ['active', 'ACTIVE'].includes(p.status));
  const spent = budget.current?.daily_usd ?? 0;
  const hasDailyLimit = typeof budget.limits?.daily_usd === 'number' && budget.limits.daily_usd > 0;
  const limit = hasDailyLimit ? budget.limits.daily_usd : 0;
  const budgetUsagePct = hasDailyLimit ? Math.min(100, (spent / limit) * 100) : 0;
  const hitlCount = (tc.needs_human_decision ?? 0);
  const activeAgentCount = agents.filter(a => a.status !== 'available').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Page Title */}
      <div>
        <h1 style={{ marginBottom: 4 }}>Operations Overview</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Real-time view of your AGI team and active projects</p>
      </div>

      {/* ── KPI Bento Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard icon={Users} label="Active Agents" value={`${activeAgentCount}/${agents.length}`} color="var(--accent)" accentBg="#EEF2FF" />
        <KPICard icon={FolderKanban} label="Active Projects" value={activeProjects.length} color="var(--cyan)" accentBg="#ECFEFF" sub={`of ${projects.length} total`} />
        <KPICard icon={AlertTriangle} label="HITL Queue" value={hitlCount} color={hitlCount > 0 ? 'var(--purple)' : 'var(--mint)'} accentBg={hitlCount > 0 ? '#F5F3FF' : '#ECFDF5'} sub="Needs your input" />
        <KPICard
          icon={DollarSign}
          label="Daily Spend"
          value={`$${spent.toFixed(2)}`}
          color="var(--mint)"
          accentBg="#ECFDF5"
          sub={hasDailyLimit ? `of $${limit} limit` : 'No daily limit set'}
        />
      </div>

      {/* ── Budget Progress Bar ── */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <TrendingUp size={16} color="var(--accent)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', minWidth: 120 }}>Daily Budget Usage</span>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{
            width: `${budgetUsagePct}%`,
            background: budgetUsagePct > 80 ? 'var(--red)' : budgetUsagePct > 60 ? 'var(--amber)' : 'var(--mint)',
          }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 60, textAlign: 'right' }}>
          {Math.round(budgetUsagePct)}%
        </span>
      </div>

      {/* ── Project Matrix ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Project Matrix</h2>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{activeProjects.length} active</span>
        </div>
        {activeProjects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '64px', color: 'var(--muted)' }}>
            <FolderKanban size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>No active projects</div>
          </div>
        )}
      </div>

      {/* ── Fleet Pulse + Event Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24 }}>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Fleet Pulse</h2>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{agents.length} agents</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
              background: '#F8FAFC', borderBottom: '1px solid var(--border)',
              fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              <span style={{ minWidth: 20 }} />
              <span style={{ minWidth: 120 }}>Agent</span>
              <span style={{ flex: 1 }}>Current Work</span>
              <span style={{ minWidth: 50, textAlign: 'center' }}>Done</span>
              <span style={{ minWidth: 38, textAlign: 'right' }}>HB</span>
            </div>
            {agents.length > 0 ? agents.map(a => (
              <AgentRow key={a.id} agent={a} tasks={tasks} />
            )) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No agents found
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Event Stream</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <EventFeed broadcast={broadcast} />
        </div>

      </div>

      {/* Pulse keyframe injection */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>

    </div>
  );
}
