import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Users, Clock, UserX, Calendar } from 'lucide-react';
import { API_BASE_URL } from './config';

interface StatusEvent {
  employeeId: string;
  employeeName: string;
  department: string;
  status: 'in' | 'out' | 'late';
  clockinTime?: string;
  clockoutTime?: string;
  overTime?: number;
}

function initials(name: string) {
  return name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function LiveView() {
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [totalPresent, setTotalPresent] = useState<number | null>(null);
  const [lateArrivals, setLateArrivals] = useState<number>(0);
  const [absentToday, setAbsentToday] = useState<number>(0);
  const [onLeave, setOnLeave] = useState<number>(0);

  const loadCurrentStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/current-status`);

      if (res.data && res.data.events) {
        setEvents(res.data.events.slice().reverse());

        if (res.data.metrics) {
          setTotalPresent(res.data.metrics.totalPresent);
          setLateArrivals(res.data.metrics.lateArrivals);  
          setAbsentToday(res.data.metrics.absentToday);    
          setOnLeave(res.data.metrics.onLeave);
        }
      }
    } catch (error) {
      console.error("Error fetching live view data:", error);
    }
  };


  useEffect(() => {
    loadCurrentStatus();

    const socket: Socket = io(`${API_BASE_URL}/attendance`, { transports: ['websocket'] });
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_site', { siteId: 'site-1', token: 'test-token' });
    });
    socket.on('status_change', (event: StatusEvent) => {
      setEvents((prev) => [event, ...prev]);
      loadCurrentStatus();
    });
    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <span className="status-dot">{connected ? 'Biometric Link Active' : 'Disconnected'}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label"><Users size={14} style={{ marginRight: 6 }} />Total Present</div>
          <div className="stat-value">{totalPresent ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Clock size={14} style={{ marginRight: 6 }} />Late Arrivals</div>
          <div className="stat-value">{lateArrivals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><UserX size={14} style={{ marginRight: 6 }} />Absent Today</div>
          <div className="stat-value">{absentToday}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Calendar size={14} style={{ marginRight: 6 }} />On Leave</div>
          <div className="stat-value">{onLeave}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Recent Punch Events</div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Status</th>
              <th>ClockIn Time</th>
              <th>ClockOut Time</th>
              <th>Over Time</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={6} style={{ color: '#64748b' }}>Waiting for punches…</td></tr>
            )}
            {events.map((e, i) => (
              <tr key={i}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="avatar-sm">{initials(e.employeeName)}</span>
                  {e.employeeName}
                </td>
                <td>{e.department}</td>
                <td><span className={`badge ${e.status === 'in' ? 'badge-in' : 'badge-out'}`}>{e.status === 'in' ? 'Checked In' : 'Checked Out'}</span></td>
                <td>{e.clockinTime ? new Date(e.clockinTime).toLocaleTimeString() : '—'}</td>
                <td>{e.clockoutTime ? new Date(e.clockoutTime).toLocaleTimeString() : '—'}</td>
                <td>{e.overTime !== undefined ? `${e.overTime} hrs` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}