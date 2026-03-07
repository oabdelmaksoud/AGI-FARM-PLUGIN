import { useState } from 'react';
import { apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

function CommsPanel({ content, label, color }) {
  if (!content || content.trim() === '' || content.trim() === `# ${label}\n\n_No messages._`) {
    return (
      <div style={{
        color: 'var(--muted)', fontSize: 11, padding: '60px 0', textAlign: 'center',
        border: '1px dashed var(--border)', borderRadius: 8, marginTop: 16
      }}>
        <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>📡</div>
        <div style={{ letterSpacing: '0.1em', fontWeight: 700 }}>FEED_SILENT // NO ACTIVE SIGNALS</div>
      </div>
    );
  }

  const lines = (content || '').split('\n');
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.8,
      maxHeight: 500, overflowY: 'auto', padding: 20,
      background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)'
    }}>
      {lines.map((line, i) => {
        let lineColor = 'rgba(255,255,255,0.7)';
        let weight = 400;
        let glow = 'none';

        if (line.startsWith('# ') || line.startsWith('## ')) {
          lineColor = color; weight = 800; glow = `0 0 10px ${color}44`;
        }
        else if (line.startsWith('---')) lineColor = 'rgba(255,255,255,0.05)';
        else if (line.startsWith('- ')) lineColor = 'var(--muted)';
        else if (line.startsWith('**')) { lineColor = 'var(--text)'; weight = 600; }

        return (
          <div key={i} style={{
            color: lineColor, fontWeight: weight, textShadow: glow, padding: '2px 0',
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
      toast('Signal frequencies locked and transmitted', 'success');
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
        <div className="section-title" style={{ fontSize: 9 }}>NEURAL FREQUENCIES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agents.map(a => {
            const ac = comms[a.id] || {};
            const inboxCount = countMessages(ac.inbox);
            const outboxCount = countMessages(ac.outbox);
            const isActive = selectedAgent === a.id;

            return (
              <button key={a.id} onClick={() => setSelectedAgent(a.id)} style={{
                background: isActive ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(0, 240, 255, 0.3)' : 'var(--border)'}`,
                borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                boxShadow: isActive ? '0 0 15px rgba(0, 240, 255, 0.05)' : 'none'
              }} className="task-row-hover">
                <span style={{ fontSize: 24, filter: isActive ? 'drop-shadow(0 0 5px var(--cyan))' : 'grayscale(0.5)' }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 800, color: isActive ? 'var(--cyan)' : 'var(--text)',
                    fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em'
                  }}>{(a.name || '').toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                    IN:{inboxCount} // OUT:{outboxCount}
                  </div>
                </div>
                {isActive && <div className="status-dot" style={{ background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />}
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
            background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 24 }}>{agent?.emoji}</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>{(agent?.name || '').toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            {['inbox', 'outbox'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: 'none', color: view === v ? 'var(--cyan)' : 'var(--muted)',
                padding: '6px 16px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.2s', fontFamily: 'Rajdhani, sans-serif'
              }}>{v === 'inbox' ? '📥 DOWNLINK' : '📤 UPLINK'}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}><LastUpdated ts={lastUpdated} /></div>
        </div>

        <div className="card shadow-glow" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 400 }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: view === 'inbox' ? 'var(--cyan)' : 'var(--green)', boxShadow: `0 0 8px ${view === 'inbox' ? 'var(--cyan)' : 'var(--green)'}` }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.1em' }}>
              DECODING_{view.toUpperCase()}_STREAM.EXE
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
          <div className="card shadow-glow" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', border: '1px solid var(--border-h)' }}>
            <div style={{ flex: 1 }}>
              <div className="section-title" style={{ fontSize: 9, marginBottom: 8 }}>ENCRYPT MESSAGE FOR {(agent?.name || '').toUpperCase()}</div>
              <textarea className="input-base" placeholder="AUTHORIZE SIGNAL TRANSMISSION..."
                value={composeMsg} onChange={e => setComposeMsg(e.target.value)}
                style={{ width: '100%', minHeight: 80, resize: 'none', background: 'rgba(0,0,0,0.2)', fontSize: 12, padding: 12 }} maxLength={2000} />
            </div>
            <button className="btn-primary" style={{ height: 80, width: 120, fontSize: 13 }} onClick={handleSend} disabled={sending || !composeMsg.trim()}>
              {sending ? 'TX...' : 'TRANSMIT'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
