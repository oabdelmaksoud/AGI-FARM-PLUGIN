import { useState, useEffect } from 'react';
import { createTask } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const FILTERS = ['all', 'pending', 'in-progress', 'complete', 'failed', 'blocked', 'hitl'];
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
  if (!deadline) return <span style={{ color: 'var(--muted)', fontSize: '10px' }}>[NO_LIMIT]</span>;
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
      <span title={d.toLocaleString()} style={{ color, fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        {label}{over ? ' !!' : ''}
      </span>
    );
  } catch {
    return <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{deadline}</span>;
  }
}

function TaskRow({ task: t, expanded, onToggle }) {
  const pri = (t.sla?.priority || t.priority || 'P3').toUpperCase();
  const status = (t.status || '').toLowerCase();

  const statusColor = {
    'complete': 'var(--mint)',
    'in-progress': 'var(--accent)',
    'failed': 'var(--red)',
    'needs_human_decision': 'var(--purple)',
    'blocked': 'var(--red)',
  }[status] || 'var(--muted)';

  const isHitl = status === 'needs_human_decision';

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: '1px solid var(--border-light)',
          background: isHitl ? 'rgba(181, 53, 255, 0.05)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <td style={{ padding: '12px 16px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
          {t.id?.toUpperCase() || '--'}
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isHitl && <span style={{ color: 'var(--purple)', fontWeight: 900 }}>[!]</span>}
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{t.title?.toUpperCase() || '--'}</span>
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{t.assigned_to?.toUpperCase() || '--'}</span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.03)', color: pri === 'P1' ? 'var(--red)' : 'var(--muted)',
            border: `1px solid ${pri === 'P1' ? 'var(--red)' : 'var(--border)'}`,
            fontFamily: 'var(--font-mono)'
          }}>{pri}</span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: statusColor, fontFamily: 'var(--font-mono)' }}>
            {status.toUpperCase().replace(/_/g, ' ')}
          </span>
        </td>
        <td style={{ padding: '12px 16px' }}><DeadlineBadge deadline={t.sla?.deadline || t.sla?.target} /></td>
        <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          {expanded ? '[-]' : '[+]'}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: '#080808' }}>
          <td colSpan={7} style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {t.hitl_reason && (
                  <div className="card" style={{ borderColor: 'var(--purple)', background: 'rgba(181, 53, 255, 0.03)' }}>
                    <div className="section-title" style={{ color: 'var(--purple)' }}>INTERVENTION_REQUIRED</div>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{t.hitl_reason}</div>
                  </div>
                )}

                <div>
                  <div className="section-title">MISSION_OBJECTIVE_DETAIL</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, background: '#000', padding: '16px', border: '1px solid var(--border-light)' }}>
                    {t.description || 'NO_DETAILED_LOG_AVAILABLE_FOR_NODE.'}
                  </div>
                </div>

                {t.output && (
                  <div>
                    <div className="section-title" style={{ color: 'var(--mint)' }}>FINAL_RESOLUTION_OUTPUT</div>
                    <div style={{
                      fontSize: '11px', color: 'var(--mint)', lineHeight: 1.6, padding: '16px', border: '1px solid var(--mint)',
                      background: 'rgba(0,240,255,0.01)', fontFamily: 'var(--font-mono)'
                    }}>
                      {t.output}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card">
                  <div className="section-title">METADATA_ARRAY</div>
                  <div style={{ display: 'grid', gap: 10, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>MODE:</span><span>{t.type?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>PID:</span><span style={{ color: 'var(--accent)' }}>{t.proc_id || 'LOCAL'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>TX_START:</span><span>{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    {t.completed_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>TX_COMPL:</span><span style={{ color: 'var(--mint)' }}>{new Date(t.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {t.depends_on?.length > 0 && (
                  <div className="card">
                    <div className="section-title">NODE_DEPENDENCIES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.depends_on.map(id => (
                        <span key={id} style={{ fontSize: '9px', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}>{id.toUpperCase()}</span>
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
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTask.id || !newTask.title) return;
    setSaving(true);
    try {
      await createTask(newTask);
      toast('MISSION_OBJECTIVE_STAGED', 'success');
      setShowNew(false);
      setNewTask({ id: '', title: '', description: '', priority: 'P2', assigned_to: '', type: 'dev' });
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
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
    <div className="fade-in" style={{ display: 'grid', gap: 20 }}>
      {/* Search & Filter bar */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input-base"
          placeholder="SEARCH_MISSION_ID..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ width: '240px', fontFamily: 'var(--font-mono)' }}
        />

        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{
              background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              color: filter === f ? '#000' : 'var(--muted)',
              padding: '6px 12px', borderRadius: '2px', fontSize: '10px', cursor: 'pointer',
              fontWeight: 800, textTransform: 'uppercase', transition: 'all 0.15s',
              fontFamily: 'var(--font-mono)'
            }}>
              {f}
            </button>
          ))}
        </div>

        <button className="btn-primary" style={{ padding: '8px 16px', marginLeft: 'auto' }} onClick={() => setShowNew(!showNew)}>+ NEW_MISSION</button>
      </div>

      {showNew && (
        <div className="card" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          background: 'rgba(37, 175, 244, 0.03)', borderColor: 'var(--accent)'
        }}>
          <div className="section-title" style={{ gridColumn: 'span 3', color: 'var(--accent)' }}>INITIALIZE_MISSION_PARAMETERS</div>
          <input className="input-base" placeholder="TASK_ID *" value={newTask.id} onChange={e => setNewTask({ ...newTask, id: e.target.value })} />
          <input className="input-base" placeholder="OBJECTIVE_TITLE *" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} style={{ gridColumn: 'span 2' }} />
          <textarea className="input-base" placeholder="MISSION_DESCRIPTION" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} style={{ gridColumn: 'span 3', minHeight: '80px' }} />
          <select className="input-base" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
            <option value="P1">P1_CRITICAL</option><option value="P2">P2_NORMAL</option><option value="P3">P3_LOW</option>
          </select>
          <select className="input-base" value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}>
            <option value="">NODE_ASSIGNMENT...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name.toUpperCase()}</option>)}
          </select>
          <button className="btn-primary" onClick={handleCreate} disabled={saving || !newTask.id || !newTask.title} style={{ gridColumn: 'span 1' }}>{saving ? 'PROCESSING...' : 'INITIALIZE'}</button>
        </div>
      )}

      {/* High-Density Table */}
      <div style={{ border: '1px solid var(--border)', background: '#050505' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
              {['ID', 'MISSION_OBJECTIVE', 'NODE', 'PRI', 'STATUS', 'TTL', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: '9px', color: 'var(--muted)',
                  fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '80px', color: 'var(--muted)', textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  SIGNAL_VOID // NO_MATCHING_MISSIONS_FOUND
                </td>
              </tr>
            ) : (
              paged.map(t => <TaskRow key={t.id} task={t} expanded={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: '6px 16px', fontSize: '10px' }}>PREV</button>
          <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>PAGE {page + 1} // {totalPages}</span>
          <button className="btn-secondary" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} style={{ padding: '6px 16px', fontSize: '10px' }}>NEXT</button>
        </div>
      )}
    </div>
  );
}
