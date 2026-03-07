import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import LastUpdated from '../LastUpdated';

export default function Policies({ data, lastUpdated, toast }) {
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiGet('/api/policies');
        setPolicies(result);
      } catch (e) {
        toast?.(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rules = policies?.rules || [];

  if (loading) {
    return <div className="fade-in" style={{ textAlign: 'center', padding: 60, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>LOADING_POLICIES...</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>GOVERNANCE POLICIES</h2>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {rules.length} RULE{rules.length !== 1 ? 'S' : ''} ACTIVE
          </div>
        </div>
        <LastUpdated ts={lastUpdated} />
      </div>

      {rules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>&#128274;</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>No policies configured</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>POLICIES.json is empty or not yet created.</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', background: '#050505' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['RULE ID', 'ACTION PATTERN', 'AGENTS', 'APPROVAL', 'DENY', 'REASON'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 9, color: 'var(--muted)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => {
                const isDeny = !!rule.deny;
                const needsApproval = !!rule.requiresApproval;
                return (
                  <tr key={rule.id || i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{rule.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rule.actionPattern}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(rule.allowedAgents || ['*']).map(a => (
                          <span key={a} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(0,240,255,0.05)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 2 }}>{a}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: needsApproval ? 'var(--amber)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {needsApproval ? 'REQUIRED' : 'NO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: isDeny ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                        {isDeny ? 'DENY' : 'ALLOW'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)' }}>{rule.reason || '\u2014'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
