import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ color: 'var(--muted)', fontSize: 11 }}>{t.toLocaleTimeString()}</span>;
}

export default function Header({ data, connected, lastUpdated, updateCount, toast }) {
  const agents  = data?.agents || [];
  const tc      = data?.task_counts || {};
  const budget  = data?.budget || {};
  const limits  = budget.limits  || {};
  const current = budget.current || {};
  const spent   = current.daily_usd ?? 0;
  const limit   = limits.daily_usd ?? 0;
  const pct     = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const online  = agents.filter(a => ['active','available','busy'].includes(a.status)).length;

  // Gateway is truly live only if SSE is connected AND gateway_online flag from backend
  const gatewayOnline = connected && (data?.gateway_online !== false);
  const statusLabel   = !connected ? 'OFFLINE' : data?.gateway_online === false ? 'NO GATEWAY' : 'LIVE';
  const statusColor   = !connected ? 'var(--red)' : data?.gateway_online === false ? 'var(--amber)' : 'var(--green)';
  const dotClass      = !connected ? 'dot-error' : data?.gateway_online === false ? 'dot-busy' : 'dot-active';

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
    <header style={{
      height: 52, background: 'var(--bg2)', borderBottom: showBanner ? 'none' : '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 20,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
        <span style={{ fontSize: 18 }}>🦅</span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--cyan)', letterSpacing: 1 }}>
          AGI Ops Room
        </span>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={data?.gateway_online === false ? 'OpenClaw gateway unreachable' : ''}>
        <span className={`dot ${dotClass}`} />
        <span style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <Stat label="Online"   value={`${online}/${agents.length}`} color="var(--cyan)" />
      <Stat label="Pending"  value={tc.pending ?? 0}              color="var(--amber)" />
      <Stat label="HITL 🚨"  value={tc.needs_human_decision ?? 0} color="var(--purple)" alert={(tc.needs_human_decision ?? 0) > 0} />
      <Stat label="Budget"   value={`$${spent.toFixed(2)}/$${limit}`}
            color={pct > (budget.alerts?.daily_threshold_pct ?? 70) ? 'var(--red)' : 'var(--green)'} />

      <div style={{ flex: 1 }} />

      {updateCount > 0 && (
        <span style={{ fontSize: 9, color: 'var(--cyan)', opacity: 0.5 }}>#{updateCount}</span>
      )}
      {lastUpdated && (
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>↻ {lastUpdated.toLocaleTimeString()}</span>
      )}
      <Clock />
    </header>

    {/* Update banner */}
    {showBanner && (
      <div className="update-banner">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔄</span>
          <span>Update available: <strong>v{updateInfo.currentVersion}</strong> → <strong>v{updateInfo.latestVersion}</strong></span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {updateInfo.releaseUrl && (
            <a href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--cyan)', fontSize: 11, textDecoration: 'underline' }}>Release Notes</a>
          )}
          <button className="btn-primary" onClick={handleUpdate} disabled={updating}
            style={{ fontSize: 11, padding: '3px 10px' }}>
            {updating ? 'Updating...' : 'Update Now'}
          </button>
          <button onClick={handleDismiss} style={{
            background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            fontSize: 14, padding: '0 4px', fontFamily: 'inherit',
          }}>✕</button>
        </div>
      </div>
    )}
    </>
  );
}

function Stat({ label, value, color, alert }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: alert ? 'var(--red)' : color }}>{value}</div>
    </div>
  );
}
