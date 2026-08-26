import { useState } from 'react';
import Layout from './Layout';
import LiveView from './LiveView';
import ReportView from './ReportView';
import EmployeesView from './EmployeesView';

const titles = { live: 'Live Attendance Monitor', report: 'Attendance Reports', employees: 'Employee Directory' };

export default function App() {
  const [tab, setTab] = useState<'live' | 'report' | 'employees'>('live');

  return (
    <Layout activeTab={tab} onTabChange={setTab} title={titles[tab]}>
      {tab === 'live' && <LiveView />}
      {tab === 'report' && <ReportView />}
      {tab === 'employees' && <EmployeesView />}
    </Layout>
  );
}