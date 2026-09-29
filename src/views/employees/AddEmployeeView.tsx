import './EmployeesView.css';

interface Props {
  onCancel: () => void;
  onSave: (data: any) => void;
}

export default function AddEmployeeView({ onCancel, onSave }: Props) {
  return (
    <div className="page-content form-view">
      <div className="form-grid">
        {/* Personal Information */}
        <div className="form-card">
          <h3>👤 Personal Information</h3>
          <div className="input-grid">
            <div className="input-group"><label>First Name</label><input placeholder="e.g. Jane" /></div>
            <div className="input-group"><label>Last Name</label><input placeholder="e.g. Cooper" /></div>
            <div className="input-group"><label>Email Address</label><input placeholder="e.g. jane.cooper@company.com" /></div>
            <div className="input-group"><label>Phone Number</label><input placeholder="e.g. +1 555-0199" /></div>
            <div className="input-group"><label>Date of Birth</label><input placeholder="YYYY-MM-DD" /></div>
            <div className="input-group"><label>Gender</label><select><option>Select Gender</option></select></div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="form-card">
          <h3>Employment Details</h3>
          <div className="input-grid">
            <div className="input-group"><label>Employee ID</label><input value="EMP-00134 (Auto-generated)" disabled /></div>
            <div className="input-group"><label>Job Designation</label><input placeholder="e.g. Software Engineer" /></div>
            
            {/* DIVISION BEFORE DEPARTMENT */}
            <div className="input-group"><label>Division</label><select><option>Select Division</option></select></div>
            <div className="input-group"><label>Department</label><select><option>Select Department</option></select></div>
            
            <div className="input-group"><label>Branch / Site Location</label><select><option>Select Branch</option></select></div>
            <div className="input-group"><label>Date of Joining</label><input placeholder="YYYY-MM-DD" /></div>
          </div>
        </div>

        {/* Biometric & Access Control */}
        <div className="form-card">
          <h3>Biometric & Access Control</h3>
          <div className="input-grid">
            <div className="input-group"><label>Biometric ID</label><input placeholder="e.g. BIO-88421" /></div>
            <div className="input-group"><label>Access Card Number</label><input placeholder="e.g. CARD-499120" /></div>
          </div>
        </div>

        {/* Employment Status */}
        <div className="form-card">
          <h3>Employment Status</h3>
          <div className="radio-group">
            <label><input type="radio" name="status" defaultChecked /> Active</label>
            <label><input type="radio" name="status" /> On Leave</label>
            <label><input type="radio" name="status" /> Inactive</label>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave({})}>Save Employee</button>
      </div>
    </div>
  );
}