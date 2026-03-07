import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const SAFETY_COLOR = { low: 'var(--green)', medium: 'var(--amber)', high: 'var(--red)' };

export default function Skills({ data, lastUpdated, toast }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const loadSkills = async () => {
    try {
      const result = await apiGet('/api/skills');
      setSkills(result.skills || []);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  const handleToggle = async (skill) => {
    setToggling(skill.id);
    try {
      const endpoint = skill.enabled ? `/api/skills/${skill.id}/disable` : `/api/skills/${skill.id}/enable`;
      await apiPost(endpoint);
      await loadSkills();
      toast?.(`${skill.name} ${skill.enabled ? 'disabled' : 'enabled'}`, 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return <div className="fade-in" style={{ textAlign: 'center', padding: 60, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>LOADING_SKILLS_REGISTRY...</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>SKILLS REGISTRY</h2>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {skills.filter(s => s.enabled).length}/{skills.length} ACTIVE
          </div>
        </div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {skills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>&#9881;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No skills registered</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>SKILLS_REGISTRY.json is empty.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {skills.map(s => {
            const safetyColor = SAFETY_COLOR[s.safetyProfile] || 'var(--muted)';
            return (
              <div key={s.id} className="card" style={{
                opacity: s.enabled ? 1 : 0.5,
                borderLeft: `3px solid ${s.enabled ? 'var(--cyan)' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s.id} // v{s.version}</div>
                  </div>
                  <button
                    className={s.enabled ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleToggle(s)}
                    disabled={toggling === s.id}
                    style={{ padding: '6px 14px', fontSize: 10 }}
                  >
                    {toggling === s.id ? '...' : s.enabled ? 'DISABLE' : 'ENABLE'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 2, fontWeight: 700, color: safetyColor, background: `${safetyColor}18`, border: `1px solid ${safetyColor}44`, fontFamily: 'var(--font-mono)' }}>
                    SAFETY: {(s.safetyProfile || 'unknown').toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 2, fontWeight: 700, color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                    {s.entrypoint}
                  </span>
                </div>

                {s.intentMatchers?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>INTENT MATCHERS</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.intentMatchers.map(m => (
                        <span key={m} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(0,240,255,0.05)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 2 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {s.stepKinds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>STEP KINDS</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.stepKinds.map(k => (
                        <span key={k} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(181,53,255,0.05)', color: 'var(--purple)', border: '1px solid rgba(181,53,255,0.15)', borderRadius: 2 }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
