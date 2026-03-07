import { useEffect, useState } from 'react';
import {
  apiPost,
  getAuthStatus,
  verifyPin,
  setPin as apiSetPin,
  removePin as apiRemovePin,
  setPublicMode,
  listTemplates,
  exportTemplate,
  importTemplate,
  listSecrets,
  updateSecrets,
  deleteSecret,
} from '../../lib/api';
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
    auth: {
      public_mode: sourceSettings.auth?.public_mode === true,
      has_pin: sourceSettings.auth?.has_pin === true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [pinUnlock, setPinUnlock] = useState('');
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinRemove, setPinRemove] = useState('');
  const [publicModePin, setPublicModePin] = useState('');
  const [authState, setAuthState] = useState({ hasPin: false, publicMode: false, writeUnlocked: false });
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('My Dashboard');
  const [templateId, setTemplateId] = useState('');
  const [templateMode, setTemplateMode] = useState('replace');
  const [secretsScopes, setSecretsScopes] = useState([]);
  const [secretScope, setSecretScope] = useState('default');
  const [secretKey, setSecretKey] = useState('');
  const [secretValue, setSecretValue] = useState('');

  useEffect(() => {
    setSettings({
      budget_daily: sourceSettings.budget_daily ?? '',
      budget_weekly: sourceSettings.budget_weekly ?? '',
      budget_monthly: sourceSettings.budget_monthly ?? '',
      hitl_enabled: sourceSettings.hitl_enabled !== false,
      auto_resume: sourceSettings.auto_resume === true,
      auth: {
        public_mode: sourceSettings.auth?.public_mode === true,
        has_pin: sourceSettings.auth?.has_pin === true,
      },
    });
  }, [
    sourceSettings.budget_daily,
    sourceSettings.budget_weekly,
    sourceSettings.budget_monthly,
    sourceSettings.hitl_enabled,
    sourceSettings.auto_resume,
    sourceSettings.auth?.public_mode,
    sourceSettings.auth?.has_pin,
  ]);

  const refreshAux = async () => {
    try {
      const [auth, tpl, sec] = await Promise.all([
        getAuthStatus(),
        listTemplates(),
        listSecrets(),
      ]);
      setAuthState({
        hasPin: auth?.hasPin === true,
        publicMode: auth?.publicMode === true,
        writeUnlocked: auth?.writeUnlocked === true,
      });
      setTemplates(tpl?.templates || []);
      setSecretsScopes(sec?.scopes || []);
    } catch (e) {
      // non-blocking for settings page
    }
  };

  useEffect(() => {
    refreshAux();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiPost('/api/settings', settings);
      toast?.('Settings saved', 'success');
    } catch (e) { toast?.(e.message, 'error'); }
    setSaving(false);
  };

  const unlockWrites = async () => {
    if (!pinUnlock.trim()) return;
    try {
      await verifyPin(pinUnlock.trim());
      setPinUnlock('');
      await refreshAux();
      toast?.('Write access unlocked', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const savePin = async () => {
    try {
      await apiSetPin(pinNew.trim(), pinCurrent.trim());
      setPinCurrent('');
      setPinNew('');
      await refreshAux();
      toast?.('PIN updated', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const removePin = async () => {
    try {
      await apiRemovePin(pinRemove.trim());
      setPinRemove('');
      await refreshAux();
      toast?.('PIN removed', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const togglePublicMode = async () => {
    try {
      await setPublicMode(!authState.publicMode, publicModePin.trim());
      setPublicModePin('');
      await refreshAux();
      toast?.('Public mode updated', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const runExportTemplate = async () => {
    try {
      await exportTemplate({ name: templateName.trim(), id: templateId.trim() || undefined });
      await refreshAux();
      toast?.('Template exported', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const runImportTemplate = async () => {
    if (!templateId.trim()) return;
    try {
      await importTemplate({ id: templateId.trim(), mode: templateMode });
      await refreshAux();
      toast?.('Template imported', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const saveSecret = async () => {
    if (!secretScope.trim() || !secretKey.trim() || !secretValue.trim()) return;
    try {
      await updateSecrets(secretScope.trim(), { [secretKey.trim()]: secretValue });
      setSecretValue('');
      await refreshAux();
      toast?.('Secret stored', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
  };

  const removeSecret = async () => {
    if (!secretScope.trim() || !secretKey.trim()) return;
    try {
      await deleteSecret(secretScope.trim(), secretKey.trim());
      await refreshAux();
      toast?.('Secret removed', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    }
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

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 4 }}>Access Control</h2>
        <Row label="Write Access" sub={authState.writeUnlocked ? 'Unlocked for this browser session' : 'PIN required for edits'}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ width: 130 }} placeholder="PIN" value={pinUnlock} onChange={e => setPinUnlock(e.target.value)} />
            <button className="btn-secondary" onClick={unlockWrites}>Unlock</button>
          </div>
        </Row>
        <Row label="Public Mode" sub="Read-only dashboard mode">
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ width: 130 }} placeholder="PIN (if set)" value={publicModePin} onChange={e => setPublicModePin(e.target.value)} />
            <button className="btn-secondary" onClick={togglePublicMode}>{authState.publicMode ? 'Disable' : 'Enable'}</button>
          </div>
        </Row>
        <Row label="Set/Rotate PIN" sub="4-8 digits">
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ width: 130 }} placeholder="Current PIN" value={pinCurrent} onChange={e => setPinCurrent(e.target.value)} />
            <input className="input-base" style={{ width: 130 }} placeholder="New PIN" value={pinNew} onChange={e => setPinNew(e.target.value)} />
            <button className="btn-secondary" onClick={savePin}>Save PIN</button>
          </div>
        </Row>
        <Row label="Remove PIN" sub="Disables PIN lock">
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-base" style={{ width: 130 }} placeholder="Current PIN" value={pinRemove} onChange={e => setPinRemove(e.target.value)} />
            <button className="btn-secondary" onClick={removePin}>Remove</button>
          </div>
        </Row>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 4 }}>Templates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <input className="input-base" placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)} />
          <input className="input-base" placeholder="Template id (optional)" value={templateId} onChange={e => setTemplateId(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-secondary" onClick={runExportTemplate}>Export Current</button>
          <select className="input-base" value={templateMode} onChange={e => setTemplateMode(e.target.value)} style={{ width: 130 }}>
            <option value="replace">Replace</option>
            <option value="merge">Merge</option>
          </select>
          <button className="btn-secondary" onClick={runImportTemplate}>Import Selected ID</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Available: {(templates || []).map(t => t.id).join(', ') || 'none'}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 4 }}>Secrets</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <input className="input-base" placeholder="Scope" value={secretScope} onChange={e => setSecretScope(e.target.value)} />
          <input className="input-base" placeholder="Key" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
          <input className="input-base" placeholder="Value" value={secretValue} onChange={e => setSecretValue(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-secondary" onClick={saveSecret}>Store Secret</button>
          <button className="btn-secondary" onClick={removeSecret}>Delete Secret Key</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Scopes: {(secretsScopes || []).map(s => `${s.scope}(${s.count})`).join(', ') || 'none'}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px' }}>
        {saving ? <><RefreshCw size={14} className="spin" /> Saving…</> : <><Save size={14} /> Save Settings</>}
      </button>
    </div>
  );
}
