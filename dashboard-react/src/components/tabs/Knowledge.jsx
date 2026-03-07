import { useState, useMemo } from 'react';
import { apiPost, apiDelete } from '../../lib/api';
import LastUpdated from '../LastUpdated';

export default function Knowledge({ data, lastUpdated, toast }) {
  const { shared_knowledge: knowledge = [], agents = [] } = data || {};
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newEntry.content.trim()) return;
    setSaving(true);
    try {
      const payload = { ...newEntry, tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      await apiPost('/api/knowledge', payload);
      toast?.('Neural integration successful', 'success');
      setShowNew(false);
      setNewEntry({ title: '', content: '', category: 'general', tags: '' });
    } catch (e) { toast?.(e.message, 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Purge this neural entry?')) return;
    try {
      await apiDelete(`/api/knowledge/${id}`);
      toast?.('Entry purged from archive', 'success');
    } catch (e) { toast?.(e.message, 'error'); }
  };

  const categories = useMemo(() => {
    const cats = new Set(knowledge.map(e => e.category || 'general'));
    return ['all', ...Array.from(cats).sort()];
  }, [knowledge]);

  const filtered = useMemo(() => {
    return knowledge.filter(e => {
      const matchCat = category === 'all' || (e.category || 'general') === category;
      const q = search.toLowerCase();
      const matchSearch = !q || (e.content || e.summary || '').toLowerCase().includes(q)
        || (e.title || '').toLowerCase().includes(q)
        || (e.tags || []).some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [knowledge, search, category]);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Header / Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="input-base" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="QUERY NEURAL ARCHIVE..."
          style={{ flex: 1, minWidth: 260, background: 'rgba(0,0,0,0.2)', height: 38 }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              background: category === c ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${category === c ? 'rgba(0,240,255,0.4)' : 'var(--border)'}`,
              color: category === c ? 'var(--cyan)' : 'var(--muted)',
              padding: '6px 14px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s'
            }}>{c}</button>
          ))}
        </div>
        <button className="btn-primary" style={{ height: 38 }} onClick={() => setShowNew(v => !v)}>+ NEW ARCHIVE ENTRY</button>
        <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      {showNew && (
        <div className="card shadow-glow" style={{ display: 'grid', gap: 10, border: '1px solid var(--border-h)' }}>
          <div className="section-title">INTEGRATE NEW NEURAL NODE</div>
          <input className="input-base" placeholder="ENTRY TITLE (OPTIONAL)" value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
          <textarea className="input-base" placeholder="CORE CONTENT / INSIGHT *" value={newEntry.content} onChange={e => setNewEntry(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 100, resize: 'vertical', fontFamily: 'JetBrains Mono, monospace' }} maxLength={5000} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input-base" placeholder="CATEGORY" value={newEntry.category} onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))} style={{ flex: 1 }} />
            <input className="input-base" placeholder="TAGS (SIGMA, DELTA...)" value={newEntry.tags} onChange={e => setNewEntry(p => ({ ...p, tags: e.target.value }))} style={{ flex: 2 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !newEntry.content.trim()}>{saving ? 'PROCESSING...' : 'INITIALIZE UPLOAD'}</button>
            <button className="input-base" style={{ cursor: 'pointer', border: '1px solid transparent' }} onClick={() => setShowNew(false)}>ABORT</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>
        INDEXED: {filtered.length} / {knowledge.length} NODES
        {knowledge.length === 0 && ' | SYSTEM SYMBOLIC SYNTHESIS PENDING'}
      </div>

      {/* Entries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {filtered.map((entry, i) => {
          const agent = agents.find(a => a.id === entry.added_by || a.id === entry.author);
          const confidence = entry.confidence ?? 0.85;
          return (
            <div key={entry.id || i} className="card fade-in" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="badge badge-active" style={{ fontSize: 8 }}>{entry.category || 'GENERAL'}</span>
                    {entry.title && <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.01em' }}>{entry.title}</div>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                    {entry.content || entry.summary || entry.insight || '—'}
                  </div>
                </div>
                {entry.id && <button className="btn-danger" style={{ opacity: 0.3 }} onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>×</button>}
              </div>

              {entry.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 8px', background: 'rgba(181, 53, 255, 0.03)',
                      color: 'var(--purple)', border: '1px solid rgba(181, 53, 255, 0.15)', borderRadius: 4,
                      textTransform: 'uppercase'
                    }}>{t}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>AUTHOR:</span><span style={{ color: 'var(--cyan)' }}>{agent?.name.toUpperCase() || 'SYSTEM'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SIG:</span><span>{entry.source_task || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'var(--muted)' }}>
                    <span>CONFIDENCE</span>
                    <span style={{ color: confidence > 0.9 ? 'var(--green)' : 'var(--amber)' }}>{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${confidence * 100}%`,
                      background: confidence > 0.9 ? 'var(--green)' : 'var(--amber)',
                      boxShadow: confidence > 0.9 ? '0 0 8px var(--green)' : '0 0 6px var(--amber)'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
