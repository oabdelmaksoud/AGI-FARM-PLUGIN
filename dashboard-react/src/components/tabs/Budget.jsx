import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LastUpdated from '../LastUpdated';

export default function Budget({ data, lastUpdated }) {
  const { budget = {} } = data || {};
  const limits = budget.limits || {};
  const current = budget.current || {};
  const alerts = budget.alerts || {};
  const byAgent = budget.per_agent || {};
  const byModel = budget.per_model || {};
  const notes = budget.notes || null;
  const lastUpdatedData = budget.last_updated || null;

  const periods = [
    { label: 'Daily', spent: current.daily_usd ?? 0, limit: limits.daily_usd ?? 0, threshold: alerts.daily_threshold_pct ?? 70 },
    { label: 'Weekly', spent: current.weekly_usd ?? 0, limit: limits.weekly_usd ?? 0, threshold: alerts.weekly_threshold_pct ?? 70 },
    { label: 'Monthly', spent: current.monthly_usd ?? 0, limit: limits.monthly_usd ?? 0, threshold: 80 },
  ];

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Notes / Alerts Banner */}
      {notes && (
        <div className="card" style={{
          padding: '12px 20px', background: 'var(--amber-dim)', border: '1px solid var(--amber)',
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div className="section-title" style={{ fontSize: 9, color: 'var(--amber)', marginBottom: 2 }}>Budget Alert</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{notes}</div>
          </div>
          {lastUpdatedData && (
            <div className="mono" style={{ textAlign: 'right', fontSize: 9, color: 'var(--text-secondary)' }}>
              Last sync: {new Date(lastUpdatedData).toLocaleString()}
            </div>
          )}
          <div style={{ marginLeft: 16 }}><LastUpdated ts={lastUpdated} /></div>
        </div>
      )}

      {/* Quota Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {periods.map(({ label, spent, limit, threshold }) => {
          const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const isOver = pct >= threshold;
          const color = pct > threshold ? 'var(--red)' : pct > threshold * 0.8 ? 'var(--amber)' : 'var(--cyan)';

          return (
            <div key={label} className="card" style={{ border: `1px solid ${isOver ? 'var(--red)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <span className="section-title" style={{ marginBottom: 0 }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color }}>
                    ${spent.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>/ ${limit}</span>
                  </div>
                </div>
              </div>

              <div className="progress-track" style={{ height: 10, position: 'relative' }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`, background: color
                }} />
                {/* Threshold line */}
                <div style={{
                  position: 'absolute', top: -4, bottom: -4, left: `${threshold}%`,
                  width: 2, background: 'var(--amber)', opacity: 0.8
                }} />
              </div>

              <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 9, fontWeight: 700 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Utilization: {pct.toFixed(1)}%</span>
                <span style={{ color: 'var(--amber)' }}>Threshold: {threshold}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Chart */}
      {Object.keys(byAgent).length > 0 && (
        <div className="card">
          <div className="section-title">Cost by Agent</div>
          <div style={{ height: Math.max(240, Object.keys(byAgent).length * 40), marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(byAgent).map(([name, v]) => ({
                name, spent: typeof v === 'object' ? (v.spent ?? 0) : v
              })).sort((a, b) => b.spent - a.spent)} layout="vertical" margin={{ left: 100, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} width={90} />
                <Tooltip
                  cursor={{ fill: 'var(--bg3)' }}
                  contentStyle={{ background: '#080810', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`$${v.toFixed(3)}`, 'Spent']}
                />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={16}>
                  {Object.entries(byAgent).map(([name], i) => (
                    <Cell key={name} fill={`hsl(${180 + i * 25}, 100%, 50%)`} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tables Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BreakdownTable title="By Agent" data={byAgent} />
        <BreakdownTable title="By Model" data={byModel} />
      </div>
    </div>
  );
}

function BreakdownTable({ title, data }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => {
    const sa = typeof a === 'object' ? (a.spent ?? 0) : a;
    const sb = typeof b === 'object' ? (b.spent ?? 0) : b;
    return sb - sa;
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ background: 'var(--bg3)', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <table className="data-table" style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Spent', 'Calls'].map(h => (
                <th key={h} style={{ textAlign: h === 'Name' ? 'left' : 'right', padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([name, v]) => {
              const spent = typeof v === 'object' ? (v.spent ?? 0) : v;
              const calls = typeof v === 'object' ? (v.calls ?? '--') : '--';
              return (
                <tr key={name} style={{ borderBottom: '1px solid var(--border)' }} className="task-row-hover">
                  <td style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{name}</td>
                  <td className="mono" style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cyan)', fontWeight: 800 }}>${spent.toFixed(3)}</td>
                  <td className="mono" style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 10 }}>{calls}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
