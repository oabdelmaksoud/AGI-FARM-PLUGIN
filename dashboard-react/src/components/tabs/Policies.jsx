import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function Policies({ data }) {
  const { featureFlags = {} } = data || {};
  const policies = data?.policies || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Policies & Governance</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Feature flags and policy rules governing agent behavior</p>
      </div>

      {/* Feature Flags */}
      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 16 }}>Feature Flags</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {Object.entries(featureFlags).map(([flag, enabled]) => (
            <div key={flag} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: enabled ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${enabled ? '#D1FAE5' : 'var(--border)'}`,
              borderRadius: 10,
            }}>
              {enabled ? <CheckCircle2 size={14} color="var(--mint)" /> : <XCircle size={14} color="var(--muted)" />}
              <span style={{ fontSize: 13, fontWeight: 500, color: enabled ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {flag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Rules */}
      {policies.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="var(--accent)" /> Policy Rules
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {policies.map((policy, i) => (
              <div key={policy.id || i} style={{
                padding: '14px 16px', background: '#F8FAFC', border: '1px solid var(--border)',
                borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{policy.name || policy.id}</div>
                  {policy.description && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{policy.description}</div>}
                </div>
                <span style={{
                  background: policy.enabled !== false ? '#ECFDF5' : '#F8FAFC',
                  color: policy.enabled !== false ? 'var(--mint)' : 'var(--muted)',
                  borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                }}>
                  {policy.enabled !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(featureFlags).length === 0 && policies.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 13 }}>
          No policies or feature flags configured
        </div>
      )}
    </div>
  );
}
