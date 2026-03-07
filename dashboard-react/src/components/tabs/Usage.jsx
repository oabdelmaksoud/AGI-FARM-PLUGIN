import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Usage({ data }) {
  const { usage = {}, model_usage = {} } = data || {};
  const byModel = usage.by_model || model_usage || {};

  const chartData = Object.entries(byModel).map(([name, v]) => ({
    name,
    tokens: typeof v === 'object' ? (v.tokens ?? v.total_tokens ?? 0) : v,
  })).sort((a, b) => b.tokens - a.tokens);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Model Usage</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Token consumption across models</p>
      </div>
      {chartData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <BarChart2 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No usage data yet</div>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 16 }}>Token Usage by Model</h2>
            <div style={{ height: Math.max(200, chartData.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 140, right: 30, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-dim)', fontWeight: 500 }} width={130} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    formatter={v => [v.toLocaleString(), 'Tokens']} />
                  <Bar dataKey="tokens" radius={[0, 6, 6, 0]} barSize={16}>
                    {chartData.map((_, i) => <Cell key={i} fill={`hsl(${220 + i * 30}, 65%, 55%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: `hsl(${220 + i * 30}, 65%, 45%)` }}>
                  {d.tokens > 1_000_000 ? `${(d.tokens / 1_000_000).toFixed(1)}M` : d.tokens > 1000 ? `${(d.tokens / 1000).toFixed(1)}K` : d.tokens}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>tokens</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
