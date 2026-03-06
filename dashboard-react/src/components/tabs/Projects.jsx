import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import LastUpdated from '../LastUpdated';
import {
  listProjects,
  submitIntakeTask,
  planProject,
  executeProject,
  updateProjectBudget,
  updateProjectOkrLink,
} from '../../lib/api';

/* ─── Design Tokens ────────────────────────────────────────────── */
const STATUS_COLOR = { active: 'var(--accent)', complete: 'var(--mint)', paused: 'var(--amber)', archived: 'var(--muted)', pending: 'var(--muted)' };
const RISK_COLOR = { critical: 'var(--red)', high: 'var(--red)', medium: 'var(--amber)', low: 'var(--muted)' };
const RISK_ICON = { blocked: 'Ø', hitl_pending: '!', overdue: 'τ', agent_error: 'δ', sla_breach: 'ψ' };
const ACT_ICON = { task_complete: '✓', task_failed: '⨯', decision: 'θ', risk: '!', milestone: '⚐' };
const HEALTH_COLOR = { green: 'var(--mint)', amber: 'var(--amber)', red: 'var(--red)' };

const tooltipStyle = {
  background: '#050505',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '2px',
  fontSize: '10px',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
  padding: '8px 12px'
};

/* ─── Helpers ──────────────────────────────────────────────────── */

function relTime(iso) {
  if (!iso) return '—';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff}M AGO`;
    if (diff < 1440) return `${Math.round(diff / 60)}H AGO`;
    return `${Math.round(diff / 1440)}D AGO`;
  } catch { return iso; }
}

function dueLabel(iso, done) {
  if (!iso) return null;
  try {
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (done) return { label: new Date(iso).toLocaleDateString(), color: 'var(--muted)' };
    if (diff < 0) return { label: `${Math.abs(diff)}D OVERDUE`, color: 'var(--red)' };
    if (diff === 0) return { label: 'DUE TODAY', color: 'var(--amber)' };
    if (diff === 1) return { label: 'DUE TOMORROW', color: 'var(--amber)' };
    return { label: `IN ${diff}D`, color: 'var(--muted)' };
  } catch { return { label: iso, color: 'var(--muted)' }; }
}

function healthScore(p) {
  const risks = (p._risks || []).filter(r => !r.resolved);
  const pct = p._progress_pct ?? 0;
  const due = p.target_completion ? Math.ceil((new Date(p.target_completion) - Date.now()) / 86400000) : 999;
  const tc = p._task_counts || {};
  if (risks.some(r => r.severity === 'critical') || (tc.blocked || 0) > 2 || due < -3) return 'red';
  if (risks.length > 1 || (tc.hitl || 0) > 0 || due < 0 || pct < 30) return 'amber';
  return 'green';
}

function exportMarkdown(p, agents) {
  const tc = p._task_counts || {};
  const lines = [
    `# ${p.name}`,
    `**Status**: ${p.status} | **Progress**: ${p._progress_pct ?? 0}% | **Health**: ${healthScore(p).toUpperCase()}`,
    `**Owner**: ${agents.find(a => a.id === p.owner)?.name || p.owner}`,
    p.target_completion ? `**Target**: ${new Date(p.target_completion).toLocaleDateString()}` : '',
    `**Tasks**: ${tc.done || 0}/${tc.total || 0} done`, '',
    `## Description`, p.description || '—', '',
    `## Milestones`,
    ...(p.milestones || []).map(ms => `- [${ms.status === 'complete' ? 'x' : ' '}] **${ms.title}** (${ms.status})`),
    '', `## Risks`,
    ...(p._risks || []).filter(r => !r.resolved).map(r => `- 🚨 [${r.severity}] ${r.description}`),
    '', `## Decisions`,
    ...(p.decisions || []).map(d => `- 🧠 **${d.decision}**`),
    '', `_Exported ${new Date().toLocaleString()}_`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${p.id}.md`; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Atomic UI ───────────────────────────────────────────────── */

function Badge({ label, color, size = 9 }) {
  return (
    <span style={{
      fontSize: `${size}px`, padding: '2px 8px', borderRadius: '2px', fontWeight: 800,
      textTransform: 'uppercase', color,
      background: 'rgba(255, 255, 255, 0.03)', border: `1px solid ${color}`,
      fontFamily: 'var(--font-mono)'
    }}>
      {label}
    </span>
  );
}

function ProgressRing({ pct, size = 56, color = 'var(--accent)' }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, dash = circ * (pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="square" style={{ transition: 'stroke-dasharray .8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.22, fontWeight: 800, color, fontFamily: 'var(--font-mono)'
      }}>
        {pct}%
      </div>
    </div>
  );
}

function AgentChip({ agentId, agents, isOwner }) {
  const a = agents.find(ag => ag.id === agentId);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '9px', padding: '3px 8px',
      borderRadius: '2px', background: isOwner ? 'rgba(37, 175, 244, 0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isOwner ? 'var(--accent)' : 'var(--border)'}`,
      color: isOwner ? 'var(--accent)' : 'var(--muted)',
      fontFamily: 'var(--font-mono)', fontWeight: 700
    }}>
      <span style={{ fontSize: '12px' }}>{a?.emoji || '🤖'}</span>
      <span>{(a?.name || agentId).toUpperCase()}</span>
    </span>
  );
}

