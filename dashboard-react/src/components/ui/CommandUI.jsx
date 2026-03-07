export function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}

export function EmptyState({ title, body, action = null }) {
  return (
    <div className="empty-state">
      <div className="empty-state-kicker">No signal</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function MetricCard({ eyebrow, value, label, tone = 'accent', footer = null }) {
  return (
    <section className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-eyebrow">{eyebrow}</div>
      <div className="metric-card-value">{value}</div>
      <div className="metric-card-label">{label}</div>
      {footer ? <div className="metric-card-footer">{footer}</div> : null}
    </section>
  );
}

export function Panel({ title, subtitle, aside = null, children, className = '' }) {
  return (
    <section className={`surface-card panel-card ${className}`.trim()}>
      <header className="panel-header">
        <div>
          <div className="panel-title">{title}</div>
          {subtitle ? <div className="panel-subtitle">{subtitle}</div> : null}
        </div>
        {aside}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function KeyValueList({ items }) {
  return (
    <div className="kv-list">
      {items.map((item) => (
        <div className="kv-row" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
