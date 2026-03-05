import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

export default function Agents({ data, lastUpdated, toast }) {
  const { agents = [], cache_age_seconds } = data;
  const cacheAge = cache_age_seconds ?? null;
  const [search, setSearch] = useState('');

  const filtered = agents.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.name || '').toLowerCase().includes(q) || (a.id || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <input className="input-base" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '0 1 200px' }} />
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
        </span>
        {cacheAge != null && (
          <span style={{ fontSize: 10, color: cacheAge > 25 ? 'var(--amber)' : 'var(--muted)' }}>
            🔄 cached {cacheAge}s ago
          </span>
        )}
        <LastUpdated ts={lastUpdated} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {filtered.map(a => <AgentCard key={a.id} agent={a} toast={toast} />)}
      </div>
    </div>
  );
}

function AgentCard({ agent: a, toast }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const dotCls = { active: 'dot-active', available: 'dot-available', busy: 'dot-busy', error: 'dot-error' }[a.status] || 'dot-offline';
  const badgeCls = { active: 'badge-active', available: 'badge-available', busy: 'badge-busy', error: 'badge-error' }[a.status] || 'badge-offline';
  const cred = a.credibility ?? 1.0;

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${a.id}/send`, { message: msg.trim() });
      toast(`Message sent to ${a.name}`, 'success');
      setMsg(''); setMsgOpen(false);
    } catch (e) { toast(e.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{a.emoji || '🤖'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>{a.role}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span className={`dot ${dotCls}`} />
            <span className={`badge ${badgeCls}`}>{a.status}</span>
          </div>
          {a.inbox_count > 0 && (
            <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>📬 {a.inbox_count} msgs</div>
          )}
        </div>
      </div>

      {/* Model */}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, fontFamily: 'monospace' }}>
        {a.model || '—'}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <Stat label="Done" value={a.tasks_completed ?? 0} />
        <Stat label="Failed" value={a.tasks_failed ?? 0} color="var(--red)" />
        <Stat label="Quality" value={`⭐${(a.quality_score || 0).toFixed(1)}`} color="var(--amber)" />
      </div>

      {/* Liveness */}
      <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>Heartbeat: {a.heartbeat_age_minutes != null ? `${a.heartbeat_age_minutes}m ago` : 'offline'}</span>
        <span>ID: {a.id}</span>
      </div>

      {/* Credibility */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
          <span>Credibility</span><span>{(cred * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{
            width: `${cred * 100}%`,
            background: cred > .8 ? 'var(--green)' : cred > .5 ? 'var(--amber)' : 'var(--red)',
          }} />
        </div>
      </div>

      {/* Specializations */}
      {a.specializations?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {a.specializations.map(s => (
            <span key={s} style={{
              fontSize: 9, padding: '2px 6px', background: 'rgba(0,229,255,.07)',
              color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.2)', borderRadius: 3
            }}>{s}</span>
          ))}
        </div>
      )}

      {/* Send Message */}
      {msgOpen ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input className="input-base" style={{ flex: 1 }} placeholder="Type a message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} maxLength={2000} />
          <button className="btn-primary" onClick={handleSend} disabled={sending || !msg.trim()}>{sending ? '...' : 'Send'}</button>
          <button className="input-base" style={{ cursor: 'pointer', padding: '4px 8px' }} onClick={() => setMsgOpen(false)}>X</button>
        </div>
      ) : (
        <button className="input-base" style={{ width: '100%', cursor: 'pointer', marginTop: 8, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }} onClick={() => setMsgOpen(true)}>Send Message</button>
      )}
    </div>
  );
}

function Stat({ label, value, color = 'var(--text)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '6px', background: 'var(--surface)', borderRadius: 4 }}>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
