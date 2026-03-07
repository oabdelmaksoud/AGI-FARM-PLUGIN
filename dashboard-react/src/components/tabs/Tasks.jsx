import { useState, useEffect } from 'react';
import { createTask, updateTask } from '../../lib/api';
import { Plus, ChevronDown, ChevronUp, Clock, User } from 'lucide-react';

const FILTERS = ['all', 'pending', 'in-progress', 'complete', 'failed', 'blocked', 'hitl'];
const PAGE_SIZE = 25;

const STATUS_STYLE = {
  complete: { bg: '#ECFDF5', color: 'var(--mint)', label: 'Complete' },
  'in-progress': { bg: '#EEF2FF', color: 'var(--accent)', label: 'In Progress' },
  failed: { bg: '#FEF2F2', color: 'var(--red)', label: 'Failed' },
  needs_human_decision: { bg: '#F5F3FF', color: 'var(--purple)', label: 'HITL' },
  blocked: { bg: '#FEF2F2', color: 'var(--red)', label: 'Blocked' },
  pending: { bg: '#F1F5F9', color: 'var(--muted)', label: 'Pending' },
};

function DeadlineBadge({ deadline }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(n => n + 1), 10000); return () => clearInterval(id); }, []);
  if (!deadline) return null;
  try {
    const d = new Date(deadline);
    const diff = Math.round((d - Date.now()) / 60000);
    const abs = Math.abs(diff);
    const over = diff < 0;
    const color = over ? 'var(--red)' : diff < 60 ? 'var(--amber)' : 'var(--text-dim)';
    const label = abs < 60 ? `${over ? '-' : ''}${abs}m` : abs < 1440 ? `${over ? '-' : ''}${Math.round(abs / 60)}h` : d.toLocaleDateString();
    return (
      <span title={d.toLocaleString()} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        color, fontSize: 11, fontWeight: 600,
      }}>
        <Clock size={11} />{label}{over ? ' !' : ''}
      </span>
    );
  } catch { return null; }
}

function TaskRow({ task: t, expanded, onToggle, toast }) {
  const status = (t.status || '').toLowerCase();
  const cfg = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const pri = (t.sla?.priority || t.priority || 'P3').toUpperCase();
  const isHitl = status === 'needs_human_decision';

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: '1px solid var(--border)',
          background: isHitl ? '#FAFAFF' : expanded ? '#FAFAFF' : '#fff',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{t.id?.slice(0, 12) || '--'}</td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isHitl && <span style={{ fontSize: 14 }}>🔔</span>}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.title || '--'}</span>
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
            <User size={12} />{t.assigned_to || '—'}
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{
            background: pri === 'P1' ? '#FEF2F2' : '#F1F5F9',
            color: pri === 'P1' ? 'var(--red)' : 'var(--muted)',
            border: `1px solid ${pri === 'P1' ? '#FEE2E2' : '#E2E8F0'}`,
            borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 8px',
          }}>{pri}</span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{
            background: cfg.bg, color: cfg.color, borderRadius: 999,
            fontSize: 11, fontWeight: 600, padding: '3px 10px',
          }}>{cfg.label}</span>
        </td>
        <td style={{ padding: '12px 16px' }}><DeadlineBadge deadline={t.sla?.deadline || t.sla?.target} /></td>
        <td style={{ padding: '12px 16px', color: 'var(--muted)', textAlign: 'right' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: '#FAFAFF', borderBottom: '2px solid #E0E7FF' }}>
          <td colSpan={7} style={{ padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {t.hitl_reason && (
                  <div style={{ padding: '14px 16px', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, marginBottom: 6 }}>⚡ Intervention Required</div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{t.hitl_reason}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Description</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, background: '#F8FAFC', padding: '14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {t.description || 'No description available.'}
                  </div>
                </div>
                {t.output && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mint)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Output</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, background: '#F0FDF4', padding: '14px', borderRadius: 10, border: '1px solid #D1FAE5', fontFamily: 'var(--font-mono)' }}>
                      {t.output}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</div>
                  {[
                    { k: 'Type', v: t.type },
                    { k: 'Created', v: t.created_at ? new Date(t.created_at).toLocaleString() : '—' },
                    { k: 'Completed', v: t.completed_at ? new Date(t.completed_at).toLocaleString() : '—' },
                  ].filter(r => r.v).map(r => (
                    <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>{r.k}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Update Status</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['pending', 'in-progress', 'complete', 'failed', 'blocked'].filter(s => s !== status).map(s => {
                      const c = STATUS_STYLE[s] || STATUS_STYLE.pending;
                      return (
                        <button key={s}
                          onClick={async e => { e.stopPropagation(); try { await updateTask(t.id, { status: s }); toast?.('Status updated', 'success'); } catch (err) { toast?.(err.message, 'error'); } }}
                          style={{
                            background: c.bg, color: c.color, border: `1px solid ${c.color}44`,
                            borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Tasks({ data, toast }) {
  const { tasks = [], agents = [] } = data || {};
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTask.id || !newTask.title) return;
    setSaving(true);
    try {
      await createTask(newTask);
      toast?.('Task created', 'success');
      setShowNew(false);
      setNewTask({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
    } catch (e) { toast?.(e.message, 'error'); } finally { setSaving(false); }
  };

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== (filter === 'hitl' ? 'needs_human_decision' : filter)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.id || '').toLowerCase().includes(q) || (t.title || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Task Queue</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{tasks.length} tasks across all agents</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNew && (
        <div className="card" style={{ background: '#FAFAFF', borderColor: '#E0E7FF', borderWidth: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 16 }}>Create New Task</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <input className="input-base" placeholder="Task ID *" value={newTask.id} onChange={e => setNewTask({ ...newTask, id: e.target.value })} />
            <input className="input-base" placeholder="Title *" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} style={{ gridColumn: 'span 2' }} />
            <textarea className="input-base" placeholder="Description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} style={{ gridColumn: 'span 3', minHeight: 80, resize: 'vertical' }} />
            <select className="input-base" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — Normal</option>
              <option value="P3">P3 — Low</option>
            </select>
            <select className="input-base" value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}>
              <option value="">Assign to agent…</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name || a.id}</option>)}
            </select>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !newTask.id || !newTask.title}>
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => {
            const count = f === 'all' ? tasks.length : tasks.filter(t => t.status === (f === 'hitl' ? 'needs_human_decision' : f)).length;
            return (
              <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{
                background: filter === f ? 'var(--accent)' : '#F8FAFC',
                color: filter === f ? '#fff' : 'var(--text-dim)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
                {f} {count > 0 && <span style={{ opacity: 0.75 }}>({count})</span>}
              </button>
            );
          })}
        </div>
        <input
          className="input-base"
          placeholder="Search tasks…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ marginLeft: 'auto', width: 220 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Title', 'Assigned To', 'Priority', 'Status', 'Deadline', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--muted)',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 64, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No tasks match your filter</td></tr>
            ) : (
              paged.map(t => <TaskRow key={t.id} task={t} expanded={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} toast={toast} />)
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: '6px 16px' }}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Page {page + 1} of {totalPages}</span>
          <button className="btn-secondary" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} style={{ padding: '6px 16px' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
