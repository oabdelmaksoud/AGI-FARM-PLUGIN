import { Suspense, lazy, useMemo, useState } from 'react';
import { useDashboard } from './hooks/useDashboard';
import Header from './components/Header';
import Nav from './components/Nav';

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
const RD = lazy(() => import('./components/tabs/RD'));
const Broadcast = lazy(() => import('./components/tabs/Broadcast'));

const TABS = [
  'Overview', 'Agents', 'Tasks', 'Projects',
  'Jobs', 'Approvals', 'Usage',
  'Crons', 'HITL', 'Alerts',
  'Velocity', 'Budget', 'OKRs',
  'Knowledge', 'Comms',
  'R&D', 'Broadcast',
];

const TAB_COMPONENTS = {
  'Overview': Overview,
  'Agents': Agents,
  'Tasks': Tasks,
  'Projects': Projects,
  'Jobs': Jobs,
  'Approvals': Approvals,
  'Usage': Usage,
  'Crons': Crons,
  'HITL': HITLTab,
  'Alerts': AlertsTab,
  'Velocity': Velocity,
  'Budget': Budget,
  'OKRs': OKRs,
  'Knowledge': Knowledge,
  'Comms': Comms,
  'R&D': RD,
  'Broadcast': Broadcast,
};

function Connecting() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - 100px)', gap: 16
    }}>
      <span style={{ fontSize: 32 }}>🦅</span>
      <div style={{ color: 'var(--cyan)', fontSize: 14, fontWeight: 600 }}>Connecting to Ops Room…</div>
      <div style={{ color: 'var(--muted)', fontSize: 11 }}>Waiting for SSE push from dashboard.js</div>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="card" style={{ color: 'var(--muted)' }}>
      Loading tab...
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { data, connected, lastUpdated, updateCount } = useDashboard();

  const tabProps = { data, lastUpdated };

  // Badge counts for nav tabs
  const badges = data ? {
    'HITL': (data.hitl_tasks || []).length,
    'Alerts': (data.alerts || []).length,
    'Crons': (data.crons || []).filter(j => (j._consecutive_errors || 0) >= 3).length,
    'Approvals': (data.approvals || []).filter(a => a.status === 'pending').length,
  } : {};

  const ActiveTab = useMemo(() => TAB_COMPONENTS[activeTab] || Overview, [activeTab]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header data={data} connected={connected} lastUpdated={lastUpdated} updateCount={updateCount} toast={toast} />
      <Nav tabs={TABS} active={activeTab} onChange={setActiveTab} badges={badges} />
      <main style={{ padding: 16 }}>
        {!data ? <Connecting /> : (
          <Suspense fallback={<TabLoading />}>
            <ActiveTab {...tabProps} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
