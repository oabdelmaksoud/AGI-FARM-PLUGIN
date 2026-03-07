/* TopBar.jsx — Slim top bar above main content */
import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';

function Clock() {
    const [t, setT] = useState(new Date());
    useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
    return (
        <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            {t.toLocaleTimeString([], { hour12: false })}
        </span>
    );
}

export default function TopBar({ data, lastUpdated, activeTab, toast, theme, onToggleTheme }) {
    const budget = data?.budget || {};
    const updateInfo = data?.update_info;
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('update-dismissed') === 'true');
    const [updating, setUpdating] = useState(false);
    const showBanner = updateInfo?.updateAvailable && !dismissed;

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const result = await apiPost('/api/update-install');
            if (result.success) toast?.('Update installed — restart required', 'success');
            else toast?.(result.error || 'Update failed', 'error');
        } catch (e) { toast?.(e.message, 'error'); }
        setUpdating(false);
    };

    return (
        <>
            <header style={{
                height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
                background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
                flexShrink: 0, position: 'relative', zIndex: 100,
                transition: 'background 0.3s ease, border-color 0.3s ease',
            }}>
                {/* Page title */}
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {activeTab}
                </div>

                <div style={{ flex: 1 }} />

                {/* Spend Badge */}
                {data && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-pill)', fontSize: 12, fontFamily: 'var(--font-mono)',
                    }}>
                        <span style={{ color: 'var(--muted)' }}>Spend</span>
                        <span style={{ fontWeight: 700, color: 'var(--mint)' }}>${(budget.current?.daily_usd ?? 0).toFixed(2)}</span>
                    </div>
                )}

                {lastUpdated && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        Synced {lastUpdated.toLocaleTimeString([], { hour12: false })}
                    </span>
                )}

                <Clock />

                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', width: 34, height: 34,
                        cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s, border-color 0.2s', color: 'var(--text-dim)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                    {theme === 'dark' ? '☀' : '☾'}
                </button>
            </header>

            {showBanner && (
                <div style={{
                    background: 'var(--accent)', color: '#fff', padding: '7px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                    <span>✨ Update available: v{updateInfo.currentVersion} → v{updateInfo.latestVersion}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button onClick={handleUpdate} disabled={updating} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '3px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                            {updating ? 'Installing…' : 'Install Now'}
                        </button>
                        <button onClick={() => { setDismissed(true); sessionStorage.setItem('update-dismissed', 'true'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>✕</button>
                    </div>
                </div>
            )}
        </>
    );
}
