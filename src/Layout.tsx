import type { ReactNode } from 'react';
import { Radio, BarChart3, Users, Settings, Bell } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  activeTab: 'live' | 'report' | 'employees';
  onTabChange: (tab: 'live' | 'report' | 'employees') => void;
  children: ReactNode;
  title: string;
}

export default function Layout({ activeTab, onTabChange, children, title }: LayoutProps) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div className="brand-name">Powersoft</div>
        </div>

        <nav className="nav">
          <button className={`nav-item ${activeTab === 'live' ? 'active' : ''}`} onClick={() => onTabChange('live')}>
            <Radio size={18} /> Live Attendance
          </button>
          <button className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => onTabChange('report')}>
            <BarChart3 size={18} /> Reports
          </button>
          <button className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => onTabChange('employees')}>
            <Users size={18} /> Employees
          </button>
          <button className="nav-item" disabled>
            <Settings size={18} /> Settings
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-right">
            <Bell size={18} />
            <div className="avatar">TA</div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}