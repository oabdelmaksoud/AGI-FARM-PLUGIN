import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
      {t.toLocaleTimeString([], { hour12: false })}
    </span>
  );
}

export default function Header({ data, connected, lastUpdated, updateCount, toast }) {
  const agents = data?.agents || [];
  const tc = data?.task_counts || {};
  const budget = data?.budget || {};
  const livedata = data || {};

  const gatewayOnline = connected && (livedata.gateway_online !== false);
  const statusLabel = !connected ? 'OFFLINE' : !gatewayOnline ? 'GATEWAY_DISCONNECT' : 'SYSTEM_LIVE';
  const statusColor = !connected ? 'var(--red)' : !gatewayOnline ? 'var(--amber)' : 'var(--mint)';
  const dotColor = !connected ? 'var(--red)' : !gatewayOnline ? 'var(--amber)' : 'var(--mint)';

  const updateInfo = data?.update_info;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('update-dismissed') === 'true');
  const [updating, setUpdating] = useState(false);
  const showBanner = updateInfo?.updateAvailable && !dismissed;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const result = await apiPost('/api/update-install');
      if (result.success) {
        toast?.('UPDATE_INSTALLED // RESTART_REQUIRED', 'success');
      } else {
        toast?.(result.error || 'UPDATE_FAILED', 'error');
      }
    } catch (e) { toast?.(e.message, 'error'); }
    setUpdating(false);
  };

  return (
    <>
      <header style={{
        height: '52px', borderBottom: '1px solid var(--border)', background: '#050505',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 24,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: '180px' }}>
          <span style={{ fontSize: '18px' }}>🦅</span>
          <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em', color: '#fff' }}>
            AGI_FARM_OS <span style={{ color: 'var(--muted)', fontWeight: 400 }}>// v1.4.0</span>
          </span>
        </div>

        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
          <span style={{ fontSize: '9px', fontWeight: 800, color: statusColor, fontFamily: 'var(--font-mono)' }}>{statusLabel}</span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-light)' }} />

        {/* Global Stats */}
        <Stat label="FLEET" value={`${agents.filter(a => a.status === 'active').length}/${agents.length}`} color="var(--accent)" />
        <Stat label="HITL" value={tc.needs_human_decision ?? 0} color={tc.needs_human_decision > 0 ? 'var(--purple)' : 'var(--muted)'} />
        <Stat label="DAILY_SPEND" value={`$${(budget.current?.daily_usd ?? 0).toFixed(2)}`} color="var(--mint)" />

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {lastUpdated && (
            <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              SYNC: {lastUpdated.toLocaleTimeString([], { hour12: false })}
            </span>
          )}
          <Clock />
        </div>
      </header>

      {showBanner && (
        <div style={{
          background: 'var(--accent)', color: '#000', padding: '8px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800
        }}>
          <span>UPDATE_AVAILABLE: v{updateInfo.currentVersion} → v{updateInfo.latestVersion}</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={handleUpdate}
              disabled={updating}
              style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}
            >
              {updating ? 'INSTALLING...' : 'INSTALL_NOW'}
            </button>
            <button onClick={() => { setDismissed(true); sessionStorage.setItem('update-dismissed', 'true'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}