function HealthIndicator({ health }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[health] }} />
      <span style={{ fontSize: '9px', fontWeight: 800, color: HEALTH_COLOR[health], fontFamily: 'var(--font-mono)' }}>{health.toUpperCase()}</span>
    </div>
  );
}

function DeadlineBadge({ iso }) {
  const d = dueLabel(iso, false);
  if (!d) return null;
  return <span style={{ fontSize: '10px', color: d.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>[{d.label}]</span>;
}

/* ─── Visualizations ───────────────────────────────────────────── */

function GanttChart({ project: p }) {
  const milestones = p.milestones || [];
  if (!milestones.length) return <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '20px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '2px' }}>NO MILESTONES DEFINED</div>;
  const start = new Date(p.created_at || Date.now());
  const end = new Date(p.target_completion || Date.now() + 30 * 86400000);
  const total = Math.max(1, end - start);
  const nowPct = Math.max(0, Math.min(100, ((Date.now() - start) / total) * 100));
  const STATUS_C = { complete: 'var(--mint)', 'in-progress': 'var(--accent)', pending: 'rgba(255,255,255,0.05)', blocked: 'var(--red)' };

  return (
    <div style={{ position: 'relative', paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
        <span>T_START: {start.toLocaleDateString().toUpperCase()}</span>
        <span style={{ color: 'var(--amber)' }}>NOW</span>
        <span>T_END: {end.toLocaleDateString().toUpperCase()}</span>
      </div>
      <div style={{ position: 'relative', background: '#000', border: '1px solid var(--border)', padding: '20px 0' }}>
        <div style={{ position: 'absolute', left: `${nowPct}%`, top: 0, bottom: 0, width: '1px', background: 'var(--amber)', zIndex: 2 }} />
        {milestones.map(ms => {
          const msDue = ms.due ? new Date(ms.due) : end;
          const widthPct = Math.max(4, Math.min(100, ((msDue - start) / total) * 100));
          const isComplete = ms.status === 'complete';

          return (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '12px', padding: '0 20px' }}>
              <div style={{
                fontSize: '11px', color: isComplete ? 'var(--muted)' : '#fff', width: '140px', flexShrink: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600
              }}>
                {ms.title.toUpperCase()}
              </div>
              <div style={{ flex: 1, position: 'relative', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '1px' }}>
                <div style={{
                  position: 'absolute', left: 0, width: `${widthPct}%`, height: '100%',
                  background: STATUS_C[ms.status] || 'rgba(255,255,255,0.05)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', width: '60px', flexShrink: 0, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {ms.due ? new Date(ms.due).toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase() : '--'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BurndownChart({ project: p, tasks }) {
  const projTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
  const total = projTasks.length;
  if (!total) return <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>INDEX_EMPTY // NO TASKS</div>;
  const start = new Date(p.created_at || Date.now());
  const end = new Date(p.target_completion || Date.now() + 7 * 86400000);
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  const completions = projTasks.filter(t => t.completed_at).map(t => Math.max(0, Math.ceil((new Date(t.completed_at) - start) / 86400000))).sort((a, b) => a - b);
  const todayDay = Math.ceil((Date.now() - start) / 86400000);
  const data = Array.from({ length: days + 1 }, (_, i) => ({
    day: i,
    ideal: Math.round(total - (total / days) * i),
    actual: i <= todayDay ? total - completions.filter(c => c <= i).length : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }} orientation="right" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} />
        <Line type="stepAfter" dataKey="ideal" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" dot={false} name="IDEAL" />
        <Line type="stepAfter" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2, fill: 'var(--accent)' }} name="ACTUAL" />
        <ReferenceLine x={todayDay} stroke="var(--amber)" strokeDasharray="2 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BudgetMeter({ project: p }) {
  const alloc = p.budget?.allocated_usd || 0;
  const spent = p.budget?.spent_usd || 0;
  const pct = alloc ? Math.round((spent / alloc) * 100) : 0;
  const color = pct > 90 ? 'var(--red)' : pct > 75 ? 'var(--amber)' : 'var(--accent)';

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="section-title">BUDGET EXPENDITURE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
            ${spent.toFixed(2)} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}>/ ${alloc.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 800 }}>UTILIZATION</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{pct}%</div>
        </div>
      </div>
      <div className="progress-track" style={{ height: '4px' }}>
        <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      {pct > 80 && (
        <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          [!] CRITICAL_BURN_DETECTED: PROJECT_RUN_RATE_EXCEEDS_THRESHOLD
        </div>
      )}
    </div>
  );
}

/* ─── List & Cards ────────────────────────────────────────────── */

function ProjectCard({ project: p, agents, selected, onClick }) {
  const tc = p._task_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const color = pct === 100 ? 'var(--mint)' : risks.length ? 'var(--red)' : 'var(--accent)';

  return (
    <div onClick={onClick} className="card fade-in" style={{
      cursor: 'pointer', padding: '20px', transition: 'background 0.2s',
      borderColor: selected ? 'var(--accent)' : 'var(--border)',
      background: selected ? 'rgba(37, 175, 244, 0.03)' : '#0a0a0a'
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: '20px' }}>
        <ProgressRing pct={pct} size={52} color={color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name.toUpperCase()}
            </span>
            <HealthIndicator health={health} />
          </div>
          <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {p.id} // STATUS: {p.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px', height: '36px', overflow: 'hidden' }}>
        {p.description}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '20px' }}>
        {[
          { l: 'CYCLES', v: `${tc.done || 0}/${tc.total || 0}`, c: 'var(--accent)' },
          { l: 'HITL', v: tc.hitl || 0, c: tc.hitl ? 'var(--purple)' : 'var(--muted)' },
          { l: 'BLOCKED', v: tc.blocked || 0, c: tc.blocked ? 'var(--red)' : 'var(--muted)' },
          { l: 'SPEND', v: `$${(p.budget?.spent_usd ?? 0).toFixed(0)}`, c: '#fff' }
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: 800, marginBottom: '2px' }}>{s.l}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AgentChip agentId={p.owner} agents={agents} isOwner />
        <DeadlineBadge iso={p.target_completion} />
      </div>

      {risks.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '9px', color: 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
          ! {risks.length} THREATS DETECTED
        </div>
      )}
    </div>
  );
}

/* ─── Detail View ─────────────────────────────────────────────── */

const SECTIONS = ['OVERVIEW', 'TIMELINE', 'TASKS', 'RESOURCES', 'OKRS', 'LOGS'];

function ProjectDetail({ project: p, agents, tasks, okrs, onClose, onReplan, onExecute, onSaveBudget, onSaveOkr, lastUpdated }) {
  const [section, setSection] = useState('OVERVIEW');
  const tc = p._task_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const color = pct === 100 ? 'var(--mint)' : risks.length ? 'var(--red)' : 'var(--accent)';

  return (
    <div className="fade-in" style={{ border: '1px solid var(--border)', background: '#050505', marginBottom: '32px' }}>
      {/* Detail Header */}
      <div style={{ padding: '30px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 30, alignItems: 'flex-start' }}>
        <ProgressRing pct={pct} size={90} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800 }}>{p.name.toUpperCase()}</span>
            <Badge label={p.status} color={STATUS_COLOR[p.status]} />
            <HealthIndicator health={health} />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px', maxWidth: '800px' }}>
            {p.description}
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <AgentChip agentId={p.owner} agents={agents} isOwner />
            <DeadlineBadge iso={p.target_completion} />
            <div style={{ display: 'flex', gap: 8 }}>
              {(p.tags || []).map(t => <Badge key={t} label={t} color="var(--accent)" size={8} />)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '160px' }}>
          <button className="btn-primary" onClick={() => onExecute?.(p.id)} style={{ padding: '10px' }}>EXECUTE_NOW</button>
          <button className="btn-secondary" onClick={() => onReplan?.(p.id)} style={{ padding: '10px' }}>REPLAN</button>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px' }}>EXIT_DETAIL</button>
        </div>
      </div>

      {/* Internal Nav */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', padding: '0 30px' }}>
        {SECTIONS.map(s => {
          const isActive = section === s;
          return (
            <button key={s} onClick={() => setSection(s)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px',
              fontSize: '11px', fontWeight: 800, color: isActive ? '#fff' : 'var(--muted)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s', fontFamily: 'var(--font-mono)'
            }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Content Viewport */}
      <div style={{ padding: '30px', minHeight: '400px' }}>
        {section === 'OVERVIEW' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
            <div>
              <div className="section-title">PHASE_TRAJECTORY</div>
              <GanttChart project={p} />

              <div className="section-title" style={{ marginTop: '40px' }}>THREAT_MATRIX</div>
              {risks.length > 0 ? (
                risks.map(r => (
                  <div key={r.id} style={{ padding: '12px', border: '1px solid var(--red)', borderLeftWidth: '4px', marginBottom: '12px', background: 'rgba(255,42,85,0.03)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{r.description.toUpperCase()}</div>
                    <div style={{ fontSize: '9px', color: 'var(--red)', fontWeight: 800, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      SEVERITY: {r.severity.toUpperCase()} // DETECTED: {relTime(r.detected_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', border: '1px solid var(--border)', color: 'var(--mint)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  [OK] NO_THREATS_DETECTED
                </div>
              )}
            </div>
            <div>
              <div className="section-title">EVENT_LOG_STREAM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(p._activity || []).slice(0, 10).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, fontSize: '11px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>[{relTime(a.ts)}]</span>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{a.text.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'TIMELINE' && <BurndownChart project={p} tasks={tasks} />}

        {section === 'TASKS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {['in-progress', 'blocked', 'needs_human_decision', 'complete'].map(status => {
              const list = tasks.filter(t => (p.task_ids || []).includes(t.id) && t.status === status);
              return (
                <div key={status}>
                  <div className="section-title" style={{ color: status === 'blocked' ? 'var(--red)' : (status === 'complete' ? 'var(--mint)' : 'var(--accent)') }}>
                    {status.toUpperCase().replace(/_/g, ' ')} ({list.length})
                  </div>
                  {list.map(t => (
                    <div key={t.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: '8px', borderRadius: '2px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600 }}>{t.title.toUpperCase()}</div>
                      <div style={{ fontSize: '8px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{t.id}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {section === 'RESOURCES' && <BudgetMeter project={p} />}

        {section === 'LOGS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            {(p._sessions || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--accent)', minWidth: '80px' }}>{s.proc_id || '--'}</span>
                <span style={{ flex: 1 }}>{s.task_id}</span>
                <span style={{ color: s.status === 'failed' ? 'var(--red)' : 'var(--mint)' }}>{s.status?.toUpperCase()}</span>
                <span style={{ color: 'var(--muted)' }}>{relTime(s.completed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Controller ─────────────────────────────────────────── */

export default function Projects({ data, lastUpdated, toast }) {
  const { agents = [], tasks = [], okrs = {} } = data || {};
  const [projectsData, setProjectsData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', search: '', health: 'all' });
  const [sortBy, setSortBy] = useState('priority');
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intake, setIntake] = useState({ title: '', intent: '', description: '', priority: 'P2', tags: '', project_hint: '', deadline: '', budget_usd: '' });

  const refreshProjects = useCallback(async () => {
    try {
      const out = await listProjects();
      setProjectsData(out.projects || []);
    } catch { setProjectsData([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  const handleIntakeSubmit = async () => {
    if (!intake.intent.trim() && !intake.title.trim()) return;
    setSubmittingIntake(true);
    try {
      const out = await submitIntakeTask({ ...intake, tags: intake.tags.split(',').map(t => t.trim()).filter(Boolean) });
      await refreshProjects();
      setIntake({ title: '', intent: '', description: '', priority: 'P2', tags: '', project_hint: '', deadline: '', budget_usd: '' });
      toast?.(`Task routed: ${out.projectId}`, 'success');
    } catch (e) { toast?.(e.message, 'error'); }
    finally { setSubmittingIntake(false); }
  };

  const enriched = useMemo(() => projectsData.map(p => {
    const pTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
    const done = pTasks.filter(t => t.status === 'complete').length;
    return {
      ...p,
      _task_counts: { total: pTasks.length, done, active: pTasks.filter(t => t.status === 'in-progress').length, blocked: pTasks.filter(t => t.status === 'blocked').length, hitl: pTasks.filter(t => t.status === 'needs_human_decision').length },
      _progress_pct: pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0,
      _risks: p._risks || [],
      _activity: p._activity || []
    };
  }), [projectsData, tasks]);

  const filtered = useMemo(() => enriched.filter(p => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.health !== 'all' && healthScore(p) !== filters.health) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.priority_weight || 0) - (a.priority_weight || 0)), [enriched, filters]);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>SYNCHRONIZING_MATRIX...</div>;

  return (
    <div className="fade-in">
      {/* Global Metrics Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>STRATEGIC_COMMAND</h1>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>STATUS: NOMINAL // PROJECTS: {enriched.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 24, padding: '12px 24px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <div className="section-title" style={{ fontSize: '8px' }}>AVG_HEALTH_SCORE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mint)' }}>OPTIMAL</div>
          </div>
          <div>
            <div className="section-title" style={{ fontSize: '8px' }}>ACTIVE_PIPELINES</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>{enriched.filter(p => p.status === 'active').length}</div>
          </div>
        </div>
      </div>

      {/* Intake Module */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px', background: 'rgba(37, 175, 244, 0.03)', borderColor: 'var(--accent)' }}>
        <div className="section-title" style={{ color: 'var(--accent)' }}>AUTONOMOUS_INTAKE_PORTAL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '12px' }}>
          <input className="input-base" placeholder="TASK_TITLE" value={intake.title} onChange={e => setIntake({ ...intake, title: e.target.value })} />
          <input className="input-base" placeholder="PRIMARY_INTENT (REQUIRED)" value={intake.intent} onChange={e => setIntake({ ...intake, intent: e.target.value })} />
          <select className="input-base" value={intake.priority} onChange={e => setIntake({ ...intake, priority: e.target.value })}>
            <option value="P1">P1_PRIORITY</option>
            <option value="P2">P2_PRIORITY</option>
            <option value="P3">P3_PRIORITY</option>
          </select>
          <input className="input-base" placeholder="PROJECT_HINT" value={intake.project_hint} onChange={e => setIntake({ ...intake, project_hint: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', gap: 12 }}>
          <input className="input-base" placeholder="CONCURRENT_CONSTRAINTS" value={intake.description} onChange={e => setIntake({ ...intake, description: e.target.value })} />
          <input className="input-base" placeholder="TAG_ARRAY (CSV)" value={intake.tags} onChange={e => setIntake({ ...intake, tags: e.target.value })} />
          <input className="input-base" type="date" value={intake.deadline} onChange={e => setIntake({ ...intake, deadline: e.target.value })} />
          <input className="input-base" type="number" placeholder="BUDGET_ALLOWANCE" value={intake.budget_usd} onChange={e => setIntake({ ...intake, budget_usd: e.target.value })} />
          <button className="btn-primary" onClick={handleIntakeSubmit} disabled={submittingIntake || !intake.intent.trim()}>PROCESS</button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="card" style={{ display: 'flex', gap: 16, padding: '16px 24px', marginBottom: '32px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <input className="input-base" style={{ flex: 1 }} placeholder="FILTER_PROJECT_INDEX..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        <select className="input-base" style={{ width: '160px' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="all">ALL_STATUS</option>
          {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <select className="input-base" style={{ width: '160px' }} value={filters.health} onChange={e => setFilters({ ...filters, health: e.target.value })}>
          <option value="all">ALL_HEALTH</option>
          <option value="healthy">HEALTHY_STABLE</option>
          <option value="at-risk">AT_RISK</option>
          <option value="critical">CRITICAL_FAIL</option>
        </select>
        <LastUpdated ts={lastUpdated} />
      </div>

      {enriched.find(p => p.id === selectedId) && (
        <ProjectDetail
          project={enriched.find(p => p.id === selectedId)}
          agents={agents} tasks={tasks} okrs={okrs} lastUpdated={lastUpdated}
          onReplan={handleReplan} onExecute={handleExecute} onSaveBudget={handleBudgetQuickSave} onSaveOkr={handleOkrQuickSave}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, opacity: selectedId ? 0.4 : 1, transition: 'opacity 0.3s' }}>
        {filtered.map(p => <ProjectCard key={p.id} project={p} agents={agents} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />)}
      </div>
    </div>
  );
}
