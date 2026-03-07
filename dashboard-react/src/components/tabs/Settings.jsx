import { useEffect, useState } from 'react';
import { apiPost } from '../../lib/api';
import { Save, RefreshCw } from 'lucide-react';

export default function Settings({ data, toast }) {
  const meta = data?.workspace_meta || {};
  const sourceSettings = data?.settings || {};
  const [settings, setSettings] = useState({
    budget_daily: sourceSettings.budget_daily ?? '',
    budget_weekly: sourceSettings.budget_weekly ?? '',
    budget_monthly: sourceSettings.budget_monthly ?? '',
    hitl_enabled: sourceSettings.hitl_enabled !== false,
    auto_resume: sourceSettings.auto_resume === true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings({
      budget_daily: sourceSettings.budget_daily ?? '',
      budget_weekly: sourceSettings.budget_weekly ?? '',
      budget_monthly: sourceSettings.budget_monthly ?? '',
      hitl_enabled: sourceSettings.hitl_enabled !== false,
      auto_resume: sourceSettings.auto_resume === true,
    });
  }, [
    sourceSettings.budget_daily,
    sourceSettings.budget_weekly,
    sourceSettings.budget_monthly,
    sourceSettings.hitl_enabled,
    sourceSettings.auto_resume,
  ]);

  const save = async () => {
    setSaving(true);
    try {
      await apiPost('/api/settings', settings);
      toast?.('Settings saved', 'success');
    } catch (e) { toast?.(e.message, 'error'); }
    setSaving(false);
  };

  function Row({ label, sub, children }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
    );
  }

  function Toggle({ value, onChange }) {
    return (
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: value ? 'var(--accent)' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s',
        padding: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', display: 'block',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Configure your AGI Farm workspace settings</p>
      </div>

      {/* Workspace Info */}
      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 12 }}>Workspace Info</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: 'var(--text-dim)' }}>
          {[
            { k: 'Workspace Path', v: meta.path || data?.workspace || '—' },
            { k: 'Team Name', v: meta.team_name || '—' },
            { k: 'Version', v: meta.version || data?.version || '—' },
            { k: 'Process ID', v: meta.pid || '—' },
          ].map(r => (
            <div key={r.k} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{r.k}</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Settings */}
      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 4 }}>Budget Limits</h2>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Spending limits in USD. Leave blank for no limit.</div>
        <Row label="Daily Limit" sub="Maximum spend in 24h">
          <input className="input-base" style={{ width: 120, textAlign: 'right' }}
            placeholder="e.g. 1.00" value={settings.budget_daily}
            onChange={e => setSettings(s => ({ ...s, budget_daily: e.target.value }))} />
        </Row>
        <Row label="Weekly Limit" sub="Maximum spend in 7 days">
          <input className="input-base" style={{ width: 120, textAlign: 'right' }}
            placeholder="e.g. 5.00" value={settings.budget_weekly}
            onChange={e => setSettings(s => ({ ...s, budget_weekly: e.target.value }))} />
        </Row>
        <Row label="Monthly Limit" sub="Maximum spend in 30 days">
          <input className="input-base" style={{ width: 120, textAlign: 'right' }}
            placeholder="e.g. 20.00" value={settings.budget_monthly}
            onChange={e => setSettings(s => ({ ...s, budget_monthly: e.target.value }))} />
        </Row>
      </div>

      {/* Behavior Settings */}
      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 4 }}>Behavior</h2>
        <Row label="HITL Gate" sub="Pause agents at human approval gates">
          <Toggle value={settings.hitl_enabled} onChange={v => setSettings(s => ({ ...s, hitl_enabled: v }))} />
        </Row>
        <Row label="Auto Resume" sub="Automatically resume tasks after approval">
          <Toggle value={settings.auto_resume} onChange={v => setSettings(s => ({ ...s, auto_resume: v }))} />
        </Row>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px' }}>
        {saving ? <><RefreshCw size={14} className="spin" /> Saving…</> : <><Save size={14} /> Save Settings</>}
      </button>
    </div>
  );
}
