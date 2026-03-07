import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import LastUpdated from '../LastUpdated';

const GRADE_COLOR = { A: 'var(--green)', B: 'var(--cyan)', C: 'var(--amber)', D: 'var(--red)', F: 'var(--red)' };
const SEVERITY_COLOR = { critical: 'var(--red)', high: '#ff6b35', medium: 'var(--amber)', low: 'var(--muted)', info: 'var(--cyan)' };
const TREND_ICON = { improving: '\u2197', stable: '\u2192', degrading: '\u2198' };
const TREND_COLOR = { improving: 'var(--green)', stable: 'var(--muted)', degrading: 'var(--red)' };

const SCAN_CATEGORIES = [
  { name: 'Prompt Injection', desc: 'Detects malicious prompt patterns in agent configurations' },
  { name: 'Tool Safety', desc: 'Validates tool configurations and permissions' },
  { name: 'File Safety', desc: 'Checks filesystem access controls and sensitive files' },
  { name: 'Network Safety', desc: 'Scans network policies and allowed endpoints' },
  { name: 'Secrets Detection', desc: 'Finds hardcoded credentials and API keys' },
];

function relTime(iso) {
  if (!iso) return '\u2014';
  try {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff}M AGO`;
    if (diff < 1440) return `${Math.round(diff / 60)}H AGO`;
    return `${Math.round(diff / 1440)}D AGO`;
  } catch { return iso; }
}

export default function Security({ data, lastUpdated }) {
  const ssFromData = data?.security_status;
  const [securityStatus, setSecurityStatus] = useState(ssFromData || null);
  const [loading, setLoading] = useState(!ssFromData);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ssFromData && ssFromData.grade) {
      setSecurityStatus(ssFromData);
      setLoading(false);
    }
  }, [ssFromData]);

  const loadStatus = useCallback(async () => {
    try {
      const result = await apiGet('/api/security/status');
      if (result && result.grade) setSecurityStatus(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ssFromData || !ssFromData.grade) loadStatus();
  }, [ssFromData, loadStatus]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const result = await apiPost('/api/security/scan', { fix: false });
      setSecurityStatus(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleFix = async () => {
    setFixing(true);
    setError(null);
    try {
      const result = await apiPost('/api/security/fix');
      setSecurityStatus(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setFixing(false);
    }
  };

  const ss = securityStatus;
  const grade = ss?.grade || '\u2014';
  const score = ss?.score ?? 0;
  const findings = ss?.findings || { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const trend = ss?.trend || 'stable';
  const gradeColor = GRADE_COLOR[grade] || 'var(--muted)';
  const totalFindings = Object.values(findings).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: 60, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
        LOADING_SECURITY_STATUS...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
      {/* Grade Card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          {/* Grade Display */}
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div className="section-title" style={{ fontSize: 8 }}>SECURITY GRADE</div>
            <div style={{
              fontSize: 64, fontWeight: 900, color: gradeColor, fontFamily: 'Rajdhani, sans-serif',
              textShadow: `0 0 20px ${gradeColor}40`, lineHeight: 1
            }}>
              {grade}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: TREND_COLOR[trend] }}>{TREND_ICON[trend]}</span>
              <span style={{ fontSize: 9, color: TREND_COLOR[trend], fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{trend}</span>
            </div>
          </div>

          {/* Score Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>SECURITY SCORE</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: gradeColor, fontFamily: 'var(--font-mono)' }}>{score}/100</span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${score}%`, background: gradeColor, boxShadow: `0 0 12px ${gradeColor}60`, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                LAST SCAN: {relTime(ss?.last_scan)}
              </span>
              <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {totalFindings} FINDING{totalFindings !== 1 ? 'S' : ''}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
            <button className="btn-primary" onClick={handleScan} disabled={scanning || fixing} style={{ padding: '10px 16px' }}>
              {scanning ? 'SCANNING...' : 'SCAN NOW'}
            </button>
            <button className="btn-secondary" onClick={handleFix} disabled={scanning || fixing} style={{ padding: '10px 16px' }}>
              {fixing ? 'FIXING...' : 'AUTO-FIX'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', fontSize: 12, padding: '12px 16px' }}>
          [ERROR] {error}
        </div>
      )}

      {/* Findings Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
          <div key={sev} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{sev}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: findings[sev] > 0 ? color : 'var(--muted)', fontFamily: 'Rajdhani, sans-serif' }}>
              {findings[sev] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Status & Info Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Current Status */}
        <div className="card">
          <div className="section-title" style={{ fontSize: 8 }}>SECURITY POSTURE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: ss?.status === 'OK' ? 'var(--green)' : 'var(--red)',
              boxShadow: `0 0 8px ${ss?.status === 'OK' ? 'var(--green)' : 'var(--red)'}60`
            }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: ss?.status === 'OK' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
              {ss?.status || 'UNKNOWN'}
            </span>
          </div>
          {ss?.next_scan && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              NEXT SCHEDULED SCAN: {new Date(ss.next_scan).toLocaleString()}
            </div>
          )}
          {ss?.notes && (
            <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 8, lineHeight: 1.5 }}>{ss.notes}</div>
          )}
          <div style={{ marginTop: 8 }}><LastUpdated ts={lastUpdated} /></div>
        </div>

        {/* What Gets Scanned */}
        <div className="card">
          <div className="section-title" style={{ fontSize: 8 }}>SCAN CATEGORIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {SCAN_CATEGORIES.map((cat, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 800, fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'right' }}>{i + 1}.</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>{cat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scan History */}
      {(ss?.scan_history || []).length > 1 && (
        <div className="card">
          <div className="section-title" style={{ fontSize: 8 }}>SCAN HISTORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
            {(ss.scan_history || []).slice().reverse().slice(0, 10).map((h, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, padding: '6px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}>
                <span style={{ color: 'var(--muted)', minWidth: 140 }}>{new Date(h.timestamp).toLocaleString()}</span>
                <span style={{ color: GRADE_COLOR[h.grade] || 'var(--muted)', fontWeight: 800, minWidth: 24 }}>{h.grade}</span>
                <span style={{ color: 'var(--text)', minWidth: 50 }}>{h.score}/100</span>
                <span style={{ color: h.findings_count > 0 ? 'var(--amber)' : 'var(--muted)' }}>{h.findings_count} finding{h.findings_count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
