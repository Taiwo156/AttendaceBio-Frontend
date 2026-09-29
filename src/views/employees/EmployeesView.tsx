import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { getEmployees, setFilter, setPage } from '../../store/employeeSlice';
import type { Employee } from '../../types/employee';
import AddEmployeeView from './AddEmployeeView';
import EmployeeDetailsView from './EmployeeDetailsView';
import './EmployeesView.css';

type ViewState = 'directory' | 'add' | 'details';

export default function EmployeesView() {
  const dispatch = useDispatch<AppDispatch>();
  const [view, setView] = useState<ViewState>('directory');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { list: employees, loading, error, filters, pagination } = useSelector((state: RootState) => state.employees);
  const companyId = useSelector((state: RootState) => state.auth.companyId);

  useEffect(() => {
    if (companyId) {
      dispatch(getEmployees());
    }
  }, [dispatch, companyId, filters, pagination.page]);

  const handleViewDetails = (emp: Employee) => {
    setSelectedEmployee(emp);
    setView('details');
  };

  // --- RENDER: DIRECTORY VIEW ---
  if (view === 'directory') {
    return (
      <div className="page-content">
        <div className="toolbar">
          <div className="filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => dispatch(setFilter({ key: 'search', value: e.target.value }))}
              />
            </div>
            <select 
              className="filter-select"
              value={filters.division}
              onChange={(e) => dispatch(setFilter({ key: 'division', value: e.target.value }))}
            >
              <option value="All">Division: All</option>
              {/* Populate from backend later based on companyId */}
            </select>
            <select 
              className="filter-select"
              value={filters.department}
              onChange={(e) => dispatch(setFilter({ key: 'department', value: e.target.value }))}
            >
              <option value="All">Department: All</option>
            </select>
          </div>
          <button className="btn-primary" onClick={() => setView('add')}>+ Add Employee</button>
        </div>

        {loading && <p className="status-text">Loading employees...</p>}
        {error && <p className="status-text error">{error}</p>}

        {!loading && !error && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>DIVISION</th>
                  <th>DEPARTMENT</th>
                  <th>BRANCH/SITE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar-sm">{emp.firstName[0]}{emp.lastName[0]}</div>
                        <div>
                          <div className="emp-name">{emp.firstName} {emp.lastName}</div>
                          <div className="emp-id">{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.division}</td>
                    <td>{emp.department}</td>
                    <td>{emp.branch}</td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-leave'}`}>
                        • {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => handleViewDetails(emp)} title="View">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button className="action-btn" title="Edit">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        <button className="action-btn danger" title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <span>Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees</span>
              <div className="page-controls">
                <button 
                  disabled={pagination.page === 1} 
                  onClick={() => dispatch(setPage(pagination.page - 1))}
                >Previous</button>
                <button 
                  disabled={pagination.page * pagination.limit >= pagination.total} 
                  onClick={() => dispatch(setPage(pagination.page + 1))}
                >Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: ADD EMPLOYEE VIEW ---
  if (view === 'add') {
    return (
      <AddEmployeeView 
        onCancel={() => setView('directory')} 
        onSave={() => {
          // Trigger redux refetch here later
          setView('directory');
        }} 
      />
    );
  }

  // --- RENDER: EMPLOYEE DETAILS VIEW ---
  if (view === 'details' && selectedEmployee) {
    return (
      <EmployeeDetailsView 
        employee={selectedEmployee} 
        onBack={() => setView('directory')} 
      />
    );
  }

  return null;
}