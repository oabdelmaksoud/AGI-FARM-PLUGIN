import LastUpdated from '../LastUpdated';

/* ─── Helpers ────────────────────────────────────────────────────── */
function healthScore(p) {
  const risks = (p._risks || []).filter(r => !r.resolved);
  const pct = p._progress_pct ?? 0;
  const due = p.target_completion ? Math.ceil((new Date(p.target_completion) - Date.now()) / 86400000) : 999;
  const tc = p._task_counts || {};
  if (risks.some(r => r.severity === 'critical') || (tc.blocked || 0) > 2 || due < -3) return 'critical';
  if (risks.length > 1 || (tc.hitl || 0) > 0 || due < 0 || pct < 30) return 'at-risk';
  return 'healthy';
}
const HEALTH_COLOR = { healthy: 'var(--green)', 'at-risk': 'var(--amber)', critical: 'var(--red)' };
const HEALTH_ICON = { healthy: '◈', 'at-risk': '⚠', critical: '🚨' };

function enrichProject(p, tasks, agents) {
  const pTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
  const done = pTasks.filter(t => t.status === 'complete').length;
  const total = pTasks.length;
  const teamAgents = (p.team || []).map(id => agents.find(a => a.id === id)).filter(Boolean);
  const milestones = p.milestones || [];
  return {
    ...p,
    _task_counts: {
      total, done,
      active: pTasks.filter(t => t.status === 'in-progress').length,
      blocked: pTasks.filter(t => t.status === 'blocked').length,
      hitl: pTasks.filter(t => t.status === 'needs_human_decision').length,
    },
    _milestone_counts: { total: milestones.length, done: milestones.filter(m => m.status === 'complete').length },
    _progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
    _risks: p._risks || [],
    _team_agents: teamAgents,
    _active_tasks: pTasks.filter(t => t.status === 'in-progress'),
  };
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
  return diff;
}

