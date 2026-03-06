import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

function CommsPanel({ content, label, color }) {
  if (!content || content.trim() === '' || content.trim() === `# ${label}\n\n_No messages._`) {
    return (
      <div className="empty-state" style={{ padding: '60px 0' }}>
        <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>📡</div>
        <div>No messages</div>
      </div>
    );
  }

  const lines = (content || '').split('\n');
  return (
    <div className="mono" style={{
      fontSize: 11, lineHeight: 1.8,
      maxHeight: 500, overflowY: 'auto', padding: 20,
      background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)'
    }}>
      {lines.map((line, i) => {
        let lineColor = 'rgba(255,255,255,0.7)';
        let weight = 400;

        if (line.startsWith('# ') || line.startsWith('## ')) {
          lineColor = color; weight = 800;
        }
        else if (line.startsWith('---')) lineColor = 'rgba(255,255,255,0.05)';
        else if (line.startsWith('- ')) lineColor = 'var(--text-secondary)';
        else if (line.startsWith('**')) { lineColor = 'var(--text)'; weight = 600; }

        return (
          <div key={i} style={{
            color: lineColor, fontWeight: weight, padding: '2px 0',
            borderBottom: line.startsWith('---') ? '1px solid rgba(255,255,255,0.05)' : 'none',
            display: 'flex', gap: 12
          }}>
            <span style={{ width: 24, color: 'rgba(255,255,255,0.05)', textAlign: 'right', userSelect: 'none' }}>{i + 1}</span>
            <span>{line || '\u00A0'}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Comms({ data, lastUpdated, toast }) {
  const { comms = {}, agents = [] } = data || {};
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || null);
  const [view, setView] = useState('inbox');
  const [composeMsg, setComposeMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!composeMsg.trim() || !selectedAgent) return;
    setSending(true);
    try {
      await apiPost(`/api/comms/${selectedAgent}/send`, { message: composeMsg.trim() });
      toast('Message sent', 'success');
      setComposeMsg('');
    } catch (e) { toast(e.message, 'error'); }
    setSending(false);
  };

  const agentComms = comms[selectedAgent] || { inbox: '', outbox: '' };
  const agent = agents.find(a => a.id === selectedAgent);

  const countMessages = (text) => (text?.match(/^## /gm) || []).length;

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, minHeight: 600 }}>
      {/* Agent Selector side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-title">Agents</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agents.map(a => {
            const ac = comms[a.id] || {};
            const inboxCount = countMessages(ac.inbox);
            const outboxCount = countMessages(ac.outbox);
            const isActive = selectedAgent === a.id;

            return (
              <button key={a.id} onClick={() => setSelectedAgent(a.id)} style={{
                background: isActive ? 'var(--cyan-dim)' : 'var(--bg3)',
                border: `1px solid ${isActive ? 'rgba(0, 240, 255, 0.3)' : 'var(--border)'}`,
                borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
              }} className="task-row-hover">
                <span style={{ fontSize: 24, filter: isActive ? 'none' : 'grayscale(0.5)' }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 800, color: isActive ? 'var(--cyan)' : 'var(--text)',
                  }}>{a.name}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>
                    In: {inboxCount} · Out: {outboxCount}
                  </div>
                </div>
                {isActive && <div className="status-dot" style={{ background: 'var(--cyan)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px',
            background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 24 }}>{agent?.emoji}</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--cyan)' }}>{agent?.name}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, background: 'var(--bg3)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            {['inbox', 'outbox'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'var(--cyan-dim)' : 'transparent',
                border: 'none', color: view === v ? 'var(--cyan)' : 'var(--text-secondary)',
                padding: '6px 16px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                fontWeight: 800, transition: 'all 0.2s',
              }}>{v === 'inbox' ? 'Inbox' : 'Outbox'}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
        </div>

        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 400 }}>
          <div style={{
            background: 'var(--bg3)', padding: '8px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: view === 'inbox' ? 'var(--cyan)' : 'var(--green)' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)' }}>
              {view === 'inbox' ? 'Inbox' : 'Outbox'}
            </span>
          </div>
          <CommsPanel
            content={agentComms[view]}
            label={view === 'inbox' ? 'Inbox' : 'Outbox'}
            color={view === 'inbox' ? 'var(--cyan)' : 'var(--green)'}
          />
        </div>

        {/* Compose Input */}
        {selectedAgent && (
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Send message to {agent?.name}</div>
              <textarea className="input-base" placeholder="Type your message..."
                value={composeMsg} onChange={e => setComposeMsg(e.target.value)}
                style={{ width: '100%', minHeight: 80, resize: 'none', fontSize: 12, padding: 12, boxSizing: 'border-box' }} maxLength={2000} />
            </div>
            <button className="btn-primary" style={{ height: 80, width: 120, fontSize: 13 }} onClick={handleSend} disabled={sending || !composeMsg.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
