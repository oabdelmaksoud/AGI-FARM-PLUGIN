import LastUpdated from '../LastUpdated';

function Breakdown({ title, map }) {
  const entries = Object.entries(map || {}).sort(([, a], [, b]) => (b?.spent || 0) - (a?.spent || 0));
  return (
    <div className="card">
      <div className="section-title">{title}</div>
      {entries.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 11 }}>No usage yet</div>}
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: 'flex', gap: 10, fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          <span style={{ flex: 1 }}>{key}</span>
          <span style={{ color: 'var(--cyan)' }}>${(value?.spent || 0).toFixed(4)}</span>
          <span style={{ color: 'var(--muted)' }}>{value?.calls || 0} calls</span>
        </div>
      ))}
    </div>
  );
}

export default function Usage({ data, lastUpdated }) {
  const { usage = {}, featureFlags = {} } = data;
  const totals = usage.totals || {};

  if (!featureFlags.metering) {
    return <div className="card">Usage feature is disabled. Enable `featureMetering` in plugin config.</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <Stat label="Total Cost" value={`$${(totals.estimatedCostUsd || 0).toFixed(4)}`} color="var(--cyan)" />
        <Stat label="Tokens In" value={totals.tokensIn || 0} color="var(--muted)" />
        <Stat label="Tokens Out" value={totals.tokensOut || 0} color="var(--muted)" />
        <Stat label="Duration" value={`${Math.round((totals.durationMs || 0) / 1000)}s`} color="var(--muted)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Metering</div>
        <LastUpdated ts={lastUpdated} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Breakdown title="By Agent" map={usage.perAgent || {}} />
        <Breakdown title="By Model" map={usage.perModel || {}} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="section-title">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