/* ─── Project Command Card ───────────────────────────────────────── */
function ProjectCommandCard({ project: p }) {
  const health = healthScore(p);
  const color = HEALTH_COLOR[health];
  const pct = p._progress_pct ?? 0;
  const tc = p._task_counts || {};
  const mc = p._milestone_counts || {};
  const deadline = daysUntil(p.target_completion);
  const deadlineLabel = deadline == null ? null
    : deadline < 0 ? `${Math.abs(deadline)}d OVERDUE`
      : deadline === 0 ? 'DUE TODAY'
        : `${deadline}d LEFT`;
  const deadlineColor = deadline == null ? 'var(--muted)'
    : deadline < 0 ? 'var(--red)' : deadline <= 3 ? 'var(--amber)' : 'var(--muted)';

  return (
    <div className="card shadow-glow" style={{
      padding: 0, overflow: 'hidden',
      border: `1px solid ${color}33`,
      background: `rgba(8,8,16,0.7)`,
      transition: 'all 0.2s'
    }}>
      {/* Color bar at top */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ padding: '16px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color, textShadow: `0 0 8px ${color}` }}>{HEALTH_ICON[health]}</span>
              <span style={{ fontWeight: 900, fontSize: 15, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {p.id} // STATUS:{p.status?.toUpperCase()}
              {deadlineLabel && <span style={{ color: deadlineColor, marginLeft: 10 }}>⏱ {deadlineLabel}</span>}
            </div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'Rajdhani, sans-serif', flexShrink: 0 }}>{pct}%</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3, boxShadow: `0 0 10px ${color}44`, transition: 'width 1s ease' }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
          {[
            [tc.done ?? 0, tc.total ?? 0, 'TASKS', 'var(--cyan)'],
            [mc.done ?? 0, mc.total ?? 0, 'PHASES', 'var(--green)'],
            [tc.active ?? 0, null, 'ACTIVE', 'var(--amber)'],
            [tc.blocked ?? 0, null, 'BLOCKED', tc.blocked ? 'var(--red)' : 'var(--muted)'],
          ].map(([v, tot, label, c]) => (
            <div key={label} style={{ textAlign: 'center', padding: '6px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: c, fontFamily: 'Rajdhani, sans-serif' }}>{tot != null ? `${v}/${tot}` : v}</div>
              <div style={{ fontSize: 7, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Active tasks */}
        {p._active_tasks?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {p._active_tasks.slice(0, 2).map(t => (
              <div key={t.id} style={{ fontSize: 10, color: 'var(--cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'JetBrains Mono, monospace' }}>
                ▶ {t.title}
              </div>
            ))}
          </div>
        )}

        {/* Team agents */}
        {p._team_agents?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginRight: 4 }}>TEAM:</span>
            {p._team_agents.slice(0, 6).map(a => (
              <span key={a.id} title={a.name} style={{
                fontSize: 14, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'default'
              }}>{a.emoji || '🤖'}</span>
            ))}
            {p._team_agents.length > 6 && <span style={{ fontSize: 9, color: 'var(--muted)' }}>+{p._team_agents.length - 6}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Agent Activity Row (secondary) ─────────────────────────────── */
function AgentActivityRow({ agent: a, tasks, projects }) {
  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const hitlTask = agentTasks.find(t => t.status === 'needs_human_decision');
  const age = a.heartbeat_age_minutes ?? 999;

  // Find which project this agent is currently serving
  const activeProject = activeTask
    ? projects.find(p => (p.task_ids || []).includes(activeTask.id) || (p.team || []).includes(a.id))
    : null;

  const statusColor = { active: 'var(--green)', available: 'var(--cyan)', busy: 'var(--amber)', error: 'var(--red)' }[a.status] || 'var(--muted)';
  const hbColor = age < 5 ? 'var(--green)' : age < 15 ? 'var(--amber)' : 'var(--red)';
  const borderLeft = hitlTask ? '3px solid var(--purple)' : activeTask ? '3px solid var(--cyan)' : a.status === 'error' ? '3px solid var(--red)' : '3px solid transparent';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, borderLeft,
      background: hitlTask ? 'rgba(181,53,255,0.04)' : activeTask ? 'rgba(0,240,255,0.02)' : 'rgba(255,255,255,0.01)',
      border: `1px solid ${hitlTask ? 'rgba(181,53,255,0.15)' : activeTask ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
      borderLeftWidth: 3, transition: 'all 0.2s'
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>{a.emoji || '🤖'}</span>
        <span style={{ position: 'absolute', bottom: -1, right: -3, width: 6, height: 6, borderRadius: '50%', background: statusColor, border: '1px solid var(--bg)', boxShadow: `0 0 4px ${statusColor}` }} />
      </div>
      <div style={{ minWidth: 80, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', fontFamily: 'Rajdhani, sans-serif' }}>{a.name.toUpperCase()}</div>
        {activeProject && <div style={{ fontSize: 8, color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>📂 {activeProject.name.toUpperCase().slice(0, 14)}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {hitlTask ? <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🚨 HITL: {hitlTask.title}</div>
          : activeTask ? <div style={{ fontSize: 10, color: 'var(--cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>▶ {activeTask.title}</div>
            : <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>IDLE</div>}
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--green)', fontFamily: 'Rajdhani, sans-serif' }}>{a.tasks_completed ?? 0}</div>
        <div style={{ fontSize: 7, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>DONE</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: hbColor, fontFamily: 'JetBrains Mono, monospace', minWidth: 32, textAlign: 'right' }}>
        {age < 999 ? `${age}m` : '—'}
      </div>
      {a.inbox_count > 0 && <div style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 800, animation: 'pulse 2s infinite' }}>📬{a.inbox_count}</div>}
    </div>
  );
}

/* ─── Main Overview ───────────────────────────────────────────────── */
export default function Overview({ data, lastUpdated }) {
  const {
    agents = [], tasks = [], task_counts: tc = {}, sla_at_risk = [],
    projects: rawProjects = [], budget = {}, broadcast = '',
    crons = [], alerts = [],
  } = data || {};

  // Enrich projects with task/agent context
  const projects = rawProjects.map(p => enrichProject(p, tasks, agents));
  const activeProjects = projects.filter(p => ['active', 'ACTIVE'].includes(p.status));
  const otherProjects = projects.filter(p => !['active', 'ACTIVE'].includes(p.status));

  // Summary stats from projects
  const criticalProjects = projects.filter(p => healthScore(p) === 'critical').length;
  const atRiskProjects = projects.filter(p => healthScore(p) === 'at-risk').length;
  const healthyProjects = projects.filter(p => healthScore(p) === 'healthy').length;
  const totalProjectTasks = projects.reduce((sum, p) => sum + (p._task_counts?.total || 0), 0);
  const totalDone = projects.reduce((sum, p) => sum + (p._task_counts?.done || 0), 0);

  const errorCrons = crons.filter(j => (j._consecutive_errors || 0) >= 3).length;
  const critAlerts = alerts.filter(a => a.severity === 'critical').length;
  const limits = budget.limits || {};
  const current = budget.current || {};
  const spent = current.daily_usd ?? 0;
  const limit = limits.daily_usd ?? 1;
  const threshold = (budget.alerts?.daily_threshold_pct ?? 70);
  const broadcastPreview = (broadcast || '').split('\n').filter(l => l.trim()).slice(-4);

  const sortedAgents = [...agents].sort((a, b) => {
    const score = ag => {
      const ats = tasks.filter(t => t.assigned_to === ag.id);
      if (ats.some(t => t.status === 'needs_human_decision')) return 0;
      if (ats.some(t => t.status === 'in-progress')) return 1;
      if (ag.status === 'error') return 2;
      return 3;
    };
    return score(a) - score(b);
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── CRITICAL ALERTS ── */}
      {critAlerts > 0 && (
        <div style={{ padding: '10px 16px', background: 'rgba(255,42,85,.1)', border: '1px solid rgba(255,42,85,.4)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, animation: 'pulse 1.5s infinite' }}>🚨</span>
          <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{critAlerts} critical alert{critAlerts > 1 ? 's' : ''} require attention</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>→ Alerts tab</span>
        </div>
      )}

      {/* ── PROJECT COMMAND BOARD (HERO) ── */}
      <div className="card shadow-glow" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.01)' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>PROJECT COMMAND BOARD</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              {projects.length} TOTAL // {activeProjects.length} ACTIVE // {totalDone}/{totalProjectTasks} CYCLES COMPLETE
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            {[
              [healthyProjects, 'HEALTHY', 'var(--green)'],
              [atRiskProjects, 'AT RISK', 'var(--amber)'],
              [criticalProjects, 'CRITICAL', 'var(--red)'],
            ].map(([n, label, c]) => n > 0 && (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: c, fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
              </div>
            ))}
            <LastUpdated ts={lastUpdated} />
          </div>
        </div>

        {/* Active Projects Grid */}
        <div style={{ padding: '16px 24px' }}>
          {activeProjects.length === 0 && otherProjects.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              NO_PROJECTS // RUN SPRINT_PLANNING TO INITIALIZE
            </div>
          ) : (
            <>
              {activeProjects.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {activeProjects.map(p => <ProjectCommandCard key={p.id} project={p} />)}
                </div>
              )}

              {/* Other projects (paused/complete) — compact strip */}
              {otherProjects.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: 10 }}>OTHER_PROJECTS</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {otherProjects.map(p => {
                      const h = healthScore(p);
                      const c = HEALTH_COLOR[h];
                      return (
                        <div key={p.id} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: c }}>{HEALTH_ICON[h]}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{p.name.toUpperCase()}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{p.status}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>{p._progress_pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── SECONDARY ROW: Budget + SLA + Crons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ marginBottom: 0 }}>GLOBAL RESOURCE SPEND</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>${spent.toFixed(2)} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>/ ${limit}</span></span>
          </div>
          <div className="progress-track" style={{ position: 'relative', height: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (spent / limit) * 100)}%`, background: spent / limit > threshold / 100 ? 'var(--red)' : 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: '0 4px 4px 0' }} />
            <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${threshold}%`, width: 2, background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)', zIndex: 2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
            <span>{((spent / limit) * 100).toFixed(1)}% utilized</span>
            <span>Limit: ${limit} USD</span>
          </div>
        </div>

        <div className="card" style={{ borderColor: sla_at_risk.length > 0 ? 'rgba(255,42,85,.4)' : 'var(--border)' }}>
          <div className="section-title" style={{ color: sla_at_risk.length > 0 ? 'var(--red)' : 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{sla_at_risk.length > 0 ? '⚠ SLA At Risk' : '✅ SLA Status'}</span>
            <span>{sla_at_risk.length}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {sla_at_risk.length === 0
              ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>All tasks on schedule.</div>
              : sla_at_risk.slice(0, 3).map(t => (
                <div key={t.id} style={{ fontSize: 10, color: 'var(--red)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⏰ {t.title}</div>
              ))
            }
          </div>
        </div>

        <div className="card" style={{ borderColor: errorCrons ? 'rgba(255,184,0,.4)' : 'var(--border)' }}>
          <div className="section-title">SYSTEM HEALTH</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>Crons</span>
              <span style={{ color: errorCrons ? 'var(--amber)' : 'var(--green)', fontWeight: 700 }}>{errorCrons ? `${errorCrons} erroring` : 'All healthy'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>HITL Gates</span>
              <span style={{ color: tc.needs_human_decision > 0 ? 'var(--purple)' : 'var(--muted)', fontWeight: 700 }}>{tc.needs_human_decision ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>Blocked Tasks</span>
              <span style={{ color: tc.blocked > 0 ? 'var(--red)' : 'var(--muted)', fontWeight: 700 }}>{tc.blocked ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AGENT ACTIVITY + BROADCAST ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>AGENT ACTIVITY</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {agents.filter(a => tasks.some(t => t.assigned_to === a.id && t.status === 'in-progress')).length} ACTIVE // {agents.length} TOTAL
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sortedAgents.map((a, i) => <AgentActivityRow key={a.id} agent={a} tasks={tasks} projects={rawProjects} index={i} />)}
            {agents.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 11, padding: '20px 0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>NO_AGENTS_ONLINE</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live Broadcast */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>LIVE BROADCAST</span>
              <span className="dot dot-active" style={{ width: 6, height: 6 }} />
            </div>
            <div style={{ flex: 1, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5, background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>
              {broadcastPreview.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 11 }}>Awaiting transmission...</div>
                : broadcastPreview.map((line, i) => {
                  const low = line.toLowerCase();
                  const color = low.includes('[critical]') ? 'var(--red)' : low.includes('[blocked]') ? 'var(--amber)' : low.includes('[hitl]') ? 'var(--purple)' : low.includes('[done]') ? 'var(--green)' : 'var(--text)';
                  return <div key={i} style={{ color, fontSize: 10, lineHeight: 1.6, wordBreak: 'break-word' }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)', marginRight: 8 }}>{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                    {line}
                  </div>;
                })
              }
            </div>
          </div>

          {/* Recent Task Feed */}
          <div className="card">
            <div className="section-title">RECENT CYCLES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
              {tasks.slice(-6).reverse().map(t => {
                const s = (t.status || '').toLowerCase().replace(/ /g, '-');
                const cls = { complete: 'badge-complete', pending: 'badge-pending', 'in-progress': 'badge-in-progress', failed: 'badge-failed', needs_human_decision: 'badge-hitl', blocked: 'badge-blocked' }[s] || 'badge-pending';
                const agent = agents.find(a => a.id === t.assigned_to);
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    {agent && <span style={{ fontSize: 12 }}>{agent.emoji}</span>}
                    <span style={{ flex: 1, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{t.title || '—'}</span>
                    <span className={`badge ${cls}`} style={{ fontSize: 8 }}>{t.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
