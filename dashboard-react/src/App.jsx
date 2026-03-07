import { Suspense, lazy, useMemo, useState } from 'react';
import { useDashboard } from './hooks/useDashboard';
import Header from './components/Header';
import Nav from './components/Nav';
import { useToast } from './components/Toast';

const Overview = lazy(() => import('./components/tabs/Overview'));
const Agents = lazy(() => import('./components/tabs/Agents'));
const Tasks = lazy(() => import('./components/tabs/Tasks'));
const Projects = lazy(() => import('./components/tabs/Projects'));
const Jobs = lazy(() => import('./components/tabs/Jobs'));
const Approvals = lazy(() => import('./components/tabs/Approvals'));
const Usage = lazy(() => import('./components/tabs/Usage'));
const Crons = lazy(() => import('./components/tabs/Crons'));
const HITLTab = lazy(() => import('./components/tabs/HITL'));
const AlertsTab = lazy(() => import('./components/tabs/Alerts'));
const Velocity = lazy(() => import('./components/tabs/Velocity'));
const Budget = lazy(() => import('./components/tabs/Budget'));
const OKRs = lazy(() => import('./components/tabs/OKRs'));
const Knowledge = lazy(() => import('./components/tabs/Knowledge'));
const Comms = lazy(() => import('./components/tabs/Comms'));
const Memory = lazy(() => import('./components/tabs/Memory'));
const Processes = lazy(() => import('./components/tabs/Processes'));
const Failures = lazy(() => import('./components/tabs/Failures'));
const Decisions = lazy(() => import('./components/tabs/Decisions'));
const Security = lazy(() => import('./components/tabs/Security'));
const Policies = lazy(() => import('./components/tabs/Policies'));
const AuditLog = lazy(() => import('./components/tabs/AuditLog'));
const Settings = lazy(() => import('./components/tabs/Settings'));

const TAB_COMPONENTS = {
  'Overview': Overview,
  'Agents': Agents,
  'Tasks': Tasks,
  'HITL': HITLTab,
  'Alerts': AlertsTab,
  'Velocity': Velocity,
  'Budget': Budget,
  'Projects': Projects,
  'OKRs': OKRs,
  'Approvals': Approvals,
  'Knowledge': Knowledge,
  'Comms': Comms,
  'Security': Security,
  'Crons': Crons,
  'Processes': Processes,
  'Memory': Memory,
  'Failures': Failures,
  'Decisions': Decisions,
  'Jobs': Jobs,
  'Usage': Usage,
  'Policies': Policies,
  'Settings': Settings,
  'Audit': AuditLog,
};

function Connecting() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16, color: 'var(--text-dim)'
    }}>
      <span style={{ fontSize: 48, filter: 'grayscale(0.4)' }}>🦅</span>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Connecting to Ops Room…</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Waiting for SSE stream from dashboard server</div>
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { data, connected, lastUpdated, updateCount } = useDashboard();
  const toast = useToast();

  const tabProps = { data, lastUpdated, toast };

  const badges = data ? {
    'HITL': (data.hitl_tasks || []).length,
    'Alerts': (data.alerts || []).length,
    'Crons': (data.crons || []).filter(j => (j._consecutive_errors || 0) >= 3).length,
    'Approvals': (data.approvals || []).filter(a => a.status === 'pending').length,
  } : {};

  const ActiveTab = useMemo(() => TAB_COMPONENTS[activeTab] || Overview, [activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top App Bar */}
      <Header data={data} connected={connected} lastUpdated={lastUpdated} updateCount={updateCount} toast={toast} />

      {/* Body: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Nav active={activeTab} onChange={setActiveTab} badges={badges} />

        {/* Main Content Area */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '40px 48px',
          background: 'var(--bg)',
        }}>
          {!data ? <Connecting /> : (
            <div className="fade-in">
              <Suspense fallback={<TabLoading />}>
                <ActiveTab {...tabProps} />
              </Suspense>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

