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
      toast('Entry saved successfully', 'success');
      setShowNew(false);
      setNewEntry({ title: '', content: '', category: 'general', tags: '' });
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this knowledge entry?')) return;
    try {
      await apiDelete(`/api/knowledge/${id}`);
      toast('Entry deleted', 'success');
    } catch (e) { toast(e.message, 'error'); }
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
          placeholder="Search knowledge base..."
          style={{ flex: 1, minWidth: 260, height: 38 }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              background: category === c ? 'var(--cyan-dim)' : 'var(--bg3)',
              border: `1px solid ${category === c ? 'rgba(0,240,255,0.4)' : 'var(--border)'}`,
              color: category === c ? 'var(--cyan)' : 'var(--text-secondary)',
              padding: '6px 14px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
              fontWeight: 700, transition: 'all 0.2s'
            }}>{c}</button>
          ))}
        </div>
        <button className="btn-primary" style={{ height: 38 }} onClick={() => setShowNew(v => !v)}>+ New Entry</button>
        <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
      </div>

      {showNew && (
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div className="section-title">New Knowledge Entry</div>
          <input className="input-base" placeholder="Title (optional)" value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
          <textarea className="input-base" placeholder="Content *" value={newEntry.content} onChange={e => setNewEntry(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 100, resize: 'vertical' }} maxLength={5000} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input-base" placeholder="Category" value={newEntry.category} onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))} style={{ flex: 1 }} />
            <input className="input-base" placeholder="Tags (comma-separated)" value={newEntry.tags} onChange={e => setNewEntry(p => ({ ...p, tags: e.target.value }))} style={{ flex: 2 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !newEntry.content.trim()}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
        Showing {filtered.length} of {knowledge.length} entries
        {knowledge.length === 0 && ' — no knowledge entries yet'}
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
                    <span className="badge badge-active" style={{ fontSize: 8 }}>{entry.category || 'general'}</span>
                    {entry.title && <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{entry.title}</div>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'var(--bg3)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    {entry.content || entry.summary || entry.insight || '—'}
                  </div>
                </div>
                {entry.id && <button className="btn-danger" style={{ opacity: 0.3 }} onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>x</button>}
              </div>

              {entry.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 8px', background: 'var(--purple-dim)',
                      color: 'var(--purple)', border: '1px solid rgba(181, 53, 255, 0.15)', borderRadius: 4,
                    }}>{t}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Author:</span><span style={{ color: 'var(--cyan)' }}>{agent?.name || 'system'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Source:</span><span>{entry.source_task || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <span>Confidence</span>
                    <span style={{ color: confidence > 0.9 ? 'var(--green)' : 'var(--amber)' }}>{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${confidence * 100}%`,
                      background: confidence > 0.9 ? 'var(--green)' : 'var(--amber)',
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
