import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import {
  listProjects,
  submitIntakeTask,
  planProject,
  executeProject,
  updateProjectBudget,
  updateProjectOkrLink,
} from '../../lib/api';
import { Plus, X, Play, RefreshCw, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

/* ─── Design Tokens ─────────────────────────────────────────────── */
const STATUS_CFG = {
  active: { bg: '#EEF2FF', color: 'var(--accent)', label: 'Active' },
  complete: { bg: '#ECFDF5', color: 'var(--mint)', label: 'Complete' },
  paused: { bg: '#FFFBEB', color: 'var(--amber)', label: 'Paused' },
  archived: { bg: '#F8FAFC', color: 'var(--muted)', label: 'Archived' },
  pending: { bg: '#F8FAFC', color: 'var(--muted)', label: 'Pending' },
};
const HEALTH_CFG = {
  green: { bg: '#ECFDF5', color: 'var(--mint)', label: 'On Track' },
  amber: { bg: '#FFFBEB', color: 'var(--amber)', label: 'At Risk' },
  red: { bg: '#FEF2F2', color: 'var(--red)', label: 'Critical' },
};

/* ─── Helpers ──────────────────────────────────────────────────── */
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

function dueDiff(iso) {
  if (!iso) return null;
  try {
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'var(--red)' };
    if (diff === 0) return { label: 'Due today', color: 'var(--amber)' };
    if (diff <= 3) return { label: `${diff}d left`, color: 'var(--amber)' };
    return { label: `${diff}d left`, color: 'var(--muted)' };
  } catch { return null; }
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

/* ─── Atoms ─────────────────────────────────────────────────────── */
function ProgressRing({ pct, size = 56, color = 'var(--accent)' }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, dash = circ * (pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.2, fontWeight: 800, color,
      }}>{pct}%</div>
    </div>
  );
}

function AgentChip({ agentId, agents, isOwner }) {
  const a = agents.find(ag => ag.id === agentId);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11,
      padding: '3px 10px', borderRadius: 999,
      background: isOwner ? '#EEF2FF' : '#F8FAFC',
      color: isOwner ? 'var(--accent)' : 'var(--muted)',
      border: `1px solid ${isOwner ? '#E0E7FF' : 'var(--border)'}`,
      fontWeight: 600,
    }}>
      <span style={{ fontSize: 14 }}>{a?.emoji || '🤖'}</span>
      <span>{a?.name || agentId}</span>
      {isOwner && <span style={{ opacity: 0.6 }}>· Owner</span>}
    </span>
  );
}

