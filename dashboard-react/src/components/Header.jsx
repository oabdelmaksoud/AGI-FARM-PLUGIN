import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';
import { Wifi, WifiOff, RefreshCw, ArrowUpCircle } from 'lucide-react';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
      {t.toLocaleTimeString([], { hour12: true })}
    </span>
  );
}

function KPIChip({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '6px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text)', marginTop: 1 }}>{value}</span>
    </div>
  );
}

export default function Header({ data, connected, lastUpdated, toast }) {
  const agents = data?.agents || [];
  const tc = data?.task_counts || {};
  const budget = data?.budget || {};
  const livedata = data || {};

  const gatewayOnline = connected && (livedata.gateway_online !== false);
  const isLive = connected && gatewayOnline;

  const updateInfo = data?.update_info;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('update-dismissed') === 'true');
  const [updating, setUpdating] = useState(false);
  const showBanner = updateInfo?.updateAvailable && !dismissed;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const result = await apiPost('/api/update-install');
      if (result.success) toast?.('Update installed — please restart', 'success');
      else toast?.(result.error || 'Update failed', 'error');
    } catch (e) { toast?.(e.message, 'error'); }
    setUpdating(false);
  };

  const activeAgents = agents.filter(a => a.status !== 'available').length;
  const totalAgents = agents.length;
  const hitlCount = tc.needs_human_decision ?? 0;
  const dailySpend = (budget.current?.daily_usd ?? 0).toFixed(2);

  return (
    <>
      <header style={{
        height: 60, borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)',
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20,
        position: 'sticky', top: 0, zIndex: 200, backdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-sm)', flexShrink: 0,
      }}>
        {/* Status Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive
            ? <Wifi size={14} color="var(--mint)" />
            : <WifiOff size={14} color="var(--red)" />
          }
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: isLive ? 'var(--mint)' : 'var(--red)',
          }}>
            {isLive ? 'Connected' : !connected ? 'Offline' : 'Gateway Down'}
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* KPIs */}
        <KPIChip
          label="Active Agents"
          value={`${activeAgents} / ${totalAgents}`}
          color="var(--accent)"
        />
        <KPIChip
          label="HITL Queue"
          value={hitlCount}
          color={hitlCount > 0 ? 'var(--purple)' : 'var(--text-dim)'}
        />
        <KPIChip
          label="Daily Spend"
          value={`$${dailySpend}`}
          color="var(--mint)"
        />

        <div style={{ flex: 1 }} />

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 11 }}>
              <RefreshCw size={11} />
              <span>Updated {lastUpdated.toLocaleTimeString([], { hour12: true })}</span>
            </div>
          )}
          <Clock />
        </div>
      </header>

      {showBanner && (
        <div style={{
          background: 'var(--accent)', color: '#fff', padding: '8px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '12px', fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpCircle size={14} />
            <span>Update available: v{updateInfo.currentVersion} → v{updateInfo.latestVersion}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleUpdate} disabled={updating} style={{
              background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              padding: '4px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            }}>
              {updating ? 'Installing…' : 'Install Now'}
            </button>
            <button onClick={() => { setDismissed(true); sessionStorage.setItem('update-dismissed', 'true'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 16 }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

