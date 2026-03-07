import { useState } from 'react';
import { BookOpen, Search, Tag, Clock } from 'lucide-react';

function relTime(iso) {
  if (!iso) return '';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return ''; }
}

function KnowledgeCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
      overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}
      onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = ''}
    >
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '16px 18px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1, paddingRight: 10 }}>
            {item.title || item.key || 'Untitled'}
          </div>
          {item.category && (
            <span style={{ background: '#EEF2FF', color: 'var(--accent)', borderRadius: 999, padding: '2px 10px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
              {item.category}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: expanded ? 'none' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.content || item.value || item.summary || ''}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
          {item.agent && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{item.agent}</span>}
          {item.timestamp && <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{relTime(item.timestamp)}</span>}
          {item.tags?.map(t => (
            <span key={t} style={{ background: '#F1F5F9', color: 'var(--muted)', borderRadius: 999, padding: '1px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Tag size={9} />{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Knowledge({ data }) {
  const { shared_knowledge = [], knowledge = [] } = data || {};
  const [search, setSearch] = useState('');
  const items = (shared_knowledge.length > 0 ? shared_knowledge : knowledge);
  const filtered = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.title || item.key || '').toLowerCase().includes(q) ||
      (item.content || item.summary || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Knowledge Base</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{items.length} shared knowledge entries</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input className="input-base" placeholder="Search knowledge…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 240 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <BookOpen size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>{items.length === 0 ? 'No knowledge entries yet' : 'No results found'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((item, i) => <KnowledgeCard key={item.id || item.key || i} item={item} />)}
        </div>
      )}
    </div>
  );
}
