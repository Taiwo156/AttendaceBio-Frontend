import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Layout from './Layout';
import LiveView from './LiveView';
import ReportView from './ReportView';
import EmployeesView from './views/employees/EmployeesView';
import DevicesView from './views/devices/DevicesView';
import DeviceDetailView from './views/devices/DeviceDetailView';
import AddDeviceView from './views/devices/AddDeviceView';

type Tab = 'live' | 'report' | 'employees' | 'devices';

const titles: Record<Tab, string> = {
  live: 'Live Attendance Monitor',
  report: 'Attendance Reports',
  employees: 'Employee Directory',
  devices: 'Device Management',
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>(() => {
    if (location.pathname.startsWith('/devices')) {
      return 'devices';
    }

    if (location.pathname.startsWith('/reports')) {
      return 'report';
    }

    if (location.pathname.startsWith('/employees')) {
      return 'employees';
    }

    return 'live';
  });

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);

    switch (nextTab) {
      case 'live':
        navigate('/live');
        break;

      case 'report':
        navigate('/reports');
        break;

      case 'employees':
        navigate('/employees');
        break;

      case 'devices':
        navigate('/devices');
        break;
    }
  };

  const activeTab: Tab = location.pathname.startsWith('/devices')
    ? 'devices'
    : location.pathname.startsWith('/reports')
      ? 'report'
      : location.pathname.startsWith('/employees')
        ? 'employees'
        : 'live';

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      title={titles[activeTab]}
    >
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/live" replace />}
        />

        <Route
          path="/live"
          element={<LiveView />}
        />

        <Route
          path="/reports"
          element={<ReportView />}
        />

        <Route
          path="/employees"
          element={<EmployeesView />}
        />

        <Route
          path="/devices"
          element={<DevicesView />}
        />

        <Route
          path="/devices/new"
          element={<AddDeviceView />}
        />

        <Route
          path="/devices/:deviceId/edit"
          element={<AddDeviceView />}
        />

        <Route
          path="/devices/:deviceId"
          element={<DeviceDetailView />}
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}