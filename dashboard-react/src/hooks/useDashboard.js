import { useState, useEffect, useRef, useCallback } from 'react';
import { getCsrfToken } from '../lib/api.js';

const POLL_INTERVAL_MS = 10_000; // guaranteed refresh every 10s even if SSE stalls
const SSE_RECONNECT_MS = 3_000;

export function useDashboard() {
  const [data,        setData]        = useState(window.INITIAL_DATA || null);
  const [connected,   setConnected]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(window.INITIAL_DATA ? new Date() : null);
  const [updateCount, setUpdateCount] = useState(0);

  const esRef       = useRef(null);
  const aliveRef    = useRef(true);
  const pollTimer   = useRef(null);
  const reconnTimer = useRef(null);
  const tokenRef    = useRef(null);

  const applyData = useCallback((d) => {
    if (!d || d.error || d.type === 'keepalive') return;
    setData(prev => ({ ...d })); // spread forces new reference → guaranteed re-render
    setLastUpdated(new Date());
    setUpdateCount(n => n + 1);
  }, []);

  // polling fallback (always runs every 10s regardless of SSE)
  const startPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      if (!aliveRef.current || !tokenRef.current) return;
      try {
        const res = await fetch('/api/data', {
          headers: { 'x-agi-farm-csrf': tokenRef.current },
        });
        if (res.ok) applyData(await res.json());
      } catch {}
    }, POLL_INTERVAL_MS);
  }, [applyData]);

  // SSE connection with auto-reconnect
  const connect = useCallback(async () => {
    if (!aliveRef.current) return;
    if (esRef.current) { try { esRef.current.close(); } catch {} }

    // Ensure we have the CSRF token before connecting
    if (!tokenRef.current) {
      try {
        tokenRef.current = await getCsrfToken();
      } catch {
        // Retry after delay
        reconnTimer.current = setTimeout(connect, SSE_RECONNECT_MS);
        return;
      }
    }

    const es = new EventSource(`/api/stream?token=${encodeURIComponent(tokenRef.current)}`);
    esRef.current = es;

    es.onopen = () => {
      if (!aliveRef.current) return;
      setConnected(true);
      if (reconnTimer.current) { clearTimeout(reconnTimer.current); reconnTimer.current = null; }
    };

    es.onmessage = (e) => {
      if (!aliveRef.current) return;
      try { applyData(JSON.parse(e.data)); } catch {}
    };

    es.onerror = () => {
      if (!aliveRef.current) return;
      setConnected(false);
      try { es.close(); } catch {}
      esRef.current = null;
      reconnTimer.current = setTimeout(connect, SSE_RECONNECT_MS);
    };
  }, [applyData]);

  useEffect(() => {
    aliveRef.current = true;
    connect();
    startPolling();
    return () => {
      aliveRef.current = false;
      if (esRef.current)     try { esRef.current.close(); } catch {}
      if (pollTimer.current)  clearInterval(pollTimer.current);
      if (reconnTimer.current) clearTimeout(reconnTimer.current);
    };
  }, [connect, startPolling]);

  return { data, connected, lastUpdated, updateCount };
}
