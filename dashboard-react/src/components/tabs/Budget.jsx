import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

function QuotaCard({ label, spent, limit, threshold }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const isOver = pct >= threshold;
  const barColor = pct > threshold ? 'var(--red)' : pct > threshold * 0.8 ? 'var(--amber)' : 'var(--mint)';
  const bgColor = pct > threshold ? '#FEF2F2' : pct > threshold * 0.5 ? '#FFFBEB' : '#F0FDF4';
  const borderColor = pct > threshold ? '#FEE2E2' : pct > threshold * 0.5 ? '#FEF3C7' : '#D1FAE5';

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 16, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
            ${spent.toFixed(2)} <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/ ${limit}</span>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: barColor }}>{pct.toFixed(0)}%</div>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="progress-track" style={{ height: 10, position: 'relative' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: barColor, height: '100%', borderRadius: 8 }} />
          {/* Threshold marker */}
          <div style={{
            position: 'absolute', top: -6, bottom: -6, left: `${threshold}%`,
            width: 2, background: 'var(--amber)', borderRadius: 2,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>
          <span>Utilization {pct.toFixed(1)}%</span>
          <span style={{ color: 'var(--amber)' }}>Alert at {threshold}%</span>
        </div>
      </div>

      {isOver && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#FEE2E2', borderRadius: 8 }}>
          <AlertTriangle size={12} color="var(--red)" />
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>Budget threshold exceeded</span>
        </div>
      )}
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
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No data yet</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Spend', 'Calls'].map(h => (
                <th key={h} style={{ textAlign: h === 'Name' ? 'left' : 'right', padding: '8px 16px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([name, v], i) => {
              const spent = typeof v === 'object' ? (v.spent ?? 0) : v;
              const calls = typeof v === 'object' ? (v.calls ?? '—') : '—';
              return (
                <tr key={name} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text)' }}>{name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--mint)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${spent.toFixed(3)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{calls}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Budget({ data }) {
  const { budget = {} } = data || {};
  const limits = budget.limits || {};
  const current = budget.current || {};
  const alerts = budget.alerts || {};
  const byAgent = budget.per_agent || {};
  const byModel = budget.per_model || {};

  const periods = [
    { label: 'Daily', spent: current.daily_usd ?? 0, limit: limits.daily_usd ?? 0, threshold: alerts.daily_threshold_pct ?? 70 },
    { label: 'Weekly', spent: current.weekly_usd ?? 0, limit: limits.weekly_usd ?? 0, threshold: alerts.weekly_threshold_pct ?? 70 },
    { label: 'Monthly', spent: current.monthly_usd ?? 0, limit: limits.monthly_usd ?? 0, threshold: 80 },
  ];

  const agentChartData = Object.entries(byAgent).map(([name, v]) => ({
    name, spent: typeof v === 'object' ? (v.spent ?? 0) : v,
  })).sort((a, b) => b.spent - a.spent).slice(0, 10);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Budget & Spend</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Resource consumption across daily, weekly, and monthly quotas</p>
      </div>

      {budget.notes && (
        <div style={{ padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FED7AA', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>Budget Alert</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{budget.notes}</div>
          </div>
        </div>
      )}

      {/* Quota Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {periods.map(p => <QuotaCard key={p.label} {...p} />)}
      </div>

      {/* Spend Chart */}
      {agentChartData.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={16} color="var(--accent)" />
            <h2 style={{ fontSize: 16, margin: 0 }}>Spend by Agent</h2>
          </div>
          <div style={{ height: Math.max(200, agentChartData.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} layout="vertical" margin={{ left: 120, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--text-dim)', fontSize: 12, fontWeight: 500 }} width={110} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={v => [`$${v.toFixed(3)}`, 'Spend']}
                />
                <Bar dataKey="spent" radius={[0, 6, 6, 0]} barSize={14}>
                  {agentChartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${220 + i * 25}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Breakdown Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <BreakdownTable title="Spend by Agent" data={byAgent} />
        <BreakdownTable title="Spend by Model" data={byModel} />
      </div>
    </div>
  );
}
