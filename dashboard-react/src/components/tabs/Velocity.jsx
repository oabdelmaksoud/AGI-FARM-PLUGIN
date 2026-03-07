import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import LastUpdated from '../LastUpdated';

const COLORS = ['#25aff4', '#00ff9d', '#b535ff', '#ff2a55', '#ffb800', '#ff6d00', '#1de9b6'];

const tooltipStyle = {
  background: '#050505',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '2px',
  fontSize: '10px',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
  padding: '8px 12px'
};

export default function Velocity({ data, lastUpdated }) {
  const { velocity = {}, tasks = [], agents = [] } = data || {};
  const daily = velocity?.daily || [];
  const summary = velocity?.weekly_summary || {};
  const metrics = velocity?.metrics || {};

  const barData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const row = daily.find(r => r.date === dateStr) || {};
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        completed: row.tasks_completed || 0,
        failed: row.tasks_failed || 0,
        quality: row.avg_quality ?? 0,
      });
    }
    return days;
  })();

  const typeCounts = {};
  tasks.forEach(t => { const ty = t.type || 'other'; typeCounts[ty] = (typeCounts[ty] || 0) + 1; });
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const successRate = summary.tasks_completed > 0
    ? (summary.tasks_completed / (summary.tasks_completed + summary.tasks_failed)) * 100
    : 0;

  const agentWorkloadData = agents
    .filter(a => {
      const ats = tasks.filter(t => t.assigned_to === a.id);
      return ats.length > 0 || a.tasks_completed > 0;
    })
    .map(a => {
      const ats = tasks.filter(t => t.assigned_to === a.id);
      return {
        name: (a.name || a.id).toUpperCase().slice(0, 12),
        emoji: a.emoji || '🤖',
        done: ats.filter(t => t.status === 'complete').length,
        active: ats.filter(t => t.status === 'in-progress').length,
        blocked: ats.filter(t => ['blocked', 'needs_human_decision'].includes(t.status)).length,
        failed: ats.filter(t => t.status === 'failed').length,
        quality: a.quality_score || 0,
        total: a.tasks_completed || 0,
      };
    })
    .sort((a, b) => (b.done + b.active) - (a.done + a.active));

  const scatterData = agents
    .filter(a => a.tasks_completed > 0 || a.quality_score > 0)
    .map(a => ({
      x: a.tasks_completed || 0,
      y: a.quality_score || 0,
      name: a.name,
      emoji: a.emoji || '🤖',
      z: 40,
    }));

  const topAgents = [...agents]
    .sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0))
    .slice(0, 5);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 24 }}>
      {/* High-Contrast Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { l: 'THROUGHPUT', v: summary.tasks_completed ?? 0, c: 'var(--mint)' },
          { l: 'FAILURES', v: summary.tasks_failed ?? 0, c: 'var(--red)' },
          { l: 'AVG_QUALITY', v: (summary.avg_quality ?? 0).toFixed(2), c: 'var(--amber)' },
          { l: 'SLA_VIOLATIONS', v: summary.sla_breaches ?? 0, c: 'var(--purple)' },
          { l: 'DAILY_RATE', v: (metrics.throughput_rate_tasks_per_day ?? 0).toFixed(1), c: 'var(--accent)' },
        ].map(m => (
          <div key={m.l} className="card" style={{ padding: '16px' }}>
            <div className="section-title">{m.l}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: m.c, fontFamily: 'var(--font-mono)' }}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* Primary Efficiency Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="section-title">NEURAL THROUGHPUT (7D WINDOW)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '9px', fontFamily: 'var(--font-mono)', paddingBottom: '16px' }} />
              <Bar dataKey="completed" fill="var(--mint)" name="COMPLETED" radius={[2, 2, 0, 0]} barSize={20} />
              <Bar dataKey="failed" fill="var(--red)" name="FAILED" radius={[2, 2, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-title">MISSION SUCCESS INDEX</div>
          <div style={{ position: 'relative', marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: 'Success', value: successRate }, { name: 'Remaining', value: 100 - successRate }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  startAngle={225} endAngle={-45} paddingAngle={0} dataKey="value"
                >
                  <Cell fill="var(--mint)" />
                  <Cell fill="rgba(255,255,255,0.03)" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{successRate.toFixed(0)}%</div>
              <div style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: 800 }}>SUCCESS_RATE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Workload & Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="section-title">AGENT WORKLOAD DISTRIBUTION // STACKED</div>
          <ResponsiveContainer width="100%" height={Math.max(200, agentWorkloadData.length * 40)}>
            <BarChart data={agentWorkloadData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: 9, fontFamily: 'var(--font-mono)', paddingBottom: '16px' }} />
              <Bar dataKey="done" stackId="a" fill="var(--mint)" name="DONE" barSize={12} />
              <Bar dataKey="active" stackId="a" fill="var(--accent)" name="ACTIVE" />
              <Bar dataKey="blocked" stackId="a" fill="var(--purple)" name="BLOCKED" />
              <Bar dataKey="failed" stackId="a" fill="var(--red)" name="FAILED" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">ELITE NODE INDEX</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
            {topAgents.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: '18px', fontSize: '11px', fontWeight: 800, color: i === 0 ? 'var(--amber)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  {i + 1}.
                </div>
                <div style={{ fontSize: '18px' }}>{a.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{(a.name || a.id || '').toUpperCase()}</div>
                  <div style={{ fontSize: '8px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{a.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--mint)' }}>{a.tasks_completed}</div>
                  <div style={{ fontSize: '7px', color: 'var(--muted)', fontWeight: 800 }}>CYCLES</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Density Scatter Chart */}
      <div className="card">
        <div className="section-title">THROUGHPUT VS QUALITY // SCATTER_MATRIX</div>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" dataKey="x" name="CYCLES" axisLine={false} tickLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} />
            <YAxis type="number" dataKey="y" name="QUALITY" domain={[0, 5]} axisLine={false} tickLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} />
            <ZAxis type="number" dataKey="z" range={[50, 50]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={scatterData} fill="var(--accent)" shape={(props) => {
              const { cx, cy, payload } = props;
              return (
                <g>
                  <rect x={cx - 10} y={cy - 10} width={20} height={20} fill="rgba(37, 175, 244, 0.1)" stroke="var(--accent)" strokeWidth={1} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#fff">{payload.emoji}</text>
                </g>
              );
            }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LastUpdated ts={lastUpdated} />
      </div>
    </div>
  );
}
