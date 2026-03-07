import { BookMarked } from 'lucide-react';

function MarkdownSection({ title, content, icon }) {
  if (!content?.trim()) return null;
  const lines = content.split('\n');
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
      </div>
      <div style={{
        background: '#F8FAFC', borderRadius: 10, padding: '16px',
        fontSize: 13, lineHeight: 1.8, color: 'var(--text-dim)',
        whiteSpace: 'pre-wrap', fontFamily: 'var(--font-main)',
        maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)',
      }}>
        {content}
      </div>
    </div>
  );
}

export default function Memory({ data }) {
  const { memory = '', memory_lines = 0 } = data || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Shared Memory</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{memory_lines} lines in the shared memory file</p>
      </div>
      {memory?.trim() ? (
        <MarkdownSection title="Memory Contents" content={memory} icon="🧠" />
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <BookMarked size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Memory is empty</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Agents will populate MEMORY.md as they work</div>
        </div>
      )}
    </div>
  );
}
