import LastUpdated from '../LastUpdated';

/* Helpers */
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
const HEALTH_LABEL = { healthy: 'Healthy', 'at-risk': 'At Risk', critical: 'Critical' };

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
  return Math.ceil((new Date(iso) - Date.now()) / 86400000);
}

/* KPI Card */
function KpiCard({ label, value, sub, color = 'var(--text)', accent }) {
  return (
    <div className="kpi-card" style={accent ? { borderColor: `${accent}33` } : {}}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

/* Project Card */
function ProjectCard({ project: p }) {
  const health = healthScore(p);
  const color = HEALTH_COLOR[health];
  const pct = p._progress_pct ?? 0;
  const tc = p._task_counts || {};
  const deadline = daysUntil(p.target_completion);
  const deadlineLabel = deadline == null ? null
    : deadline < 0 ? `${Math.abs(deadline)}d overdue`
      : deadline === 0 ? 'Due today'
        : `${deadline}d remaining`;
  const deadlineColor = deadline == null ? 'var(--muted)'
    : deadline < 0 ? 'var(--red)' : deadline <= 3 ? 'var(--amber)' : 'var(--text-secondary)';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: '16px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span className="badge" style={{ background: `${color}18`, color, fontSize: 9 }}>{HEALTH_LABEL[health]}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {p.id}
              {deadlineLabel && <span style={{ color: deadlineColor, marginLeft: 12 }}>{deadlineLabel}</span>}
            </div>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color, flexShrink: 0 }}>{pct}%</span>
        </div>

        {/* Progress */}
        <div className="progress-track" style={{ marginBottom: 14 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : color }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            [tc.done ?? 0, tc.total ?? 0, 'Tasks', 'var(--cyan)'],
            [tc.active ?? 0, null, 'Active', 'var(--amber)'],
            [tc.blocked ?? 0, null, 'Blocked', tc.blocked ? 'var(--red)' : 'var(--muted)'],
            [tc.hitl ?? 0, null, 'HITL', tc.hitl ? 'var(--purple)' : 'var(--muted)'],
          ].map(([v, tot, label, c]) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg3)', borderRadius: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{tot != null ? `${v}/${tot}` : v}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Active tasks */}
        {p._active_tasks?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {p._active_tasks.slice(0, 2).map(t => (
              <div key={t.id} style={{ fontSize: 12, color: 'var(--cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                {t.title}
              </div>
            ))}
          </div>
        )}

        {/* Team */}
        {p._team_agents?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {p._team_agents.slice(0, 6).map(a => (
              <span key={a.id} title={a.name} style={{
                fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--border)',
              }}>{a.emoji || '\u{1F916}'}</span>
            ))}
            {p._team_agents.length > 6 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>+{p._team_agents.length - 6}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* Agent Row */
function AgentRow({ agent: a, tasks, projects }) {
  const agentTasks = tasks.filter(t => t.assigned_to === a.id);
  const activeTask = agentTasks.find(t => t.status === 'in-progress');
  const hitlTask = agentTasks.find(t => t.status === 'needs_human_decision');
  const age = a.heartbeat_age_minutes ?? 999;

  const activeProject = activeTask
    ? projects.find(p => (p.task_ids || []).includes(activeTask.id) || (p.team || []).includes(a.id))
    : null;

  const statusColor = { active: 'var(--green)', available: 'var(--cyan)', busy: 'var(--amber)', error: 'var(--red)' }[a.status] || 'var(--muted)';
  const hbColor = age < 5 ? 'var(--green)' : age < 15 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
      background: hitlTask ? 'var(--purple-dim)' : activeTask ? 'var(--cyan-dim)' : 'var(--bg3)',
      borderLeft: `3px solid ${hitlTask ? 'var(--purple)' : activeTask ? 'var(--cyan)' : a.status === 'error' ? 'var(--red)' : 'transparent'}`,
      transition: 'all 0.2s',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>{a.emoji || '\u{1F916}'}</span>
        <span style={{ position: 'absolute', bottom: -1, right: -3, width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
      </div>
      <div style={{ minWidth: 80, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
        {activeProject && <div style={{ fontSize: 10, color: 'var(--amber)' }}>{activeProject.name}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {hitlTask ? <div style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>HITL: {hitlTask.title}</div>
          : activeTask ? <div style={{ fontSize: 12, color: 'var(--cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTask.title}</div>
            : <div style={{ fontSize: 12, color: 'var(--muted)' }}>Idle</div>}
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 36 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{a.tasks_completed ?? 0}</div>
        <div style={{ fontSize: 9, color: 'var(--muted)' }}>done</div>
      </div>
      <span className="mono" style={{ color: hbColor, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
        {age < 999 ? `${age}m` : '\u2014'}
      </span>
    </div>
  );
}

/* Main Overview */
export default function Overview({ data, lastUpdated }) {
  const {
    agents = [], tasks = [], task_counts: tc = {}, sla_at_risk = [],
    projects: rawProjects = [], budget = {}, broadcast = '',
    crons = [], alerts = [],
  } = data || {};

  const projects = rawProjects.map(p => enrichProject(p, tasks, agents));
  const activeProjects = projects.filter(p => ['active', 'ACTIVE'].includes(p.status));
  const otherProjects = projects.filter(p => !['active', 'ACTIVE'].includes(p.status));

  const criticalProjects = projects.filter(p => healthScore(p) === 'critical').length;
  const atRiskProjects = projects.filter(p => healthScore(p) === 'at-risk').length;
  const totalProjectTasks = projects.reduce((sum, p) => sum + (p._task_counts?.total || 0), 0);
  const totalDone = projects.reduce((sum, p) => sum + (p._task_counts?.done || 0), 0);

  const errorCrons = crons.filter(j => (j._consecutive_errors || 0) >= 3).length;
  const critAlerts = alerts.filter(a => a.severity === 'critical').length;
  const limits = budget.limits || {};
  const current = budget.current || {};
  const spent = current.daily_usd ?? 0;
  const limit = limits.daily_usd ?? 1;
  const threshold = (budget.alerts?.daily_threshold_pct ?? 70);
  const budgetPct = Math.min(100, (spent / limit) * 100);
  const broadcastPreview = (broadcast || '').split('\n').filter(l => l.trim()).slice(-5);
  const online = agents.filter(a => ['active', 'available', 'busy'].includes(a.status)).length;
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'complete').length / tasks.length) * 100)
    : 0;

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
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Critical Alert Banner */}
      {critAlerts > 0 && (
        <div className="card" style={{ padding: '12px 20px', borderColor: 'rgba(239,68,68,0.3)', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, animation: 'pulse 1.5s infinite' }}>&#x26A0;</span>
          <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{critAlerts} critical alert{critAlerts > 1 ? 's' : ''} require attention</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>View in Alerts tab</span>
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <KpiCard label="Agents Online" value={`${online}/${agents.length}`} color="var(--cyan)" sub={`${agents.filter(a => a.status === 'error').length} errors`} />
        <KpiCard label="Active Tasks" value={tc.active ?? 0} color="var(--amber)" sub={`${tc.pending ?? 0} pending`} />
        <KpiCard label="Completion Rate" value={`${completionRate}%`} color="var(--green)" sub={`${totalDone}/${totalProjectTasks} project tasks`} />
        <KpiCard label="Daily Spend" value={`$${spent.toFixed(2)}`} color={budgetPct > threshold ? 'var(--red)' : 'var(--green)'}
          sub={`${budgetPct.toFixed(0)}% of $${limit} limit`} accent={budgetPct > threshold ? 'var(--red)' : undefined} />
        {(tc.needs_human_decision ?? 0) > 0 && (
          <KpiCard label="HITL Pending" value={tc.needs_human_decision} color="var(--purple)" sub="Awaiting human decision" accent="var(--purple)" />
        )}
      </div>

      {/* Projects Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Projects</h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {projects.length} total &middot; {activeProjects.length} active
              {criticalProjects > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>{criticalProjects} critical</span>}
              {atRiskProjects > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>{atRiskProjects} at risk</span>}
            </div>
          </div>
          <LastUpdated ts={lastUpdated} />
        </div>

        {activeProjects.length === 0 && otherProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#x1F4CB;</div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-desc">Run sprint planning to initialize your first project</div>
          </div>
        ) : (
          <>
            {activeProjects.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}

            {otherProjects.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Other Projects</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {otherProjects.map(p => {
                    const h = healthScore(p);
                    const c = HEALTH_COLOR[h];
                    return (
                      <div key={p.id} className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                        <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--muted)', fontSize: 10 }}>{p.status}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{p._progress_pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Grid: Budget + SLA + Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        {/* Budget */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ marginBottom: 0 }}>Resource Spend</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>${spent.toFixed(2)} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>/ ${limit}</span></span>
          </div>
          <div className="progress-track" style={{ position: 'relative', height: 8 }}>
            <div className="progress-fill" style={{ width: `${budgetPct}%`, background: budgetPct > threshold ? 'var(--red)' : 'var(--cyan)' }} />
            <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${threshold}%`, width: 2, background: 'var(--amber)', zIndex: 2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            <span>{budgetPct.toFixed(1)}% utilized</span>
            <span>Threshold: {threshold}%</span>
          </div>
        </div>

        {/* SLA */}
        <div className="card" style={{ borderColor: sla_at_risk.length > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>SLA Status</span>
            <span style={{ color: sla_at_risk.length > 0 ? 'var(--red)' : 'var(--green)' }}>{sla_at_risk.length}</span>
          </div>
          {sla_at_risk.length === 0
            ? <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>All tasks on schedule</div>
            : sla_at_risk.slice(0, 3).map(t => (
              <div key={t.id} style={{ fontSize: 12, color: 'var(--red)', padding: '4px 0', borderBottom: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
            ))
          }
        </div>

        {/* System Health */}
        <div className="card">
          <div className="section-title">System Health</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              ['Cron Jobs', errorCrons ? `${errorCrons} erroring` : 'Healthy', errorCrons ? 'var(--amber)' : 'var(--green)'],
              ['HITL Gates', tc.needs_human_decision ?? 0, (tc.needs_human_decision ?? 0) > 0 ? 'var(--purple)' : 'var(--muted)'],
              ['Blocked', tc.blocked ?? 0, (tc.blocked ?? 0) > 0 ? 'var(--red)' : 'var(--muted)'],
            ].map(([label, val, c]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: c, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Activity + Broadcast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Agent Activity</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {agents.filter(a => tasks.some(t => t.assigned_to === a.id && t.status === 'in-progress')).length} active &middot; {agents.length} total
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedAgents.map(a => <AgentRow key={a.id} agent={a} tasks={tasks} projects={rawProjects} />)}
            {agents.length === 0 && (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-desc">No agents online</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Broadcast */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Live Broadcast</span>
              <span className="dot dot-active" style={{ width: 6, height: 6 }} />
            </div>
            <div style={{ flex: 1, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>
              {broadcastPreview.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>Awaiting transmission...</div>
                : broadcastPreview.map((line, i) => {
                  const low = line.toLowerCase();
                  const color = low.includes('[critical]') ? 'var(--red)' : low.includes('[blocked]') ? 'var(--amber)' : low.includes('[hitl]') ? 'var(--purple)' : low.includes('[done]') ? 'var(--green)' : 'var(--text)';
                  return <div key={i} style={{ color, fontSize: 11, lineHeight: 1.6, wordBreak: 'break-word' }}>
                    <span style={{ color: 'var(--muted)', marginRight: 8 }}>{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                    {line}
                  </div>;
                })
              }
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <div className="section-title">Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
              {tasks.slice(-6).reverse().map(t => {
                const s = (t.status || '').toLowerCase().replace(/ /g, '-');
                const cls = { complete: 'badge-complete', pending: 'badge-pending', 'in-progress': 'badge-in-progress', failed: 'badge-failed', needs_human_decision: 'badge-hitl', blocked: 'badge-blocked' }[s] || 'badge-pending';
                const agent = agents.find(a => a.id === t.assigned_to);
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    {agent && <span style={{ fontSize: 14 }}>{agent.emoji}</span>}
                    <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{t.title || '\u2014'}</span>
                    <span className={`badge ${cls}`} style={{ fontSize: 9 }}>{t.status}</span>
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
