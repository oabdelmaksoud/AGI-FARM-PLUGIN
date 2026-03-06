export default function Nav({ tabs, active, onChange, badges = {} }) {
  return (
    <nav style={{
      height: '44px', borderBottom: '1px solid var(--border)', background: '#050505',
      display: 'flex', alignItems: 'stretch', padding: '0 24px', gap: 4,
      position: 'sticky', top: '52px', zIndex: 99, overflowX: 'auto',
    }}>
      {tabs.map(tab => {
        const badge = badges[tab];
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px',
              fontSize: '11px', fontWeight: isActive ? 800 : 500,
              color: isActive ? '#fff' : 'var(--muted)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.05em'
            }}
          >
            {tab.toUpperCase()}
            {badge > 0 && (
              <span style={{
                fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '2px',
                background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#000' : 'var(--muted)',
                lineHeight: 1, minWidth: '14px', textAlign: 'center',
                border: isActive ? 'none' : '1px solid var(--border-light)'
              }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
