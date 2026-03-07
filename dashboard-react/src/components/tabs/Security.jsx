import { Shield, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

function SecItem({ label, value, status }) {
  const color = status === 'ok' ? 'var(--mint)' : status === 'warn' ? 'var(--amber)' : status === 'error' ? 'var(--red)' : 'var(--text-dim)';
  const Icon = status === 'ok' ? CheckCircle2 : status === 'error' ? AlertTriangle : null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={13} color={color} />}
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      </div>
    </div>
  );
}

export default function Security({ data }) {
  const { security_status = {} } = data || {};
  const ss = security_status;

  const overallOk = ss.gateway_auth && ss.csrf_enabled && !ss.risky_permissions;
  const overallColor = overallOk ? 'var(--mint)' : 'var(--amber)';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Security Status</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>System security posture overview</p>
      </div>

      {/* Overall Posture */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '24px', borderRadius: 16,
        background: overallOk ? '#ECFDF5' : '#FFFBEB',
        border: `1px solid ${overallOk ? '#D1FAE5' : '#FEF3C7'}`,
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: overallOk ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={26} color={overallColor} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: overallColor }}>{overallOk ? 'Secure' : 'Review Recommended'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {overallOk ? 'All security checks passing' : 'Some security settings need attention'}
          </div>
        </div>
      </div>

      {/* Details */}
      {Object.keys(ss).length > 0 ? (
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 8 }}>Security Checks</h2>
          {ss.gateway_auth !== undefined && <SecItem label="Gateway Authentication" value={ss.gateway_auth ? 'Enabled' : 'Disabled'} status={ss.gateway_auth ? 'ok' : 'error'} />}
          {ss.csrf_enabled !== undefined && <SecItem label="CSRF Protection" value={ss.csrf_enabled ? 'Enabled' : 'Disabled'} status={ss.csrf_enabled ? 'ok' : 'error'} />}
          {ss.rate_limiting !== undefined && <SecItem label="Rate Limiting" value={ss.rate_limiting ? 'Active' : 'Off'} status={ss.rate_limiting ? 'ok' : 'warn'} />}
          {ss.risky_permissions !== undefined && <SecItem label="Risky Permissions" value={ss.risky_permissions ? 'Detected' : 'None'} status={ss.risky_permissions ? 'error' : 'ok'} />}
          {ss.audit_log !== undefined && <SecItem label="Audit Logging" value={ss.audit_log ? 'Enabled' : 'Disabled'} status={ss.audit_log ? 'ok' : 'warn'} />}
          {ss.tls !== undefined && <SecItem label="TLS" value={ss.tls ? 'Enabled' : 'Not detected'} status={ss.tls ? 'ok' : 'warn'} />}
          {Object.entries(ss).filter(([k]) => !['gateway_auth', 'csrf_enabled', 'rate_limiting', 'risky_permissions', 'audit_log', 'tls'].includes(k)).map(([k, v]) => (
            <SecItem key={k} label={k.replace(/_/g, ' ')} value={String(v)} status={typeof v === 'boolean' ? (v ? 'ok' : 'warn') : 'ok'} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 13 }}>
          No security data available. Enable security monitoring in your workspace.
        </div>
      )}
    </div>
  );
}
