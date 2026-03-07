import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';

function ProcessCard({ proc }) {
  const statusColor = proc.status === 'running' ? 'var(--mint)' : proc.status === 'error' ? 'var(--red)' : 'var(--muted)';
  const statusBg = proc.status === 'running' ? '#ECFDF5' : proc.status === 'error' ? '#FEF2F2' : '#F8FAFC';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{proc.name || proc.id}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>PID: {proc.pid || '—'}</div>
        </div>
        <span style={{ background: statusBg, color: statusColor, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
          {proc.status || 'unknown'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {proc.cpu_pct !== undefined && (
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}><Cpu size={10} /> CPU</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{proc.cpu_pct?.toFixed(1)}%</div>
          </div>
        )}
        {proc.mem_mb !== undefined && (
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}><HardDrive size={10} /> Memory</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{proc.mem_mb?.toFixed(0)}MB</div>
          </div>
        )}
      </div>
      {proc.description && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{proc.description}</div>}
    </div>
  );
}

export default function Processes({ data }) {
  const { processes = [] } = data || {};
  const running = processes.filter(p => p.status === 'running').length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>System Processes</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{running} of {processes.length} processes running</p>
      </div>
      {processes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No processes tracked</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {processes.map((p, i) => <ProcessCard key={p.id || i} proc={p} />)}
        </div>
      )}
    </div>
  );
}
