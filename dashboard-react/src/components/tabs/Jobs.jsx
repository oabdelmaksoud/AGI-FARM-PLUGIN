import { useMemo, useState } from 'react';
import LastUpdated from '../LastUpdated';
import { createJob, cancelJob, retryJob } from '../../lib/api';

function JobStep({ step }) {
  const color = step.status === 'complete' ? 'var(--green)'
    : step.status === 'running' ? 'var(--cyan)'
      : step.status === 'failed' ? 'var(--red)'
        : step.status === 'blocked' ? 'var(--amber)' : 'var(--muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, padding: '3px 0' }}>
      <span style={{ color }}>●</span>
      <span style={{ minWidth: 70 }}>{step.kind}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{step.status}</span>
      <span style={{ color: 'var(--text-secondary)' }}>attempt {step.attempt || 0}/{step.maxAttempts || 2}</span>
    </div>
  );
}

export default function Jobs({ data, lastUpdated }) {
  const { jobs = [], featureFlags = {} } = data || {};
  const [intent, setIntent] = useState('');
  const [priority, setPriority] = useState('P2');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const disabled = !featureFlags.jobs;
  const sorted = useMemo(() => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [jobs]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!intent.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createJob({
        intent: intent.trim(),
        priority,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setIntent('');
      setTags('');
    } catch (err) {
      setError(err.message || 'create_failed');
    }
    setLoading(false);
  }

  async function onCancel(id) {
    try { await cancelJob(id); } catch { }
  }

  async function onRetry(id) {
    try { await retryJob(id); } catch { }
  }

  if (disabled) {
    return <div className="card">Jobs feature is disabled. Enable `featureJobs` in plugin config.</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
      <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="section-title">Create Job</div>
        <input value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="High-level intent..."
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px 10px', fontFamily: 'inherit' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 10 }}>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px' }}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags (comma separated)"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px 10px', fontFamily: 'inherit' }} />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '...' : 'Create'}
          </button>
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 11 }}>{error}</div>}
      </form>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Jobs ({sorted.length})</div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {sorted.length === 0 && <div className="empty-state">No jobs yet.</div>}

      {sorted.map((job) => (
        <div key={job.id} className="card" style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{job.title}</span>
            <span className="badge badge-pending" style={{ textTransform: 'none' }}>{job.status}</span>
            <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{job.id}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 11 }}>{new Date(job.createdAt).toLocaleString()}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{job.intent}</div>
          <div style={{ display: 'grid', gap: 2 }}>
            {(job.steps || []).map((step) => <JobStep key={step.id} step={step} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onCancel(job.id)} disabled={['complete', 'failed', 'cancelled', 'blocked'].includes(job.status)}
              className="btn-danger" style={{ fontSize: 11, padding: '5px 10px' }}>
              Cancel
            </button>
            <button onClick={() => onRetry(job.id)} disabled={!['failed', 'blocked'].includes(job.status)}
              style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Retry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
