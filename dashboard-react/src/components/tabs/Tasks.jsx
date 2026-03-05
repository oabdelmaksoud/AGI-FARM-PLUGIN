import { useState, useEffect } from 'react';
import { createTask } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const FILTERS = ['all', 'pending', 'in-progress', 'complete', 'failed', 'blocked', '🚨 hitl'];
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
  if (!deadline) return <span style={{ color: 'var(--muted)', fontSize: 10 }}>[NO LIMIT]</span>;
  try {
    const d = new Date(deadline);
    const diff = Math.round((d - Date.now()) / 60000);
    const abs = Math.abs(diff);
    const over = diff < 0;
    const color = over ? 'var(--red)' : diff < 60 ? 'var(--amber)' : 'var(--muted)';
    const label = abs < 60
      ? `${over ? '-' : ''}${abs}M`
      : abs < 1440
        ? `${over ? '-' : ''}${Math.round(abs / 60)}H`
        : d.toLocaleDateString();
    return (
      <span title={d.toLocaleString()} style={{ color, fontSize: 10, fontWeight: over ? 800 : 600, fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{over ? ' !!' : ''}
      </span>
    );
  } catch {
    return <span style={{ color: 'var(--muted)', fontSize: 10 }}>{deadline}</span>;
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
          borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,.02)',
          background: isHitl ? 'rgba(255,42,85,0.03)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        className="task-row-hover"
      >
        <td style={{ padding: '12px 14px', color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, opacity: 0.8 }}>{t.id || '—'}</td>
        <td style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isHitl && <span style={{ textShadow: '0 0 8px var(--red)' }}>🚨</span>}
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, letterSpacing: '-0.01em' }}>{t.title || '—'}</span>
          </div>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t.assigned_to || '--'}</span>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <span className={`pri-tag ${pri.toLowerCase()}`} style={{
            fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4,
            background: pri === 'P1' ? 'rgba(255,42,85,0.1)' : 'rgba(255,255,255,0.05)',
            color: pri === 'P1' ? 'var(--red)' : 'var(--muted)',
            border: `1px solid ${pri === 'P1' ? 'rgba(255,42,85,0.2)' : 'rgba(255,255,255,0.05)'}`
          }}>{pri}</span>
        </td>
        <td style={{ padding: '12px 14px' }}><span className={`badge ${cls}`} style={{ fontSize: 9 }}>{t.status?.toUpperCase() || '—'}</span></td>
        <td style={{ padding: '12px 14px' }}><DeadlineBadge deadline={t.sla?.deadline || t.sla?.target} /></td>
        <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 10, textAlign: 'center' }}>
          {expanded ? '△' : '▽'}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
          <td colSpan={7} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {t.hitl_reason && (
                  <div className="card shadow-glow" style={{ border: '1px solid var(--red)', background: 'rgba(255,42,85,0.03)' }}>
                    <div className="section-title" style={{ color: 'var(--red)', fontSize: 9 }}>NEURAL INTERVENTION REQUIRED</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.hitl_reason}</div>
                  </div>
                )}

                <div>
                  <div className="section-title" style={{ fontSize: 9 }}>MISSION DESCRIPTION</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8 }}>
                    {t.description || 'No detailed log provided for this node.'}
                  </div>
                </div>

                {t.output && (
                  <div>
                    <div className="section-title" style={{ fontSize: 9, color: 'var(--green)' }}>MISSION OUTPUT</div>
                    <div style={{
                      fontSize: 12, color: 'var(--green)', lineHeight: 1.6, padding: 14, borderRadius: 8,
                      background: 'rgba(0,255,157,0.02)', border: '1px solid rgba(0,255,157,0.1)',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {t.output}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}>
                  <div className="section-title" style={{ fontSize: 9 }}>METADATA MATRIX</div>
                  <div style={{ display: 'grid', gap: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>TYPE:</span><span style={{ color: 'var(--cyan)' }}>{t.type?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>PROC_ID:</span><span style={{ color: 'var(--cyan)' }}>{t.proc_id || 'LOCAL'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>CREATED:</span><span>{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    {t.completed_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>RESOLVED:</span><span style={{ color: 'var(--green)' }}>{new Date(t.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {t.depends_on?.length > 0 && (
                  <div className="card">
                    <div className="section-title" style={{ fontSize: 9 }}>DEPENDENCIES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.depends_on.map(id => (
                        <span key={id} style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(0,240,255,0.05)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 4 }}>{id}</span>
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
      toast('Mission objective initialized', 'success');
      setShowNew(false);
      setNewTask({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const filtered = tasks.filter(t => {
    if (filter === '🚨 hitl' ? t.status !== 'needs_human_decision' : (filter !== 'all' && t.status !== filter)) return false;
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

  const filterCount = (f) => f === '🚨 hitl'
    ? tasks.filter(t => t.status === 'needs_human_decision').length
    : tasks.filter(t => t.status === f).length;

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input-base" placeholder="QUERY MISSIONS..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ flex: '0 1 220px', background: 'rgba(0,0,0,0.2)' }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilterAndReset(f)} style={{
              background: filter === f ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f ? 'rgba(0, 240, 255, 0.4)' : 'var(--border)'}`,
              color: filter === f ? 'var(--cyan)' : 'var(--muted)',
              padding: '6px 14px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s',
              boxShadow: filter === f ? '0 0 15px rgba(0, 240, 255, 0.1)' : 'none',
            }}>
              {f.replace('🚨 ', '')}{f !== 'all' && <span style={{ opacity: 0.6, marginLeft: 6 }}>{filterCount(f)}</span>}
            </button>
          ))}
        </div>

        <button className="btn-primary" style={{ height: 36, marginLeft: 'auto' }} onClick={() => setShowNew(v => !v)}>+ NEW MISSION</button>
        <div style={{ marginLeft: 10 }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      {showNew && (
        <div className="card shadow-glow" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, border: '1px solid var(--border-h)' }}>
          <div className="section-title" style={{ gridColumn: 'span 3' }}>INITIALIZE MISSION PARAMETERS</div>
          <input className="input-base" placeholder="TASK ID *" value={newTask.id} onChange={e => setNewTask(p => ({ ...p, id: e.target.value }))} />
          <input className="input-base" placeholder="OBJECTIVE TITLE *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} style={{ gridColumn: 'span 2' }} />
          <textarea className="input-base" placeholder="MISSION DESCRIPTION" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} style={{ gridColumn: 'span 3', minHeight: 60 }} />
          <select className="input-base" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="P1">PRIORITY P1</option><option value="P2">PRIORITY P2</option><option value="P3">PRIORITY P3</option>
          </select>
          <select className="input-base" value={newTask.assigned_to} onChange={e => setNewTask(p => ({ ...p, assigned_to: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="">NODE ASSIGNMENT...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name.toUpperCase()}</option>)}
          </select>
          <select className="input-base" value={newTask.type} onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="dev">DEV</option><option value="research">RESEARCH</option><option value="review">REVIEW</option><option value="ops">OPS</option>
          </select>
          <div style={{ gridColumn: 'span 3', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !newTask.id || !newTask.title}>{saving ? 'PROCESSING...' : 'INITIALIZE MISSION'}</button>
            <button className="input-base" style={{ cursor: 'pointer', border: 'none' }} onClick={() => setShowNew(false)}>ABORT</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
              {[['id', 'ID'], ['title', 'OBJECTIVE'], ['assigned_to', 'NODE'], ['priority', 'PRI'], ['status', 'STATUS'], [null, 'TTL'], [null, '']].map(([col, h]) => (
                <th key={h} onClick={col ? () => handleSort(col) : undefined} style={{
                  padding: '12px 14px', textAlign: 'left', fontSize: 9,
                  color: sortCol === col ? 'var(--cyan)' : 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: col ? 'pointer' : 'default', userSelect: 'none',
                }}>{h}{sortCol === col ? (sortDir === 'asc' ? ' △' : ' ▽') : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '80px 12px', color: 'var(--muted)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em' }}>MISSION INDEX NULL</div>
                  <div style={{ fontSize: 10, marginTop: 8, opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>
                    {filter === 'all' ? 'NO ACTIVE TASKS IN CURRENT CONTEXT.' : `QUERY RETURNED ZERO NODES FOR STATUS: ${filter.replace('🚨 ', '').toUpperCase()}.`}
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
        <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: 10 }}>
            PREV_PAGE
          </button>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            SEGMENT {page + 1} // {totalPages}
          </div>
          <button className="btn-primary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: 10 }}>
            NEXT_PAGE
          </button>
        </div>
      )}
    </div>
  );
}
