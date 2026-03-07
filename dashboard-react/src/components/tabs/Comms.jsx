import { useState } from 'react';
import { MessageSquare, Inbox, Send } from 'lucide-react';

export default function Comms({ data }) {
  const { comms = {}, agents = [] } = data || {};
  const [selected, setSelected] = useState(null);

  const agentIds = Object.keys(comms);
  const activeAgent = selected || agentIds[0];
  const agent = agents.find(a => a.id === activeAgent);
  const agentComms = comms[activeAgent] || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Agent Communications</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>View inbox and outbox for each agent</p>
      </div>

      {agentIds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No communications yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, minHeight: 400 }}>
          {/* Agent List */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            {agentIds.map(id => {
              const a = agents.find(ag => ag.id === id);
              const isActive = id === activeAgent;
              return (
                <button key={id} onClick={() => setSelected(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                  background: isActive ? '#EEF2FF' : 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)', textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{a?.emoji || '🤖'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : 'var(--text)' }}>{a?.name || id}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{a?.role || 'Agent'}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comms View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {agent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#EEF2FF', borderRadius: 14 }}>
                <span style={{ fontSize: 24 }}>{agent.emoji || '🤖'}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{agent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{agent.role} · {agent.status}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Inbox */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Inbox size={14} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Inbox</span>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minHeight: 200, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 400 }}>
                  {agentComms.inbox?.trim() || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Inbox is empty</span>}
                </div>
              </div>
              {/* Outbox */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Send size={14} color="var(--mint)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Outbox</span>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 12, padding: 16, minHeight: 200, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 400 }}>
                  {agentComms.outbox?.trim() || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Outbox is empty</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