function HealthBadge({ health }) {
  const cfg = HEALTH_CFG[health];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

/* ─── Gantt (light) ─────────────────────────────────────────────── */
function GanttChart({ project: p }) {
  const milestones = p.milestones || [];
  if (!milestones.length) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13, background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
      No milestones defined
    </div>
  );
  const start = new Date(p.created_at || Date.now());
  const end = new Date(p.target_completion || Date.now() + 30 * 86400000);
  const total = Math.max(1, end - start);
  const nowPct = Math.max(0, Math.min(100, ((Date.now() - start) / total) * 100));
  const STATUS_C = { complete: 'var(--mint)', 'in-progress': 'var(--accent)', pending: '#E2E8F0', blocked: 'var(--red)' };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
        <span>{start.toLocaleDateString()}</span>
        <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Today</span>
        <span>{end.toLocaleDateString()}</span>
      </div>
      <div style={{ position: 'relative', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 0', overflow: 'hidden' }}>
        {/* Today marker */}
        <div style={{ position: 'absolute', left: `${nowPct}%`, top: 0, bottom: 0, width: 2, background: 'var(--amber)', opacity: 0.7 }} />
        {milestones.map(ms => {
          const msDue = ms.due ? new Date(ms.due) : end;
          const widthPct = Math.max(4, Math.min(100, ((msDue - start) / total) * 100));
          const isComplete = ms.status === 'complete';
          return (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '0 16px' }}>
              <div style={{ fontSize: 12, color: isComplete ? 'var(--muted)' : 'var(--text)', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, textDecoration: isComplete ? 'line-through' : 'none' }}>
                {ms.title}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 10, background: '#E2E8F0', borderRadius: 999 }}>
                <div style={{
                  position: 'absolute', left: 0, width: `${widthPct}%`, height: '100%',
                  background: STATUS_C[ms.status] || '#E2E8F0', borderRadius: 999,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', width: 60, flexShrink: 0, textAlign: 'right' }}>
                {ms.due ? new Date(ms.due).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Burndown (light) ──────────────────────────────────────────── */
function BurndownChart({ project: p, tasks }) {
  const projTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
  const total = projTasks.length;
  if (!total) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No tasks to plot</div>;
  const start = new Date(p.created_at || Date.now());
  const end = new Date(p.target_completion || Date.now() + 7 * 86400000);
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  const completions = projTasks.filter(t => t.completed_at).map(t => Math.max(0, Math.ceil((new Date(t.completed_at) - start) / 86400000))).sort((a, b) => a - b);
  const todayDay = Math.ceil((Date.now() - start) / 86400000);
  const data = Array.from({ length: days + 1 }, (_, i) => ({
    day: i, ideal: Math.round(total - (total / days) * i),
    actual: i <= todayDay ? total - completions.filter(c => c <= i).length : undefined,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} orientation="right" />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
        <Legend verticalAlign="top" height={32} iconType="rect" wrapperStyle={{ fontSize: 11 }} />
        <Line type="stepAfter" dataKey="ideal" stroke="#CBD5E1" strokeDasharray="4 4" dot={false} name="Ideal" />
        <Line type="stepAfter" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} name="Actual" />
        <ReferenceLine x={todayDay} stroke="var(--amber)" strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Project Card (light) ──────────────────────────────────────── */
function ProjectCard({ project: p, agents, selected, onClick }) {
  const tc = p._task_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const statusCfg = STATUS_CFG[p.status] || STATUS_CFG.pending;
  const ringColor = pct === 100 ? 'var(--mint)' : risks.length ? 'var(--red)' : 'var(--accent)';
  const due = dueDiff(p.target_completion);

  return (
    <div onClick={onClick} className="card fade-in" style={{
      cursor: 'pointer', padding: '20px',
      borderColor: selected ? 'var(--accent)' : risks.length > 0 ? '#FEE2E2' : 'var(--border)',
      borderWidth: selected ? 2 : 1,
      background: selected ? '#FAFAFF' : '#fff',
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <ProgressRing pct={pct} size={52} color={ringColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <HealthBadge health={health} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{statusCfg.label}</span>
            {due && <span style={{ fontSize: 11, color: due.color, fontWeight: 600 }}>{due.label}</span>}
          </div>
        </div>
        <ChevronRight size={16} color="var(--muted)" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>

      {p.description && (
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.description}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Tasks', v: `${tc.done || 0}/${tc.total || 0}`, c: 'var(--accent)' },
          { l: 'HITL', v: tc.hitl || 0, c: tc.hitl ? 'var(--purple)' : 'var(--muted)' },
          { l: 'Blocked', v: tc.blocked || 0, c: tc.blocked ? 'var(--red)' : 'var(--muted)' },
          { l: 'Spend', v: `$${(p.budget?.spent_usd ?? 0).toFixed(0)}`, c: 'var(--text-dim)' },
        ].map(s => (
          <div key={s.l} style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.l}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AgentChip agentId={p.owner} agents={agents} isOwner />
        {risks.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
            <AlertTriangle size={12} /> {risks.length} risk{risks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Project Detail (light) ────────────────────────────────────── */
const SECTIONS = ['Overview', 'Timeline', 'Tasks', 'Budget', 'OKRs', 'Logs'];

function ProjectDetail({ project: p, agents, tasks, onClose, onReplan, onExecute }) {
  const [section, setSection] = useState('Overview');
  const tc = p._task_counts || {}, pct = p._progress_pct ?? 0;
  const risks = (p._risks || []).filter(r => !r.resolved);
  const health = healthScore(p);
  const ringColor = pct === 100 ? 'var(--mint)' : risks.length ? 'var(--red)' : 'var(--accent)';
  const statusCfg = STATUS_CFG[p.status] || STATUS_CFG.pending;
  const due = dueDiff(p.target_completion);

  return (
    <div className="fade-in" style={{
      background: '#fff', border: '2px solid #E0E7FF', borderRadius: 20,
      marginBottom: 32, overflow: 'hidden', boxShadow: '0 8px 32px rgba(79,70,229,0.08)',
    }}>
      {/* Header */}
      <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg, #FAFAFF 0%, #fff 100%)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <ProgressRing pct={pct} size={80} color={ringColor} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{p.name}</span>
            <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{statusCfg.label}</span>
            <HealthBadge health={health} />
          </div>
          {p.description && <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 12, maxWidth: 600 }}>{p.description}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <AgentChip agentId={p.owner} agents={agents} isOwner />
            {due && <span style={{ fontSize: 12, color: due.color, fontWeight: 600 }}>{due.label}</span>}
            {(p.tags || []).map(t => (
              <span key={t} style={{ background: '#EEF2FF', color: 'var(--accent)', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 140, flexShrink: 0 }}>
          <button className="btn-primary" onClick={() => onExecute?.(p.id)} style={{ padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Play size={13} /> Execute
          </button>
          <button className="btn-secondary" onClick={() => onReplan?.(p.id)} style={{ padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Replan
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <X size={13} /> Close
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid var(--border)', padding: '0 24px', gap: 4 }}>
        {SECTIONS.map(s => {
          const isActive = section === s;
          return (
            <button key={s} onClick={() => setSection(s)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px',
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', minHeight: 360 }}>
        {section === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
            <div>
              <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Timeline</h3>
              <GanttChart project={p} />
              <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Risks</h3>
              {risks.length > 0 ? risks.map(r => (
                <div key={r.id} style={{ padding: '12px 14px', background: '#FFF1F2', border: '1px solid #FEE2E2', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{r.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>{r.severity} · {relTime(r.detected_at)}</div>
                </div>
              )) : (
                <div style={{ padding: '16px', background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--mint)', fontWeight: 500 }}>
                  <CheckCircle2 size={15} /> No active risks
                </div>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(p._activity || []).slice(0, 10).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{relTime(a.ts)}</span>
                    <span style={{ color: 'var(--text-dim)', flex: 1 }}>{a.text}</span>
                  </div>
                ))}
                {(p._activity || []).length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>No activity yet</span>}
              </div>
            </div>
          </div>
        )}

        {section === 'Timeline' && (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: 15 }}>Burndown Chart</h3>
            <BurndownChart project={p} tasks={tasks} />
          </div>
        )}

        {section === 'Tasks' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {['in-progress', 'blocked', 'needs_human_decision', 'complete'].map(status => {
              const statusMap = { 'in-progress': { label: 'In Progress', color: 'var(--accent)', bg: '#EEF2FF' }, blocked: { label: 'Blocked', color: 'var(--red)', bg: '#FEF2F2' }, needs_human_decision: { label: 'HITL', color: 'var(--purple)', bg: '#F5F3FF' }, complete: { label: 'Complete', color: 'var(--mint)', bg: '#ECFDF5' } };
              const cfg = statusMap[status];
              const list = tasks.filter(t => (p.task_ids || []).includes(t.id) && t.status === status);
              return (
                <div key={status}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', marginBottom: 10, padding: '4px 10px', background: cfg.bg, borderRadius: 8, display: 'inline-block' }}>
                    {cfg.label} ({list.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {list.map(t => (
                      <div key={t.id} style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{t.id?.slice(0, 12)}</div>
                      </div>
                    ))}
                    {list.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>None</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {section === 'Budget' && (
          <div>
            {(() => {
              const alloc = p.budget?.allocated_usd || 0;
              const spent = p.budget?.spent_usd || 0;
              const pct2 = alloc ? Math.round((spent / alloc) * 100) : 0;
              const color = pct2 > 90 ? 'var(--red)' : pct2 > 75 ? 'var(--amber)' : 'var(--mint)';
              const bg = pct2 > 90 ? '#FEF2F2' : pct2 > 75 ? '#FFFBEB' : '#F0FDF4';
              return (
                <div style={{ background: bg, border: `1px solid ${color}44`, borderRadius: 16, padding: 28, maxWidth: 520 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Budget Expenditure</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 16 }}>
                    ${spent.toFixed(2)} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 500 }}>/ ${alloc.toFixed(2)}</span>
                  </div>
                  <div className="progress-track" style={{ height: 12 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, pct2)}%`, background: color, height: '100%', borderRadius: 999 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                    <span>{pct2}% utilized</span>
                    {alloc > 0 && <span>${(alloc - spent).toFixed(2)} remaining</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {section === 'OKRs' && (
          <div>
            {(p.okr_links || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 13 }}>No OKR links for this project</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(p.okr_links || []).map((link, i) => (
                  <div key={i} style={{ padding: '16px 18px', background: '#FAFAFF', border: '1px solid #E0E7FF', borderRadius: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{link.objective || link.title || `OKR #${i + 1}`}</div>
                    {link.key_result && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>KR: {link.key_result}</div>}
                    {link.contribution && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Contribution: {link.contribution}</div>}
                  </div>
                ))}
              </div>
            )}
            {(p.decisions || []).length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ marginBottom: 12, fontSize: 15 }}>Decisions</h3>
                {p.decisions.map((d, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{d.decision}</div>
                    {d.rationale && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.rationale}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'Logs' && (
          <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {(p._sessions || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-mono)', background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                <span style={{ color: 'var(--accent)', minWidth: 80 }}>{s.proc_id || '--'}</span>
                <span style={{ flex: 1, color: 'var(--text-dim)' }}>{s.task_id}</span>
                <span style={{ color: s.status === 'failed' ? 'var(--red)' : 'var(--mint)', fontWeight: 600 }}>{s.status}</span>
                <span style={{ color: 'var(--muted)' }}>{relTime(s.completed_at)}</span>
              </div>
            ))}
            {(p._sessions || []).length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No session logs</div>
            )}
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
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [intake, setIntake] = useState({ title: '', intent: '', description: '', priority: 'P2', tags: '', project_hint: '', deadline: '', budget_usd: '' });

  const refreshProjects = useCallback(async () => {
    try {
      const out = await listProjects();
      setProjectsData(out.projects || []);
    } catch { setProjectsData([]); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  const handleIntakeSubmit = async () => {
    if (!intake.intent.trim() && !intake.title.trim()) return;
    setSubmittingIntake(true);
    try {
      const out = await submitIntakeTask({ ...intake, tags: intake.tags.split(',').map(t => t.trim()).filter(Boolean) });
      await refreshProjects();
      setIntake({ title: '', intent: '', description: '', priority: 'P2', tags: '', project_hint: '', deadline: '', budget_usd: '' });
      setShowIntake(false);
      toast?.(`Task routed: ${out.projectId}`, 'success');
    } catch (e) { toast?.(e.message, 'error'); } finally { setSubmittingIntake(false); }
  };

  const handleReplan = async (projectId) => { try { await planProject(projectId); await refreshProjects(); toast?.('Replan initiated', 'success'); } catch (e) { toast?.(e.message, 'error'); } };
  const handleExecute = async (projectId) => { try { await executeProject(projectId); await refreshProjects(); toast?.('Execution started', 'success'); } catch (e) { toast?.(e.message, 'error'); } };

  const enriched = useMemo(() => projectsData.map(p => {
    const pTasks = tasks.filter(t => (p.task_ids || []).includes(t.id));
    const done = pTasks.filter(t => t.status === 'complete').length;
    return {
      ...p,
      _task_counts: { total: pTasks.length, done, active: pTasks.filter(t => t.status === 'in-progress').length, blocked: pTasks.filter(t => t.status === 'blocked').length, hitl: pTasks.filter(t => t.status === 'needs_human_decision').length },
      _progress_pct: pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0,
      _risks: p._risks || [],
      _activity: p._activity || [],
    };
  }), [projectsData, tasks]);

  const filtered = useMemo(() => enriched.filter(p => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.health !== 'all' && healthScore(p) !== filters.health) return false;
    if (filters.search && !(p.name || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.priority_weight || 0) - (a.priority_weight || 0)), [enriched, filters]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <RefreshCw size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ marginLeft: 12, color: 'var(--muted)', fontSize: 13 }}>Loading projects…</span>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{enriched.length} projects · {enriched.filter(p => p.status === 'active').length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={refreshProjects} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowIntake(!showIntake)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[{ label: 'All Health', value: 'all', color: 'var(--text-dim)', bg: '#F8FAFC' }, ...Object.entries(HEALTH_CFG).map(([k, v]) => ({ label: v.label, value: k, color: v.color, bg: v.bg }))].map(c => (
          <button key={c.value} onClick={() => setFilters(f => ({ ...f, health: c.value }))}
            style={{ background: filters.health === c.value ? c.bg : '#F8FAFC', color: filters.health === c.value ? c.color : 'var(--muted)', border: `1px solid ${filters.health === c.value ? c.color + '44' : 'var(--border)'}`, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            {c.label}
          </button>
        ))}
        <input className="input-base" placeholder="Search projects…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ marginLeft: 'auto', width: 220 }} />
        <select className="input-base" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ width: 140 }}>
          <option value="all">All Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Intake Form */}
      {showIntake && (
        <div className="card" style={{ background: '#FAFAFF', border: '2px solid #E0E7FF' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 16 }}>New Project Request</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <input className="input-base" placeholder="Title" value={intake.title} onChange={e => setIntake({ ...intake, title: e.target.value })} />
            <input className="input-base" placeholder="Primary intent (required)" value={intake.intent} onChange={e => setIntake({ ...intake, intent: e.target.value })} />
            <select className="input-base" value={intake.priority} onChange={e => setIntake({ ...intake, priority: e.target.value })}>
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — Normal</option>
              <option value="P3">P3 — Low</option>
            </select>
            <input className="input-base" placeholder="Project hint (optional)" value={intake.project_hint} onChange={e => setIntake({ ...intake, project_hint: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', gap: 12 }}>
            <input className="input-base" placeholder="Description / constraints" value={intake.description} onChange={e => setIntake({ ...intake, description: e.target.value })} />
            <input className="input-base" placeholder="Tags (comma separated)" value={intake.tags} onChange={e => setIntake({ ...intake, tags: e.target.value })} />
            <input className="input-base" type="date" value={intake.deadline} onChange={e => setIntake({ ...intake, deadline: e.target.value })} />
            <input className="input-base" type="number" placeholder="Budget (USD)" value={intake.budget_usd} onChange={e => setIntake({ ...intake, budget_usd: e.target.value })} />
            <button className="btn-primary" onClick={handleIntakeSubmit} disabled={submittingIntake || !intake.intent.trim()}>
              {submittingIntake ? '…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Selected project detail */}
      {(() => {
        const sel = enriched.find(p => p.id === selectedId);
        return sel ? (
          <ProjectDetail project={sel} agents={agents} tasks={tasks} okrs={okrs} lastUpdated={lastUpdated}
            onReplan={handleReplan} onExecute={handleExecute} onClose={() => setSelectedId(null)} />
        ) : null;
      })()}

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No projects found</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Use the "New Project" button to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, opacity: selectedId ? 0.4 : 1, transition: 'opacity 0.3s' }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} agents={agents} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />)}
        </div>
      )}
    </div>
  );
}
