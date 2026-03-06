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
    <div className="empty-state" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="empty-state-icon">&#x1F33E;</div>
      <div className="empty-state-title">Connecting to AGI Farm...</div>
      <div className="empty-state-desc">Waiting for real-time data stream from the server</div>
      <div className="skeleton" style={{ width: 200, height: 4, marginTop: 8 }} />
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 8 }}>
      <div className="skeleton" style={{ height: 32, width: '40%' }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 200 }} />
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
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">&#x1F33E;</span>
          <div>
            <div className="sidebar-brand-text">AGI Farm</div>
            <div className="sidebar-brand-sub">Command Center</div>
          </div>
        </div>
        <Nav tabs={TABS} active={activeTab} onChange={setActiveTab} badges={badges} />
        <div className="sidebar-footer">
          <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`dot ${connected ? 'dot-active' : 'dot-error'}`} style={{ width: 6, height: 6 }} />
            <span>{connected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-body">
        <Header data={data} connected={connected} lastUpdated={lastUpdated} updateCount={updateCount} toast={toast} />
        <main className="app-main">
          {!data ? <Connecting /> : (
            <Suspense fallback={<TabLoading />}>
              <ActiveTab {...tabProps} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
