import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import LastUpdated from '../LastUpdated';

const COLORS = ['#00f0ff', '#b535ff', '#00ff9d', '#ff2a55', '#ffb800', '#ff6d00', '#1de9b6'];

const tooltipStyle = {
  background: 'rgba(7, 7, 12, 0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8, fontSize: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  color: '#fff', fontFamily: 'JetBrains Mono, monospace'
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

  // Per-agent workload breakdown (stacked bar)
  const agentWorkloadData = agents
    .filter(a => {
      const ats = tasks.filter(t => t.assigned_to === a.id);
      return ats.length > 0 || a.tasks_completed > 0;
    })
    .map(a => {
      const ats = tasks.filter(t => t.assigned_to === a.id);
      return {
        name: (a.name || a.id).toUpperCase().slice(0, 10),
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

  // Scatter data: throughput vs quality
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
    .slice(0, 6);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {[
          ['THROUGHPUT', summary.tasks_completed ?? 0, 'var(--green)'],
          ['FAILURE PKT', summary.tasks_failed ?? 0, 'var(--red)'],
          ['AVG QUALITY', (summary.avg_quality ?? 0).toFixed(2), 'var(--amber)'],
          ['SLA BREACH', summary.sla_breaches ?? 0, 'var(--purple)'],
          ['VELOCITY/DAY', (metrics.throughput_rate_tasks_per_day ?? 0).toFixed(1), 'var(--cyan)'],
        ].map(([l, v, c]) => (
          <div key={l} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div className="section-title" style={{ fontSize: 8, letterSpacing: '0.15em' }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c, fontFamily: 'Rajdhani, sans-serif' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Throughput + Success Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <span className="section-title" style={{ marginBottom: 0 }}>NEURAL THROUGHPUT (7D)</span>
            <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              <Bar dataKey="completed" fill="url(#colorComplete)" name="COMPLETED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="url(#colorFailed)" name="FAILED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center', flex: 1 }}>
            <div className="section-title">MISSION SUCCESS RATE</div>
            <div style={{ position: 'relative', marginTop: 10 }}>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={[{ name: 'Success', value: successRate }, { name: 'Remaining', value: 100 - successRate }]}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={70}
                    startAngle={225} endAngle={-45} paddingAngle={0} dataKey="value"
                  >
                    <Cell fill="url(#gaugeGradient)" />
                    <Cell fill="rgba(255,255,255,0.03)" stroke="none" />
                  </Pie>
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--cyan)" />
                      <stop offset="100%" stopColor="var(--green)" />
                    </linearGradient>
                  </defs>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: 'Rajdhani, sans-serif' }}>{successRate.toFixed(0)}%</div>
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="section-title">WORKLOAD DISTRIBUTION</div>
            {pieData.length === 0
              ? <div style={{ color: 'var(--muted)', fontSize: 10, textAlign: 'center', padding: 20 }}>NO DATA</div>
              : <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" nameKey="name" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      {/* === PER-AGENT WORKLOAD BREAKDOWN === */}
      {agentWorkloadData.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>AGENT WORKLOAD BREAKDOWN // STACKED_CYCLES</div>
          <ResponsiveContainer width="100%" height={Math.max(140, agentWorkloadData.length * 38)}>
            <BarChart data={agentWorkloadData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                tick={{ fontSize: 9, fill: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              <Bar dataKey="done" stackId="a" fill="var(--green)" name="DONE" barSize={14} />
              <Bar dataKey="active" stackId="a" fill="var(--cyan)" name="ACTIVE" />
              <Bar dataKey="blocked" stackId="a" fill="var(--purple)" name="BLOCKED/HITL" />
              <Bar dataKey="failed" stackId="a" fill="var(--red)" name="FAILED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quality Chart + Agent Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-title">NEURAL QUALITY GRADIENT (7D)</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--amber)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--amber)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="quality" stroke="var(--amber)" strokeWidth={3} fillOpacity={1} fill="url(#colorQual)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Agent Leaderboard */}
        <div className="card">
          <div className="section-title">ELITE NODES // PERFORMANCE INDEX</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 10 }}>
            {topAgents.map((a, i) => {
              const total = (a.tasks_completed || 0) + (a.tasks_failed || 0);
              const failRate = total > 0 ? ((a.tasks_failed || 0) / total * 100).toFixed(0) : 0;
              const hbAge = a.heartbeat_age_minutes ?? 999;
              const hbColor = hbAge < 5 ? 'var(--green)' : hbAge < 15 ? 'var(--amber)' : 'var(--red)';
              const rankColor = i === 0 ? 'var(--amber)' : i === 1 ? 'rgba(255,255,255,0.5)' : i === 2 ? '#b87333' : 'var(--muted)';
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: rankColor, width: 20, fontFamily: 'Rajdhani, sans-serif' }}>
                    {i === 0 ? '👑' : `0${i + 1}`}
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{a.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{a.name}</div>
                    <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {a.role?.toUpperCase() || 'AGENT'} // FAIL: {failRate}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 36 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif' }}>{a.tasks_completed}</div>
                    <div style={{ fontSize: 7, color: 'var(--muted)' }}>CYCLES</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 36 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--amber)', fontFamily: 'Rajdhani, sans-serif' }}>{(a.quality_score || 0).toFixed(1)}</div>
                    <div style={{ fontSize: 7, color: 'var(--muted)' }}>QUAL</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: hbColor, boxShadow: `0 0 6px ${hbColor}` }} title={`Heartbeat: ${hbAge}m ago`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Throughput vs Quality Scatter */}
      {scatterData.length > 1 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>THROUGHPUT vs QUALITY // AGENT_PERFORMANCE_SCATTER</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>
            X: tasks completed · Y: quality score · High-right = elite performers
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis type="number" dataKey="x" name="Throughput" axisLine={false} tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                label={{ value: 'TASKS DONE', position: 'insideBottomRight', offset: -10, fill: 'var(--muted)', fontSize: 8 }} />
              <YAxis type="number" dataKey="y" name="Quality" domain={[0, 5]} axisLine={false} tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                label={{ value: 'QUALITY', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 8 }} />
              <ZAxis type="number" dataKey="z" range={[60, 200]} />
              <Tooltip
                contentStyle={tooltipStyle}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{d?.emoji} {d?.name}</div>
                      <div style={{ color: 'var(--cyan)' }}>CYCLES: {d?.x}</div>
                      <div style={{ color: 'var(--amber)' }}>QUALITY: {d?.y.toFixed(2)}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="var(--cyan)" opacity={0.8}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill="rgba(0,240,255,0.15)" stroke="var(--cyan)" strokeWidth={1.5} />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="white">{payload.emoji}</text>
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
