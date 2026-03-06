import { useState, useEffect } from 'react';
import { createTask } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const FILTERS = ['all', 'pending', 'in-progress', 'complete', 'failed', 'blocked', 'hitl'];
const FILTER_LABELS = { all: 'All', pending: 'Pending', 'in-progress': 'In Progress', complete: 'Complete', failed: 'Failed', blocked: 'Blocked', hitl: 'HITL' };
const PAGE_SIZE = 25;

function useTick(intervalMs = 10000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function DeadlineBadge({ deadline }) {
  useTick(10000);
  if (!deadline) return <span style={{ color: 'var(--muted)', fontSize: 11 }}>&mdash;</span>;
  try {
    const d = new Date(deadline);
    const diff = Math.round((d - Date.now()) / 60000);
    const abs = Math.abs(diff);
    const over = diff < 0;
    const color = over ? 'var(--red)' : diff < 60 ? 'var(--amber)' : 'var(--text-secondary)';
    const label = abs < 60
      ? `${over ? '-' : ''}${abs}m`
      : abs < 1440
        ? `${over ? '-' : ''}${Math.round(abs / 60)}h`
        : d.toLocaleDateString();
    return (
      <span title={d.toLocaleString()} className="mono" style={{ color, fontSize: 11, fontWeight: over ? 700 : 500 }}>
        {label}{over ? ' overdue' : ''}
      </span>
    );
  } catch {
    return <span style={{ color: 'var(--muted)', fontSize: 11 }}>{deadline}</span>;
  }
}

function TaskRow({ task: t, expanded, onToggle }) {
  const pri = (t.sla?.priority || t.priority || 'P3').toUpperCase();
  const s = (t.status || '').toLowerCase().replace(/ /g, '-');
  const cls = {
    'complete': 'badge-complete', 'pending': 'badge-pending',
    'in-progress': 'badge-in-progress', 'failed': 'badge-failed',
    'needs_human_decision': 'badge-hitl', 'blocked': 'badge-blocked',
  }[s] || 'badge-pending';
  const isHitl = t.status === 'needs_human_decision';

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          background: isHitl ? 'var(--purple-dim)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        className="task-row-hover"
      >
        <td style={{ padding: '12px 14px' }}>
          <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{t.id || '\u2014'}</span>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isHitl && <span style={{ color: 'var(--purple)' }}>&#x26A0;</span>}
            <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>{t.title || '\u2014'}</span>
          </div>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.assigned_to || '\u2014'}</span>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <span className={pri === 'P1' ? 'p1' : pri === 'P2' ? 'p2' : 'p3'}>{pri}</span>
        </td>
        <td style={{ padding: '12px 14px' }}><span className={`badge ${cls}`}>{t.status?.toUpperCase() || '\u2014'}</span></td>
        <td style={{ padding: '12px 14px' }}><DeadlineBadge deadline={t.sla?.deadline || t.sla?.target} /></td>
        <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
          {expanded ? '\u25B4' : '\u25BE'}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: 'var(--bg3)' }}>
          <td colSpan={7} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {t.hitl_reason && (
                  <div className="card" style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'var(--purple-dim)' }}>
                    <div className="section-title" style={{ color: 'var(--purple)' }}>Human Decision Required</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t.hitl_reason}</div>
                  </div>
                )}

                <div>
                  <div className="section-title">Description</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, background: 'var(--bg)', padding: 16, borderRadius: 8 }}>
                    {t.description || 'No description provided.'}
                  </div>
                </div>

                {t.output && (
                  <div>
                    <div className="section-title" style={{ color: 'var(--green)' }}>Output</div>
                    <div className="mono" style={{
                      fontSize: 12, color: 'var(--green)', lineHeight: 1.6, padding: 16, borderRadius: 8,
                      background: 'var(--green-dim)', border: '1px solid rgba(52,211,153,0.15)',
                    }}>
                      {t.output}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ background: 'var(--bg)' }}>
                  <div className="section-title">Metadata</div>
                  <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
                    {[
                      ['Type', t.type?.toUpperCase(), 'var(--cyan)'],
                      ['Process', t.proc_id || 'Local', 'var(--text-secondary)'],
                      ['Created', t.created_at ? new Date(t.created_at).toLocaleString() : '\u2014', 'var(--text-secondary)'],
                      t.completed_at && ['Completed', new Date(t.completed_at).toLocaleString(), 'var(--green)'],
                    ].filter(Boolean).map(([label, val, c]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>{label}</span>
                        <span className="mono" style={{ color: c }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {t.depends_on?.length > 0 && (
                  <div className="card" style={{ background: 'var(--bg)' }}>
                    <div className="section-title">Dependencies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.depends_on.map(id => (
                        <span key={id} className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: 4 }}>{id}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Tasks({ data, lastUpdated, toast }) {
  const { tasks = [], agents = [] } = data || {};
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
  const [saving, setSaving] = useState(false);

  const handleSort = (col) => {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleCreate = async () => {
    if (!newTask.id || !newTask.title) return;
    setSaving(true);
    try {
      await createTask(newTask);
      toast('Task created successfully', 'success');
      setShowNew(false);
      setNewTask({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const filtered = tasks.filter(t => {
    if (filter === 'hitl' ? t.status !== 'needs_human_decision' : (filter !== 'all' && t.status !== filter)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.id || '').toLowerCase().includes(q) || (t.title || '').toLowerCase().includes(q) || (t.assigned_to || '').toLowerCase().includes(q);
  });

  const sorted = sortCol ? [...filtered].sort((a, b) => {
    const va = (a[sortCol] || '').toString().toLowerCase();
    const vb = (b[sortCol] || '').toString().toLowerCase();
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }) : filtered;

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);
  const setFilterAndReset = (f) => { setFilter(f); setPage(0); setExpanded(null); };

  const filterCount = (f) => f === 'hitl'
    ? tasks.filter(t => t.status === 'needs_human_decision').length
    : tasks.filter(t => t.status === f).length;

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input-base" placeholder="Search tasks..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ flex: '0 1 240px' }} />

        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilterAndReset(f)} className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: 12 }}>
              {FILTER_LABELS[f]}{f !== 'all' && <span style={{ opacity: 0.6, marginLeft: 4 }}>{filterCount(f)}</span>}
            </button>
          ))}
        </div>

        <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowNew(v => !v)}>+ New Task</button>
        <LastUpdated ts={lastUpdated} />
      </div>

      {/* New task form */}
      {showNew && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, borderColor: 'var(--border-h)' }}>
          <div className="section-title" style={{ gridColumn: 'span 3' }}>Create New Task</div>
          <input className="input-base" placeholder="Task ID *" value={newTask.id} onChange={e => setNewTask(p => ({ ...p, id: e.target.value }))} />
          <input className="input-base" placeholder="Title *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} style={{ gridColumn: 'span 2' }} />
          <textarea className="input-base" placeholder="Description" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} style={{ gridColumn: 'span 3', minHeight: 60 }} />
          <select className="input-base" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="P1">P1 - Critical</option><option value="P2">P2 - High</option><option value="P3">P3 - Normal</option>
          </select>
          <select className="input-base" value={newTask.assigned_to} onChange={e => setNewTask(p => ({ ...p, assigned_to: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="">Assign to...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
          </select>
          <select className="input-base" value={newTask.type} onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="dev">Development</option><option value="research">Research</option><option value="review">Review</option><option value="ops">Operations</option>
          </select>
          <div style={{ gridColumn: 'span 3', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !newTask.id || !newTask.title}>{saving ? 'Creating...' : 'Create Task'}</button>
            <button className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              {[['id', 'ID'], ['title', 'Title'], ['assigned_to', 'Assignee'], ['priority', 'Priority'], ['status', 'Status'], [null, 'Deadline'], [null, '']].map(([col, h]) => (
                <th key={h} onClick={col ? () => handleSort(col) : undefined}
                  className={col ? 'sortable' : ''}
                  style={{ color: sortCol === col ? 'var(--cyan)' : undefined }}>
                  {h}{sortCol === col ? (sortDir === 'asc' ? ' \u25B4' : ' \u25BE') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">&#x1F4CB;</div>
                    <div className="empty-state-title">No tasks found</div>
                    <div className="empty-state-desc">
                      {filter === 'all' ? 'No tasks in the system yet.' : `No tasks with status "${FILTER_LABELS[filter]}".`}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {paged.map(t => (
              <TaskRow key={t.id} task={t} expanded={expanded === t.id} onToggle={() => toggle(t.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button className="btn-secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</button>
        </div>
      )}
    </div>
  );
}
