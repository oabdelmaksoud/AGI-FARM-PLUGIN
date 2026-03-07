import { Package } from 'lucide-react';

export default function Skills({ data }) {
  const { skills = [] } = data || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Skills & Integrations</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{skills.length} agent skills registered</p>
      </div>
      {skills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <Package size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No skills registered</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Install OpenClaw Skill packages and configure them in your workspace</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {skills.map((skill, i) => (
            <div key={skill.id || i} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {skill.icon || '🔧'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{skill.name || skill.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>v{skill.version || '1.0.0'}</div>
                </div>
                <span style={{
                  background: skill.enabled !== false ? '#ECFDF5' : '#F8FAFC',
                  color: skill.enabled !== false ? 'var(--mint)' : 'var(--muted)',
                  borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {skill.enabled !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              {skill.description && <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{skill.description}</div>}
              {skill.tools?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {skill.tools.map(t => (
                    <span key={t} style={{ background: '#F1F5F9', color: 'var(--muted)', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
