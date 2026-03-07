import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

function VelocityCard({ label, value, unit, trend, sub, color }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'var(--mint)' : trend < 0 ? 'var(--red)' : 'var(--muted)';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text)' }}>{value}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginLeft: 4 }}>{unit}</span></div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: trendColor, fontWeight: 600 }}>
          <TrendIcon size={13} /> {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}

export default function Velocity({ data }) {
  const { velocity = {} } = data || {};
  const current = velocity.current || {};
  const history = velocity.history || [];
  const benchmarks = velocity.benchmarks || {};

  const tasksPerDay = current.tasks_per_day ?? 0;
  const successRate = current.success_rate ?? 0;
  const avgCycleTime = current.avg_cycle_time_minutes ?? 0;
  const throughput = current.throughput_per_hour ?? 0;

  const chartData = history.map((h, i) => ({
    ts: h.timestamp ? new Date(h.timestamp).toLocaleDateString() : `Day ${i + 1}`,
    tpd: h.tasks_per_day ?? 0,
    sr: ((h.success_rate ?? 0) * 100).toFixed(1),
    ct: h.avg_cycle_time_minutes ?? 0,
  }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Velocity & Throughput</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Agent performance metrics and trend analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <VelocityCard label="Tasks / Day" value={tasksPerDay.toFixed(1)} color="var(--accent)" />
        <VelocityCard label="Success Rate" value={`${(successRate * 100).toFixed(1)}`} unit="%" color="var(--mint)" />
        <VelocityCard label="Avg Cycle Time" value={avgCycleTime < 60 ? avgCycleTime.toFixed(0) : (avgCycleTime / 60).toFixed(1)} unit={avgCycleTime < 60 ? 'min' : 'hr'} color="var(--amber)" />
        <VelocityCard label="Throughput/hr" value={throughput.toFixed(2)} color="var(--purple)" />
      </div>

      {chartData.length > 1 && (
        <>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Zap size={16} color="var(--accent)" />
              <h2 style={{ fontSize: 15, margin: 0 }}>Task Throughput Trend</h2>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tpdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="ts" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tpd" stroke="var(--accent)" fill="url(#tpdGrad)" strokeWidth={2} name="Tasks/Day" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, margin: 0 }}>Success Rate Trend</h2>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="ts" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} formatter={v => [`${v}%`, 'Success Rate']} />
                  <Line type="monotone" dataKey="sr" stroke="var(--mint)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--mint)' }} name="Success Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {Object.keys(benchmarks).length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 16 }}>Benchmarks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(benchmarks).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{typeof v === 'number' ? v.toFixed(2) : v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
