export default function LastUpdated({ ts, count }) {
  if (!ts) return null;
  return (
    <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
      {count != null && <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>#{count}</span>}
      Updated {ts.toLocaleTimeString()}
    </span>
  );
}
