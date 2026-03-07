import { useState, useEffect } from 'react';

export default function Settings({ data, toast }) {
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csrf, setCsrf] = useState(null);

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(d => setCsrf(d.csrfToken))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (data?.project_defaults) {
      setDefaults(data.project_defaults);
    }
  }, [data]);

  const handleChange = (key, value) => {
    setDefaults(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!csrf || !defaults) return;
    setSaving(true);
    try {
      const res = await fetch('/api/projects/defaults', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-agi-farm-csrf': csrf },
        body: JSON.stringify(defaults),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        toast?.('Defaults saved', 'success');
      } else {
        toast?.(result.error || 'Save failed', 'error');
      }
    } catch (err) {
      toast?.(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!defaults) {
    return (
      <div className="card">
        <h3>Project Defaults</h3>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 12px 0' }}>Project Defaults</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 16px 0' }}>
          Configure default behavior for new projects created via intake or API.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <strong>Auto Project Channel</strong>
                <p style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: 12 }}>
                  Automatically create a dedicated project channel for each new project.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={defaults.auto_project_channel === true}
                  onChange={(e) => handleChange('auto_project_channel', e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ color: defaults.auto_project_channel ? 'var(--cyan)' : 'var(--muted)' }}>
                  {defaults.auto_project_channel ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Default Execution Path</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: 12 }}>
                Choose how new projects are executed by default.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: defaults.execution_path === 'agi-farm-first' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${defaults.execution_path === 'agi-farm-first' ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                flex: 1,
              }}>
                <input
                  type="radio"
                  name="execution_path"
                  value="agi-farm-first"
                  checked={defaults.execution_path === 'agi-farm-first'}
                  onChange={() => handleChange('execution_path', 'agi-farm-first')}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>AGI-Farm First</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>Route to multi-agent team by default</div>
                </div>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: defaults.execution_path === 'direct-first' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${defaults.execution_path === 'direct-first' ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                flex: 1,
              }}>
                <input
                  type="radio"
                  name="execution_path"
                  value="direct-first"
                  checked={defaults.execution_path === 'direct-first'}
                  onChange={() => handleChange('execution_path', 'direct-first')}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Direct First</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>Execute directly without team routing</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? 'var(--muted)' : 'var(--cyan)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
}