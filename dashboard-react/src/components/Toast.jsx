import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 4000);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const COLOR = { success: 'var(--green)', error: 'var(--red)', info: 'var(--cyan)' };
  const ICON = { success: '\u2705', error: '\u274C', info: '\u2139\uFE0F' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column-reverse', gap: 8, maxWidth: 360,
      }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{
            background: 'var(--bg2)', border: `1px solid ${COLOR[t.type] || COLOR.info}`,
            borderRadius: 6, padding: '10px 14px', fontSize: 12, color: 'var(--text)',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 20px rgba(0,0,0,.5), 0 0 8px ${COLOR[t.type]}33`,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{ICON[t.type]}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
            }}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
