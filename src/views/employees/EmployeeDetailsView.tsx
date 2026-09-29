import type { Employee } from '../../types/employee';
import './EmployeesView.css';

interface Props {
  employee: Employee;
  onBack: () => void;
}

export default function EmployeeDetailsView({ employee, onBack }: Props) {
  return (
    <div className="page-content details-view">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-lg">{employee.firstName[0]}{employee.lastName[0]}</div>
          <div className="profile-info">
            <h2>{employee.firstName} {employee.lastName} <span className="badge badge-active">• {employee.status}</span></h2>
            <p>{employee.jobDesignation} • {employee.division} Division</p>
            <div className="contact-info">
              <span>{employee.email}</span>
              <span>{employee.phone}</span>
              <span>{employee.branch}</span>
            </div>
          </div>
          <button className="btn-primary">Edit Profile</button>
        </div>
      </div>

      <div className="tabs">
        <div className="tab active">Overview</div>
        <div className="tab">Attendance</div>
        <div className="tab">Shift</div>
        <div className="tab">Overtime</div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h3>Personal Details</h3>
          <div className="detail-row"><span>FIRST NAME</span><strong>{employee.firstName}</strong></div>
          <div className="detail-row"><span>LAST NAME</span><strong>{employee.lastName}</strong></div>
          <div className="detail-row"><span>EMAIL ADDRESS</span><strong>{employee.email}</strong></div>
          <div className="detail-row"><span>PHONE NUMBER</span><strong>{employee.phone}</strong></div>
          <div className="detail-row"><span>DATE OF BIRTH</span><strong>{employee.dob}</strong></div>
          <div className="detail-row"><span>GENDER</span><strong>{employee.gender}</strong></div>
        </div>

        <div className="detail-card">
          <h3>Employment Status</h3>
          <div className="detail-row"><span>EMPLOYEE ID</span><strong>{employee.employeeId}</strong></div>
          
          {/* DIVISION BEFORE DEPARTMENT */}
          <div className="detail-row"><span>DIVISION</span><strong>{employee.division}</strong></div>
          <div className="detail-row"><span>DEPARTMENT</span><strong>{employee.department}</strong></div>
          
          <div className="detail-row"><span>BRANCH / SITE</span><strong>{employee.branch}</strong></div>
          <div className="detail-row"><span>DATE OF JOINING</span><strong>{employee.dateOfJoining}</strong></div>
          <div className="detail-row"><span>BIOMETRIC ID</span><strong>{employee.biometricId}</strong></div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '24px' }}>
        <button className="btn-secondary" onClick={onBack}>← Back to Directory</button>
      </div>
    </div>
  );
}