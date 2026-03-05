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

const STATUS_COLOR = { active: 'var(--cyan)', complete: 'var(--green)', paused: 'var(--amber)', archived: 'var(--muted)', pending: 'var(--muted)' };
const RISK_COLOR = { critical: 'var(--red)', high: 'var(--red)', medium: 'var(--amber)', low: 'var(--muted)' };
const RISK_ICON = { blocked: '🚫', hitl_pending: '🚨', overdue: '⏰', agent_error: '🔴', sla_breach: '💥' };
const ACT_ICON = { task_complete: '✅', task_failed: '❌', decision: '🧠', risk: '⚠️', milestone: '🏁' };
const HEALTH_COLOR = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' };

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

function dueLabel(iso, done) {
  if (!iso) return null;
  try {
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (done) return { label: new Date(iso).toLocaleDateString(), color: 'var(--muted)' };
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'var(--red)' };
    if (diff === 0) return { label: 'due today', color: 'var(--amber)' };
    if (diff === 1) return { label: 'due tomorrow', color: 'var(--amber)' };
    return { label: `in ${diff}d`, color: 'var(--muted)' };
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

function Badge({ label, color, size = 9 }) {
  return (
    <span style={{
      fontSize: size, padding: '2px 8px', borderRadius: 4, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.08em', color,
      background: `${color}11`, border: `1px solid ${color}44`,
      fontFamily: 'JetBrains Mono, monospace', boxShadow: `0 0 10px ${color}11`
    }}>
      {label}
    </span>
  );
}

function ProgressRing({ pct, size = 56, color = 'var(--cyan)' }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0, filter: `drop-shadow(0 0 5px ${color}33)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.03)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" style={{
        fontSize: size * 0.2, fontWeight: 900, fill: color, transform: 'rotate(90deg)',
        transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'Rajdhani, sans-serif'
      }}>
        {pct}%
      </text>
    </svg>
  );
}

function AgentChip({ agentId, agents, isOwner }) {
  const a = agents.find(ag => ag.id === agentId);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, padding: '3px 10px',
      borderRadius: 6, background: isOwner ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isOwner ? 'rgba(0,240,255,0.3)' : 'var(--border)'}`,
      color: isOwner ? 'var(--cyan)' : 'var(--muted)',
      fontFamily: 'JetBrains Mono, monospace', fontWeight: 700
    }}>
      <span style={{ fontSize: 14 }}>{a?.emoji || '🤖'}</span>
      <span>{(a?.name || agentId).toUpperCase()}</span>
      {isOwner && <span style={{ color: 'var(--amber)', marginLeft: 2 }}>◈</span>}
    </span>
  );
}

function HealthDot({ health }) {
  return <span title={`Health: ${health}`} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: HEALTH_COLOR[health], flexShrink: 0, boxShadow: `0 0 6px ${HEALTH_COLOR[health]}` }} />;
}

function DeadlineBadge({ iso }) {
  const d = dueLabel(iso, false);
  if (!d) return null;
  return <span style={{ fontSize: 10, color: d.color, fontWeight: 600 }}>⏱ {d.label}</span>;
}

