import { useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';

interface ReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  daysPresent: number;
  firstIn: string | null;
  lastOut: string | null;
  punchCount: number;
}

export default function ReportView() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [from, setFrom] = useState(formatDate(firstOfMonth));
  const [to, setTo] = useState(formatDate(today));
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/attendance/report', { params: { from, to } });
      setRows(res.data);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const exportCsv = () => {
    const header = 'Employee,Department,Days Present,First In,Last Out,Total Punches\n';
    const body = rows.map((r) => `${r.employeeName},${r.department},${r.daysPresent},${r.firstIn ?? ''},${r.lastOut ?? ''},${r.punchCount}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-report-${from}-to-${to}.csv`; a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn" onClick={fetchReport} disabled={loading}>{loading ? 'Loading…' : 'Run report'}</button>
        </div>
        {rows.length > 0 && (
          <button className="btn-primary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
        )}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Days Present</th>
              <th>First Check-in</th>
              <th>Last Check-out</th>
              <th>Total Punches</th>
            </tr>
          </thead>
          <tbody>
            {!loaded && <tr><td colSpan={6} style={{ color: '#64748b' }}>Run a report to see data.</td></tr>}
            {loaded && rows.length === 0 && <tr><td colSpan={6} style={{ color: '#64748b' }}>No records for this period.</td></tr>}
            {rows.map((r) => (
              <tr key={r.employeeId}>
                <td>{r.employeeName}</td>
                <td>{r.department}</td>
                <td>{r.daysPresent}</td>
                <td>{r.firstIn ? new Date(r.firstIn).toLocaleTimeString() : '—'}</td>
                <td>{r.lastOut ? new Date(r.lastOut).toLocaleTimeString() : '—'}</td>
                <td>{r.punchCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}