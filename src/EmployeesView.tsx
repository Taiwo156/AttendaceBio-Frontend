import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

interface Employee {
  employeeId: string;
  name: string;
  department: string;
  status: 'in' | 'out' | null;
  lastSeen: string | null;
}

function initials(name: string) {
  return name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/attendance/employees`).then((res) => setEmployees(res.data));
  }, []);

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {filtered.map((emp) => (
          <div key={emp.employeeId} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="avatar-sm">{initials(emp.name)}</span>
              <span className={`badge ${emp.status === 'in' ? 'badge-in' : 'badge-out'}`}>
                {emp.status === 'in' ? 'Checked In' : emp.status === 'out' ? 'Checked Out' : 'No record'}
              </span>
            </div>
            <div style={{ fontWeight: 600 }}>{emp.name}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{emp.department}</div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: '#64748b' }}>No employees found.</p>}
      </div>
    </div>
  );
}