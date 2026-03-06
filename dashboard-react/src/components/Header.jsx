import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t.toLocaleTimeString()}</span>;
}

export default function Header({ data, connected, lastUpdated, updateCount, toast }) {
  const agents = data?.agents || [];
  const tc = data?.task_counts || {};
  const budget = data?.budget || {};
  const limits = budget.limits || {};
  const current = budget.current || {};
  const spent = current.daily_usd ?? 0;
  const limit = limits.daily_usd ?? 0;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const online = agents.filter(a => ['active', 'available', 'busy'].includes(a.status)).length;

  const statusLabel = !connected ? 'Offline' : data?.gateway_online === false ? 'No Gateway' : 'Live';
  const statusColor = !connected ? 'var(--red)' : data?.gateway_online === false ? 'var(--amber)' : 'var(--green)';
  const dotClass = !connected ? 'dot-error' : data?.gateway_online === false ? 'dot-busy' : 'dot-active';

  const updateInfo = data?.update_info;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('update-dismissed') === 'true');
  const [updating, setUpdating] = useState(false);
  const showBanner = updateInfo?.updateAvailable && !dismissed;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const result = await apiPost('/api/update-install');
      if (result.success) {
        toast?.('Update installed! Restart the plugin to use the new version.', 'success');
      } else {
        toast?.(result.error || 'Update failed', 'error');
      }
    } catch (e) { toast?.(e.message, 'error'); }
    setUpdating(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('update-dismissed', 'true');
  };

  return (
    <>
      <header className="app-header">
        {/* Status */}
        <div className="status-indicator" title={data?.gateway_online === false ? 'OpenClaw gateway unreachable' : ''}>
          <span className={`dot ${dotClass}`} style={{ width: 7, height: 7 }} />
          <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Stat label="Agents" value={`${online}/${agents.length}`} color="var(--cyan)" />
          <Stat label="Pending" value={tc.pending ?? 0} color="var(--amber)" />
          <Stat label="HITL" value={tc.needs_human_decision ?? 0} color={(tc.needs_human_decision ?? 0) > 0 ? 'var(--red)' : 'var(--purple)'} />
          <Stat label="Budget" value={`$${spent.toFixed(2)}`} sub={`/ $${limit}`}
            color={pct > (budget.alerts?.daily_threshold_pct ?? 70) ? 'var(--red)' : 'var(--green)'} />
        </div>

        <div style={{ flex: 1 }} />

        {updateCount > 0 && (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>#{updateCount}</span>
        )}
        {lastUpdated && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Updated {lastUpdated.toLocaleTimeString()}</span>
        )}
        <Clock />
      </header>

      {showBanner && (
        <div className="update-banner">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Update available: <strong>v{updateInfo.currentVersion}</strong> &rarr; <strong>v{updateInfo.latestVersion}</strong></span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {updateInfo.releaseUrl && (
              <a href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--cyan)', fontSize: 12, textDecoration: 'underline' }}>Release Notes</a>
            )}
            <button className="btn-primary" onClick={handleUpdate} disabled={updating}
              style={{ fontSize: 12, padding: '4px 12px' }}>
              {updating ? 'Updating...' : 'Update Now'}
            </button>
            <button className="btn-ghost" onClick={handleDismiss} style={{ fontSize: 16, padding: '2px 6px' }}>&times;</button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</span>}
    </div>
  );
}