function GanttChart({ project: p }) {
  const milestones = p.milestones || [];
  if (!milestones.length) return <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>SIGNAL_LOSS // NO MILESTONES DEFINED</div>;
  const start = new Date(p.created_at || Date.now());
  const end = new Date(p.target_completion || Date.now() + 30 * 86400000);
  const total = Math.max(1, end - start);
  const nowPct = Math.max(0, Math.min(100, ((Date.now() - start) / total) * 100));
  const STATUS_C = { complete: 'var(--green)', 'in-progress': 'var(--cyan)', pending: 'rgba(255,255,255,0.05)', blocked: 'var(--red)' };

  return (
    <div style={{ position: 'relative', paddingTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
        <span>[ T_START: {start.toLocaleDateString().toUpperCase()} ]</span>
        <span style={{ color: 'var(--amber)', textShadow: '0 0 8px var(--amber)' }}>[ MISSION_DAY_NOW ]</span>
        <span>[ T_END: {end.toLocaleDateString().toUpperCase()} ]</span>
      </div>
      <div style={{ position: 'relative', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '16px 0', border: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', left: `${nowPct}%`, top: 0, bottom: 0, width: 1, background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)', zIndex: 2, opacity: 0.8 }} />
        {milestones.map(ms => {
          const msDue = ms.due ? new Date(ms.due) : end;
          const widthPct = Math.max(4, Math.min(100, ((msDue - start) / total) * 100));
          const isComplete = ms.status === 'complete';

          return (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '0 16px' }}>
              <div style={{
                fontSize: 10, color: isComplete ? 'var(--muted)' : 'var(--text)', width: 160, flexShrink: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace'
              }} title={ms.title.toUpperCase()}>
                {ms.title.toUpperCase()}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
                <div style={{
                  position: 'absolute', left: 0, width: `${widthPct}%`, height: '100%', borderRadius: 3,
                  background: STATUS_C[ms.status] || 'rgba(255,255,255,0.05)',
                  boxShadow: !isComplete && ms.status !== 'pending' ? `0 0 12px ${STATUS_C[ms.status]}44` : 'none',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', width: 60, flexShrink: 0, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
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
  if (!total) return <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>INDEX_EMPTY // NO TASKS LINKED</div>;
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
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }} orientation="right" />
        <Tooltip
          contentStyle={{ background: 'rgba(8,8,16,0.9)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          itemStyle={{ padding: '2px 0' }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }} />
        <Line type="monotone" dataKey="ideal" stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" dot={false} name="IDEAL_TRAJECTORY" strokeWidth={1} />
        <Line type="monotone" dataKey="actual" stroke="var(--cyan)" strokeWidth={3} dot={{ r: 2, fill: 'var(--cyan)' }} name="REAL_VELOCITY" />
        <ReferenceLine x={todayDay} stroke="var(--amber)" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: 'var(--amber)', fontSize: 8, fontWeight: 900 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BudgetChart({ project: p }) {
  const alloc = p.budget?.allocated_usd || 0;
  const spent = p.budget?.spent_usd || 0;
  const remaining = Math.max(0, alloc - spent);
  const pct = alloc ? Math.round((spent / alloc) * 100) : 0;
  const data = [{ name: 'BUDGET_INDEX', Spent: spent, Remaining: remaining }];
  const color = pct > 90 ? 'var(--red)' : pct > 75 ? 'var(--amber)' : 'var(--cyan)';

  return (
    <div className="card shadow-glow" style={{ background: 'rgba(0,0,0,0.2)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-end' }}>
        <div>
          <div className="section-title" style={{ fontSize: 9, marginBottom: 4 }}>RESOURCE_EXPENDITURE</div>
          <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'Rajdhani, sans-serif' }}>
            ${spent.toFixed(2)} <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>/ ${alloc.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 800, marginBottom: 2 }}>UTILIZATION</div>
          <div style={{ fontSize: 14, fontWeight: 900, color, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={24}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, alloc || 1]} />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="Spent" stackId="a" fill={color} radius={[4, 0, 0, 4]} boxShadow={`0 0 10px ${color}33`} />
          <Bar dataKey="Remaining" stackId="a" fill="rgba(255,255,255,0.03)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {pct > 80 && (
        <div style={{
          marginTop: 12, padding: '4px 8px', background: 'rgba(255,23,68,0.1)',
          border: '1px solid var(--red)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center'
        }}>
          <span style={{ fontSize: 12 }}>🚨</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--red)', letterSpacing: '0.05em' }}>CRITICAL_THRESHOLD_BREACHED // REDUCE_CYCLES</span>
        </div>
      )}
    </div>
  );
}

function AgentWorkload({ project: p, tasks, agents }) {
  const projTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
  const data = (p.team || []).map(aid => {
    const a = agents.find(ag => ag.id === aid) || {};
    const ts = projTasks.filter(t => t.assigned_to === aid);
    return {
      name: (a.name || aid).toUpperCase(),
      Open: ts.filter(t => !['complete', 'failed'].includes(t.status)).length,
      Done: ts.filter(t => t.status === 'complete').length,
      Blocked: ts.filter(t => ['blocked', 'needs_human_decision'].includes(t.status)).length
    };
  }).filter(d => d.Open + d.Done + d.Blocked > 0);

  if (!data.length) return <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>NO_TEAM_METRICS</div>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }} width={100} />
        <Tooltip contentStyle={{ background: 'rgba(8,8,16,0.9)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
        <Bar dataKey="Done" fill="var(--green)" stackId="a" barSize={12} />
        <Bar dataKey="Open" fill="var(--cyan)" stackId="a" />
        <Bar dataKey="Blocked" fill="var(--red)" stackId="a" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function OKRLinks({ project: p, okrs }) {
  if (!okrs?.objectives?.length) return <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>OKR_DATABASE_OFFLINE</div>;
  const linked = okrs.objectives.filter(obj =>
    (p.okr_ids || []).includes(obj.id) ||
    (p.tags || []).some(t => obj.objective.toLowerCase().includes(t.toLowerCase()))
  );
  if (!linked.length) return <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center' }}>NO_OKR_LINKAGE_DETECTED</div>;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {linked.map(obj => (
        <div key={obj.id} className="card shadow-glow" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--amber)', marginBottom: 10, letterSpacing: '0.05em' }}>🎯 {obj.objective.toUpperCase()}</div>
          {(obj.key_results || []).map(kr => {
            const pct = kr.target ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
            const c = pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--cyan)' : 'var(--amber)';
            return (
              <div key={kr.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  <span style={{ color: 'var(--muted)' }}>{kr.result.toUpperCase()}</span>
                  <span style={{ color: c }}>{kr.current} / {kr.target} {kr.unit.toUpperCase()}</span>
                </div>
                <div className="progress-track" style={{ height: 4, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: c, height: 4, boxShadow: `0 0 6px ${c}44` }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MilestoneRow({ ms, agents }) {
  const due = dueLabel(ms.due, ms.status === 'complete');
  const agent = agents.find(a => a.id === ms.assigned_to);
  const icon = { complete: '◈', 'in-progress': '◎', pending: '○', blocked: '⊠' }[ms.status] || '○';
  const color = STATUS_COLOR[ms.status] || 'var(--muted)';
  const isComplete = ms.status === 'complete';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      opacity: isComplete ? 0.6 : 1, transition: 'all 0.2s'
    }} className="task-row-hover">
      <span style={{ fontSize: 12, flexShrink: 0, color, textShadow: isComplete ? 'none' : `0 0 8px ${color}` }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: isComplete ? 'var(--muted)' : 'var(--text)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>{ms.title.toUpperCase()}</div>
        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {agent && <span>[ OP: {agent.name.toUpperCase()} ]</span>}
          {(ms.task_ids || []).length > 0 && <span>[ {ms.task_ids.length} CYCLES ]</span>}
          {ms.auto_complete && <span style={{ color: 'var(--cyan)' }}>[ FLASH_SYNC ]</span>}
        </div>
      </div>
      {due && <span style={{ fontSize: 9, color: due.color, flexShrink: 0, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>{due.label.toUpperCase()}</span>}
      <Badge label={ms.status} color={color} size={8} />
    </div>
  );
}

function RiskRow({ risk: r, agents }) {
  const color = RISK_COLOR[r.severity] || 'var(--muted)';
  const agent = agents.find(a => a.id === r.detected_by);
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 10, borderRadius: 8,
      background: `${color}08`, border: `1px solid ${color}33`,
      boxShadow: `0 0 15px ${color}05`
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{RISK_ICON[r.type] || '⚠️'}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11, color: 'var(--text)', fontWeight: 700, marginBottom: 4,
          fontFamily: 'JetBrains Mono, monospace'
        }}>{r.description.toUpperCase()}</div>
        <div style={{ fontSize: 9, color: 'var(--muted)', display: 'flex', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {agent && <span>[ SENTINEL: {agent.name.toUpperCase()} ]</span>}
          <span>[ T_DETECTION: {relTime(r.detected_at).toUpperCase()} ]</span>
        </div>
      </div>
      <Badge label={r.severity} color={color} size={8} />
    </div>
  );
}

function ActivityItem({ item, agents }) {
  const agent = agents.find(a => a.id === item.agent);
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="task-row-hover">
      <span style={{ fontSize: 12, flexShrink: 0, opacity: 0.6 }}>{ACT_ICON[item.type] || '•'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600
        }}>
          {item.text.toUpperCase()}
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
          {agent && <span>[ {agent.name.toUpperCase()} ]</span>}
          <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 6px' }}>//</span>
          <span>{relTime(item.ts).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

function SessionTrace({ sessions, agents }) {
  if (!sessions?.length) return <div style={{ fontSize: 11, color: 'var(--muted)' }}>No sessions recorded yet.</div>;
  return (
    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Task', 'Agent', 'Proc ID', 'Status', 'Completed'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{h}</th>)}</tr></thead>
      <tbody>
        {sessions.map((s, i) => {
          const agent = agents.find(a => a.id === s.assigned_to);
          const st = (s.status || '').toLowerCase().replace(/ /g, '-');
          const cls = { complete: 'badge-complete', failed: 'badge-failed', 'in-progress': 'badge-in-progress' }[st] || 'badge-pending';
          return <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.03)' }}><td style={{ padding: '5px 8px', color: 'var(--cyan)', fontFamily: 'monospace', fontSize: 10 }}>{s.task_id}</td><td style={{ padding: '5px 8px' }}>{agent ? `${agent.emoji} ${agent.name}` : s.assigned_to}</td><td style={{ padding: '5px 8px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 10 }}>{s.proc_id || '—'}</td><td style={{ padding: '5px 8px' }}><span className={`badge ${cls}`}>{s.status}</span></td><td style={{ padding: '5px 8px', color: 'var(--muted)' }}>{s.completed_at ? relTime(s.completed_at) : '—'}</td></tr>;
        })}
      </tbody>
    </table>
  );
}

function ProjectTaskBoard({ tasks, projectTaskIds, agents }) {
  const [expanded, setExpanded] = useState(null);
  const projTasks = tasks.filter(t => projectTaskIds.includes(t.id));
  const cols = [
    { key: 'pending', label: 'Pending', color: 'var(--muted)' },
    { key: 'in-progress', label: 'In Progress', color: 'var(--cyan)' },
    { key: 'needs_human_decision', label: '🚨 HITL', color: 'var(--purple)' },
    { key: 'blocked', label: 'Blocked', color: 'var(--red)' },
    { key: 'complete', label: 'Complete', color: 'var(--green)' },
    { key: 'failed', label: 'Failed', color: 'var(--red)' },
  ];
  if (!projTasks.length) return <div style={{ fontSize: 11, color: 'var(--muted)' }}>No tasks linked yet.</div>;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {cols.map(col => {
        const colTasks = projTasks.filter(t => t.status === col.key);
        if (!colTasks.length) return null;
        return (
          <div key={col.key}>
            <div style={{ fontSize: 10, fontWeight: 600, color: col.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{col.label} ({colTasks.length})</div>
            {colTasks.map(t => {
              const isExp = expanded === t.id;
              const agent = agents.find(a => a.id === t.assigned_to);
              const pri = (t.sla?.priority || t.priority || '').toUpperCase();
              return (
                <div key={t.id} onClick={() => setExpanded(isExp ? null : t.id)} style={{ marginBottom: 6, padding: '8px 10px', background: 'var(--surface)', border: `1px solid ${isExp ? 'rgba(0,229,255,.3)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', minWidth: 50 }}>{t.id}</span>
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    {pri && <span className={pri === 'P1' ? 'p1' : pri === 'P2' ? 'p2' : 'p3'}>{pri}</span>}
                    {agent && <span style={{ fontSize: 11 }}>{agent.emoji}</span>}
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{isExp ? '▲' : '▼'}</span>
                  </div>
                  {isExp && (
                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                      {t.hitl_reason && <div style={{ padding: '6px 10px', background: 'rgba(224,64,251,.08)', border: '1px solid rgba(224,64,251,.25)', borderRadius: 5, fontSize: 11, color: 'var(--purple)' }}>🚨 {t.hitl_reason}</div>}
                      {t.description && <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{t.description}</div>}
                      {t.output && <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5, padding: '6px 10px', background: 'rgba(0,230,118,.04)', border: '1px solid rgba(0,230,118,.15)', borderRadius: 5 }}>✅ {t.output}</div>}
                      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--muted)', flexWrap: 'wrap' }}>
                        {t.proc_id && <span>Proc: <span style={{ color: 'var(--cyan)' }}>{t.proc_id}</span></span>}
                        {t.completed_at && <span>Done: {new Date(t.completed_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ project: p, agents, selected, onClick }) {
  const tc = p._task_counts || {}, mc = p._milestone_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const borderColor = selected ? 'var(--cyan)' : risks.length ? 'var(--red)' : 'var(--border)';

  return (
    <div onClick={onClick} className="card shadow-glow" style={{
      cursor: 'pointer', transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
      borderColor, background: selected ? 'rgba(0,240,255,0.03)' : 'rgba(255,255,255,0.01)',
      padding: 0, overflow: 'hidden'
    }}>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <ProgressRing pct={pct} size={64} color={pct === 100 ? 'var(--green)' : risks.length ? 'var(--red)' : 'var(--cyan)'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <HealthDot health={health} />
              <span style={{ fontWeight: 900, fontSize: 14, color: selected ? 'var(--cyan)' : 'var(--text)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em' }}>{p.name.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{p.id} // STAT:{p.status.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16, height: 36, overflow: 'hidden' }}>{p.description}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {[
            ['CYCLES', `${tc.done || 0}/${tc.total || 0}`, 'var(--cyan)'],
            ['PHASES', `${mc.done || 0}/${mc.total || 0}`, 'var(--green)'],
            ['SIG_Q', p._quality_score ? `◈${p._quality_score}` : '--', 'var(--amber)'],
            ['VEL', p._velocity ?? '--', 'var(--muted)']
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 800, marginBottom: 4, letterSpacing: '0.05em' }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <AgentChip agentId={p.owner} agents={agents} isOwner />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <DeadlineBadge iso={p.target_completion} />
          </div>
        </div>
      </div>

      {risks.length > 0 && (
        <div style={{
          padding: '8px 16px', background: 'rgba(255,23,68,0.08)', borderTop: '1px solid rgba(255,23,68,0.2)',
          fontSize: 9, color: 'var(--red)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace'
        }}>
          🚨 CRITICAL_ALERT: {risks.length} ACTIVE_RISKS_DETECTED
        </div>
      )}
    </div>
  );
}

const SECTIONS = ['Overview', 'Milestones', 'Gantt', 'Tasks', 'Burndown', 'Risks', 'Team', 'Workload', 'Budget', 'OKRs', 'Activity', 'Sessions', 'Decisions'];

function ProjectDetail({ project: p, agents, tasks, okrs, onClose, onReplan, onExecute, onSaveBudget, onSaveOkr, lastUpdated }) {
  const [section, setSection] = useState('Overview');
  const [budgetDraft, setBudgetDraft] = useState({
    allocated_usd: p.budget?.allocated_usd ?? 0,
    spent_usd: p.budget?.spent_usd ?? 0,
    forecast_usd: p.budget?.forecast_usd ?? 0,
    alert_threshold: p.budget?.alert_threshold ?? 0.8,
  });
  const [okrDraft, setOkrDraft] = useState({
    objective_id: p.okr_refs?.objective_id || '',
    kr_ids: (p.okr_refs?.kr_ids || []).join(','),
  });
  const tc = p._task_counts || {}, mc = p._milestone_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const color = pct === 100 ? 'var(--green)' : risks.length ? 'var(--red)' : 'var(--cyan)';

  return (
    <div className="card shadow-glow" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${color}44`, marginBottom: 24, background: 'rgba(8,8,16,0.6)' }}>
      {/* Header Command Area */}
      <div style={{ padding: '24px 30px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 24 }}>
        <ProgressRing pct={pct} size={100} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <HealthDot health={health} />
            <span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', color: 'var(--text)' }}>{p.name.toUpperCase()}</span>
            <Badge label={p.status} color={STATUS_COLOR[p.status] || 'var(--muted)'} />
            {p.priority_weight && <Badge label={`PRIORITY_${p.priority_weight}`} color="var(--amber)" />}
            <Badge label={`${health.toUpperCase()}_HEALTH`} color={HEALTH_COLOR[health]} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12, maxWidth: 800 }}>{p.description}</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <AgentChip agentId={p.owner} agents={agents} isOwner />
            {p.target_completion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--muted)' }}>
                <span style={{ color: 'var(--cyan)' }}>T_DEADLINE:</span>
                <DeadlineBadge iso={p.target_completion} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {(p.tags || []).map(t => <Badge key={t} label={t} color="var(--cyan)" size={8} />)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary" onClick={() => onExecute?.(p.id)} style={{ padding: '8px 16px', fontSize: 10 }}>EXECUTE_NOW</button>
          <button className="btn-primary" onClick={() => onReplan?.(p.id)} style={{ padding: '8px 16px', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>REPLAN</button>
          <button className="btn-primary" onClick={() => exportMarkdown(p, agents)} style={{ padding: '8px 16px', fontSize: 10 }}>DOWNLOAD_INTEL</button>
          <button className="btn-primary" onClick={onClose} style={{ padding: '8px 16px', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>CLOSE_MATRIX</button>
          <LastUpdated ts={lastUpdated} />
        </div>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        {[
          ['CYCLES_SYNC', `${tc.done || 0}/${tc.total || 0}`, 'var(--cyan)'],
          ['ACTIVE', tc.active || 0, 'var(--amber)'],
          ['BLOCKED', tc.blocked || 0, tc.blocked ? 'var(--red)' : 'var(--muted)'],
          ['HITL_GATE', tc.hitl || 0, tc.hitl ? 'var(--purple)' : 'var(--muted)'],
          ['PHASES', `${mc.done || 0}/${mc.total || 0}`, 'var(--green)'],
          ['QUAL_INDEX', p._quality_score ? `◈${p._quality_score}` : '--', 'var(--amber)'],
          ['VELOCITY', p._velocity ?? '--', 'var(--muted)'],
          ['FISCAL_BURN', `$${p.budget?.spent_usd ?? 0}`, 'var(--cyan)']
        ].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center', padding: '16px 8px', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 6, fontWeight: 800, letterSpacing: '0.1em' }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', overflowX: 'auto', padding: '0 20px', gap: 4 }}>
        {SECTIONS.map(s => {
          const badge = s === 'Risks' && risks.length ? risks.length : s === 'Tasks' && tc.total ? tc.total : s === 'Milestones' && mc.total ? mc.total : null;
          const isActive = section === s;
          return (
            <button key={s} onClick={() => setSection(s)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px',
              fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, whiteSpace: 'nowrap',
              color: isActive ? 'var(--cyan)' : 'var(--muted)',
              borderBottom: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
              letterSpacing: '0.1em', transition: 'all 0.2s'
            }}>
              {s.toUpperCase()}{badge ? ` [${badge}]` : ''}
            </button>
          );
        })}
      </div>

      {/* Viewport Content */}
      <div style={{ padding: 30, minHeight: 400 }}>
        {section === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <div>
              <div className="section-title" style={{ fontSize: 9 }}>MISSION_PHASE_PROGRESS</div>
              <div className="progress-track" style={{ height: 6, marginBottom: 16 }}>
                <div className="progress-fill" style={{ width: `${mc.total ? Math.round((mc.done / mc.total) * 100) : 0}%`, background: 'var(--green)', boxShadow: '0 0 8px var(--green)44' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(p.milestones || []).slice(0, 5).map(ms => <MilestoneRow key={ms.id} ms={ms} agents={agents} />)}
              </div>
            </div>
            <div>
              <div className="section-title" style={{ fontSize: 9 }}>REALTIME_TRANSMISSION_FEED</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(p._activity || []).slice(0, 8).map((a, i) => <ActivityItem key={i} item={a} agents={agents} />)}
                {(!p._activity || p._activity.length === 0) && <div style={{ fontSize: 11, color: 'var(--muted)', padding: 20, textAlign: 'center' }}>FEED_SILENT</div>}
              </div>
            </div>
            {risks.length > 0 && <div style={{ gridColumn: '1/-1' }}><div className="section-title" style={{ color: 'var(--red)', fontSize: 9 }}>THREAT_MATRIX</div>{risks.slice(0, 3).map(r => <RiskRow key={r.id} risk={r} agents={agents} />)}</div>}
          </div>
        )}
        {section === 'Milestones' && <div style={{ maxWidth: 800, margin: '0 auto' }}>{(p.milestones || []).map(ms => <MilestoneRow key={ms.id} ms={ms} agents={agents} />)}</div>}
        {section === 'Gantt' && <GanttChart project={p} />}
        {section === 'Tasks' && <ProjectTaskBoard tasks={tasks} projectTaskIds={p.task_ids || []} agents={agents} />}
        {section === 'Burndown' && <BurndownChart project={p} tasks={tasks} />}
        {section === 'Risks' && <div style={{ maxWidth: 800, margin: '0 auto' }}>{risks.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: 'var(--green)', fontWeight: 800 }}>THREAT_LEVEL_ZERO // ALL_SYSTEMS_OPTIMAL</div> : risks.map(r => <RiskRow key={r.id} risk={r} agents={agents} />)}</div>}
        {section === 'Team' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {(p.team || []).map(aid => {
            const agent = agents.find(a => a.id === aid); const isOwner = aid === p.owner;
            return (
              <div key={aid} className="card shadow-glow" style={{ borderColor: isOwner ? 'var(--cyan)' : 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{agent?.emoji || '🤖'}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13, fontFamily: 'Rajdhani, sans-serif' }}>{agent?.name.toUpperCase() || aid}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700 }}>{agent?.role?.toUpperCase() || 'OPERATIVE'}</div>
                  </div>
                  {isOwner && <Badge label="REDACTED" color="var(--amber)" size={7} />}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>CYCLES</div>
                    <div style={{ fontWeight: 900, color: 'var(--cyan)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{agent?.tasks_completed || 0}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>QUALITY</div>
                    <div style={{ fontWeight: 900, color: 'var(--amber)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>◈{(agent?.avg_quality || 0).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
        {section === 'Workload' && <AgentWorkload project={p} tasks={tasks} agents={agents} />}
        {section === 'Budget' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <BudgetChart project={p} />
            <div className="card" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="section-title" style={{ fontSize: 9, marginBottom: 12 }}>BUDGET_CONTROL</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input className="input-base" type="number" placeholder="Allocated USD" value={budgetDraft.allocated_usd} onChange={(e) => setBudgetDraft((x) => ({ ...x, allocated_usd: Number(e.target.value || 0) }))} />
                <input className="input-base" type="number" placeholder="Spent USD" value={budgetDraft.spent_usd} onChange={(e) => setBudgetDraft((x) => ({ ...x, spent_usd: Number(e.target.value || 0) }))} />
                <input className="input-base" type="number" placeholder="Forecast USD" value={budgetDraft.forecast_usd} onChange={(e) => setBudgetDraft((x) => ({ ...x, forecast_usd: Number(e.target.value || 0) }))} />
                <input className="input-base" type="number" step="0.01" placeholder="Alert threshold (0-1)" value={budgetDraft.alert_threshold} onChange={(e) => setBudgetDraft((x) => ({ ...x, alert_threshold: Number(e.target.value || 0.8) }))} />
                <button className="btn-primary" onClick={() => onSaveBudget?.(p.id, budgetDraft)}>SAVE_BUDGET</button>
              </div>
            </div>
          </div>
        )}
        {section === 'OKRs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <OKRLinks project={p} okrs={okrs} />
            <div className="card" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="section-title" style={{ fontSize: 9, marginBottom: 12 }}>OKR_LINK_CONTROL</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input className="input-base" placeholder="Objective ID" value={okrDraft.objective_id} onChange={(e) => setOkrDraft((x) => ({ ...x, objective_id: e.target.value }))} />
                <input className="input-base" placeholder="KR IDs (comma-separated)" value={okrDraft.kr_ids} onChange={(e) => setOkrDraft((x) => ({ ...x, kr_ids: e.target.value }))} />
                <button className="btn-primary" onClick={() => onSaveOkr?.(p.id, {
                  objective_id: okrDraft.objective_id || null,
                  kr_ids: okrDraft.kr_ids.split(',').map(s => s.trim()).filter(Boolean),
                })}>SAVE_OKR_LINKS</button>
              </div>
            </div>
          </div>
        )}
        {section === 'Activity' && <div style={{ maxWidth: 800, margin: '0 auto' }}>{(p._activity || []).map((a, i) => <ActivityItem key={i} item={a} agents={agents} />)}</div>}
        {section === 'Sessions' && <SessionTrace sessions={p._sessions} agents={agents} />}
        {section === 'Decisions' && <div style={{ display: 'grid', gap: 16 }}>
          {(p.decisions || []).map(d => {
            const agent = agents.find(a => a.id === d.decided_by);
            return (
              <div key={d.id} className="card shadow-glow" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />
                  <span style={{ flex: 1, fontWeight: 900, fontSize: 14, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>{d.decision.toUpperCase()}</span>
                  <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{relTime(d.decided_at).toUpperCase()}</span>
                </div>
                {d.rationale && <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: 8, borderLeft: '2px solid var(--purple)', marginBottom: 12 }}>{d.rationale}</div>}
                <div style={{ display: 'flex', gap: 20 }}>
                  <AgentChip agentId={d.decided_by} agents={agents} />
                  {d.task_id && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>ASSOCIATED_CYCLE: <span style={{ color: 'var(--cyan)' }}>{d.task_id}</span></span>}
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters, sortBy, setSortBy }) {
  return (
    <div className="card shadow-glow" style={{
      display: 'flex', gap: 12, padding: '14px 20px', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap',
      background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)'
    }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 12 }}>🔍</span>
        <input
          placeholder="SEARCH_PROJECT_NEXUS..."
          className="search-input"
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          style={{ width: '100%', padding: '10px 14px 10px 40px', background: 'rgba(0,0,0,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.05em' }}
        />
      </div>

      <select
        className="btn-secondary"
        value={filters.status}
        onChange={e => setFilters({ ...filters, status: e.target.value })}
        style={{ padding: '8px 14px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
      >
        <option value="all">ALL_STATUS</option>
        {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
      </select>

      <select
        className="btn-secondary"
        value={filters.health}
        onChange={e => setFilters({ ...filters, health: e.target.value })}
        style={{ padding: '8px 14px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
      >
        <option value="all">ALL_HEALTH</option>
        <option value="healthy">HEALTHY_ONLY</option>
        <option value="at-risk">AT_RISK_ONLY</option>
        <option value="critical">CRITICAL_ONLY</option>
      </select>

      <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

      <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>SORT_BY:</div>
      <select
        className="btn-secondary"
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        style={{ padding: '8px 14px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
      >
        <option value="name">IDENTIFIER</option>
        <option value="progress">PROGRESS_INDEX</option>
        <option value="deadline">DEADLINE_T</option>
        <option value="health">HEALTH_SCORE</option>
        <option value="priority">PRIORITY_WT</option>
      </select>
    </div>
  );
}

export default function Projects({ data, lastUpdated, toast }) {
  const { agents = [], tasks = [], okrs = {} } = data || {};
  const [projectsData, setProjectsData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', search: '', health: 'all' });
  const [sortBy, setSortBy] = useState('priority');
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [lastDecision, setLastDecision] = useState(null);
  const [intake, setIntake] = useState({
    title: '',
    intent: '',
    description: '',
    priority: 'P2',
    tags: '',
    project_hint: '',
    deadline: '',
    budget_usd: '',
  });

  const refreshProjects = useCallback(async () => {
    try {
      const out = await listProjects();
      setProjectsData(out.projects || []);
    } catch {
      setProjectsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleIntakeSubmit = async () => {
    if (!intake.intent.trim() && !intake.title.trim()) return;
    setSubmittingIntake(true);
    try {
      const out = await submitIntakeTask({
        title: intake.title || intake.intent,
        intent: intake.intent || intake.title,
        description: intake.description,
        priority: intake.priority,
        tags: intake.tags.split(',').map(t => t.trim()).filter(Boolean),
        project_hint: intake.project_hint || undefined,
        constraints: {
          deadline: intake.deadline || undefined,
          budget_usd: intake.budget_usd ? Number(intake.budget_usd) : undefined,
        },
      });
      setLastDecision(out);
      await refreshProjects();
      setIntake({
        title: '',
        intent: '',
        description: '',
        priority: 'P2',
        tags: '',
        project_hint: '',
        deadline: '',
        budget_usd: '',
      });
      toast?.(`Routed to ${out.decision === 'create_new' ? 'new' : 'existing'} project: ${out.projectId}`, 'success');
    } catch (e) {
      toast?.(e.message || 'intake_failed', 'error');
    } finally {
      setSubmittingIntake(false);
    }
  };

  const handleReplan = async (projectId) => {
    try {
      await planProject(projectId);
      await refreshProjects();
      toast?.('Project plan updated', 'success');
    } catch (e) {
      toast?.(e.message || 'project_replan_failed', 'error');
    }
  };

  const handleExecute = async (projectId) => {
    try {
      await executeProject(projectId);
      await refreshProjects();
      toast?.('Execution launched', 'success');
    } catch (e) {
      toast?.(e.message || 'project_execute_failed', 'error');
    }
  };

  const handleBudgetQuickSave = async (projectId, budget) => {
    try {
      await updateProjectBudget(projectId, budget);
      await refreshProjects();
      toast?.('Budget updated', 'success');
    } catch (e) {
      toast?.(e.message || 'budget_update_failed', 'error');
    }
  };

  const handleOkrQuickSave = async (projectId, okrRefs) => {
    try {
      await updateProjectOkrLink(projectId, okrRefs);
      await refreshProjects();
      toast?.('OKR links updated', 'success');
    } catch (e) {
      toast?.(e.message || 'okr_update_failed', 'error');
    }
  };

  const enriched = useMemo(() => projectsData.map(p => {
    const pTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
    const done = pTasks.filter(t => t.status === 'complete').length;
    const total = pTasks.length;
    const milestones = p.milestones || [];
    const msDone = milestones.filter(m => m.status === 'complete').length;

    return {
      ...p,
      _task_counts: {
        total,
        done,
        active: pTasks.filter(t => t.status === 'in-progress').length,
        blocked: pTasks.filter(t => t.status === 'blocked').length,
        hitl: pTasks.filter(t => t.status === 'needs_human_decision').length
      },
      _milestone_counts: {
        total: milestones.length,
        done: msDone
      },
      _progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
      _risks: p._risks || [],
      _activity: p._activity || []
    };
  }), [projectsData, tasks]);

  const filtered = useMemo(() => enriched.filter(p => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.health !== 'all' && healthScore(p) !== filters.health) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) && !p.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'progress') return (b._progress_pct || 0) - (a._progress_pct || 0);
    if (sortBy === 'deadline') return new Date(a.target_completion || '9999') - new Date(b.target_completion || '9999');
    if (sortBy === 'health') {
      const hMap = { healthy: 0, 'at-risk': 1, critical: 2 };
      return hMap[healthScore(b)] - hMap[healthScore(a)];
    }
    if (sortBy === 'priority') return (b.priority_weight || 0) - (a.priority_weight || 0);
    return 0;
  }), [enriched, filters, sortBy]);

  const selected = enriched.find(p => p.id === selectedId);

  if (isLoading) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
      <div style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em' }}>SYNCHRONIZING_STRATEGIC_DATABASE...</div>
    </div>
  );

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>STRATEGIC_COMMAND</h1>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>PROJECT_NEXUS_v4.2 // TOTAL_NODES: {enriched.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="stat-v" style={{ textAlign: 'right' }}>
            <div className="stat-l">AVG_HEALTH</div>
            <div className="stat-n" style={{ color: 'var(--green)' }}>OPTIMAL</div>
          </div>
          <div className="stat-v" style={{ textAlign: 'right' }}>
            <div className="stat-l">ACTIVE_PHASES</div>
            <div className="stat-n">{enriched.filter(p => p.status === 'active').length}</div>
          </div>
        </div>
      </div>

      <div className="card shadow-glow" style={{ marginBottom: 24, padding: 18, borderColor: 'rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.03)' }}>
        <div style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 10 }}>
          AUTONOMOUS_TASK_INTAKE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 1fr', gap: 10 }}>
          <input className="input-base" placeholder="Task title" value={intake.title} onChange={(e) => setIntake((p) => ({ ...p, title: e.target.value }))} />
          <input className="input-base" placeholder="Intent (required)" value={intake.intent} onChange={(e) => setIntake((p) => ({ ...p, intent: e.target.value }))} />
          <select className="input-base" value={intake.priority} onChange={(e) => setIntake((p) => ({ ...p, priority: e.target.value }))}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <input className="input-base" placeholder="Project hint (optional)" value={intake.project_hint} onChange={(e) => setIntake((p) => ({ ...p, project_hint: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr 1fr auto', gap: 10, marginTop: 10 }}>
          <input className="input-base" placeholder="Description" value={intake.description} onChange={(e) => setIntake((p) => ({ ...p, description: e.target.value }))} />
          <input className="input-base" placeholder="Tags (comma-separated)" value={intake.tags} onChange={(e) => setIntake((p) => ({ ...p, tags: e.target.value }))} />
          <input className="input-base" type="date" value={intake.deadline} onChange={(e) => setIntake((p) => ({ ...p, deadline: e.target.value }))} />
          <input className="input-base" type="number" placeholder="Budget USD" value={intake.budget_usd} onChange={(e) => setIntake((p) => ({ ...p, budget_usd: e.target.value }))} />
          <button className="btn-primary" onClick={handleIntakeSubmit} disabled={submittingIntake || (!intake.intent.trim() && !intake.title.trim())}>
            {submittingIntake ? 'ROUTING...' : 'SUBMIT'}
          </button>
        </div>
        {lastDecision && (
          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            DECISION: <span style={{ color: 'var(--cyan)' }}>{lastDecision.decision}</span> · PROJECT: <span style={{ color: 'var(--green)' }}>{lastDecision.projectId}</span> · JOB: <span style={{ color: 'var(--amber)' }}>{lastDecision.jobId}</span>
          </div>
        )}
      </div>

      <FilterBar filters={filters} setFilters={setFilters} sortBy={sortBy} setSortBy={setSortBy} />

      {selected && (
        <ProjectDetail
          project={selected}
          agents={agents}
          tasks={tasks}
          okrs={okrs}
          lastUpdated={lastUpdated}
          onReplan={handleReplan}
          onExecute={handleExecute}
          onSaveBudget={handleBudgetQuickSave}
          onSaveOkr={handleOkrQuickSave}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 20,
        opacity: selected ? 0.3 : 1,
        transition: 'opacity 0.3s',
        pointerEvents: selected ? 'none' : 'auto'
      }}>
        {filtered.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            agents={agents}
            selected={selectedId === p.id}
            onClick={() => setSelectedId(p.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: 100, textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🛰️</div>
            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>SIGNAL_VOID // NO_MATCHING_PROJECTS_FOUND</div>
          </div>
        )}
      </div>
    </div>
  );
}
