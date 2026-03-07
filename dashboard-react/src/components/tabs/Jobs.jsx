import { Briefcase } from 'lucide-react';

export default function Jobs({ data }) {
  const { jobs = [] } = data || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Jobs</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{jobs.length} jobs tracked</p>
      </div>
      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <Briefcase size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No jobs yet</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Name', 'Status', 'Agent', 'Created'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr key={job.id || i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{job.id?.slice(0, 12) || '--'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{job.name || job.title || '--'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: job.status === 'done' ? '#ECFDF5' : job.status === 'failed' ? '#FEF2F2' : '#EEF2FF',
                      color: job.status === 'done' ? 'var(--mint)' : job.status === 'failed' ? 'var(--red)' : 'var(--accent)',
                      borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>{job.status || 'unknown'}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)' }}>{job.agent || job.assigned_to || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)' }}>{job.created_at ? new Date(job.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
