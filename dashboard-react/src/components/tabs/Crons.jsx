import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

function relTime(iso) {
  if (!iso) return 'Never';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return iso; }
}

function StatusDot({ errors }) {
  const color = errors >= 3 ? 'var(--red)' : errors > 0 ? 'var(--amber)' : 'var(--mint)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function CronRow({ cron: j, toast }) {
  const [loading, setLoading] = useState(null);
  const errors = j._consecutive_errors || 0;

  async function toggle() {
    setLoading('toggle');
    try {
      await apiPost(`/api/crons/${j.id}/toggle`);
      toast?.(j.enabled !== false ? 'Job paused' : 'Job resumed', 'success');
    } catch (e) { toast?.(e.message, 'error'); }
    setLoading(null);
  }
  async function runNow() {
    setLoading('run');
    try {
      await apiPost(`/api/crons/${j.id}/run`);
      toast?.('Job triggered', 'success');
    } catch (e) { toast?.(e.message, 'error'); }
    setLoading(null);
  }

  const isEnabled = j.enabled !== false;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      background: errors >= 3 ? '#FFF8F8' : '#fff',
      transition: 'background 0.2s',
    }}>
      <StatusDot errors={errors} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{j.name || j.id}</span>
          {!isEnabled && <span style={{ fontSize: 10, background: '#F1F5F9', color: 'var(--muted)', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>Paused</span>}
          {errors >= 3 && <span style={{ fontSize: 10, background: '#FEF2F2', color: 'var(--red)', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>⚠ {errors} errors</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> {j.schedule || 'No schedule'}
          </span>
          <span>Last: {relTime(j.last_run)}</span>
          {j.next_run && <span>Next: {relTime(j.next_run)}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={runNow} disabled={!!loading} title="Run now"
          style={{ background: '#EEF2FF', border: '1px solid #E0E7FF', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
          <Play size={11} /> {loading === 'run' ? '…' : 'Run'}
        </button>
        <button onClick={toggle} disabled={!!loading} title={isEnabled ? 'Pause' : 'Resume'}
          style={{ background: isEnabled ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${isEnabled ? '#FEE2E2' : '#D1FAE5'}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isEnabled ? 'var(--red)' : 'var(--mint)', fontWeight: 600 }}>
          {isEnabled ? <Pause size={11} /> : <Play size={11} />} {isEnabled ? 'Pause' : 'Resume'}
        </button>
      </div>
    </div>
  );
}

export default function Crons({ data, toast }) {
  const { crons = [] } = data || {};
  const [search, setSearch] = useState('');

  const filtered = crons.filter(j => !search || (j.name || j.id || '').toLowerCase().includes(search.toLowerCase()));
  const errorJobs = crons.filter(j => (j._consecutive_errors || 0) >= 3);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Jobs & Crons</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{crons.length} scheduled jobs</p>
        </div>
        <input className="input-base" placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
      </div>

      {errorJobs.length > 0 && (
        <div style={{ padding: '14px 18px', background: '#FFF1F2', border: '1px solid #FEE2E2', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={18} color="var(--red)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{errorJobs.length} job{errorJobs.length > 1 ? 's' : ''} with repeated errors</span>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: '#F8FAFC', padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span style={{ flex: 1 }}>Job Name</span>
          <span style={{ minWidth: 100 }}>Schedule</span>
          <span style={{ minWidth: 120 }}>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No jobs match your search</div>
        ) : filtered.map(j => <CronRow key={j.id} cron={j} toast={toast} />)}
      </div>
    </div>
  );
}
