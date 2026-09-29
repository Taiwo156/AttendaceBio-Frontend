export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  division: string;
  department: string;
  branch: string;
  jobDesignation: string;
  dateOfJoining: string;
  biometricId: string;
  accessCardNumber: string;
  status: EmployeeStatus;
}

export interface EmployeesResponse {
  status: string;
  code?: string | null;
  message?: string;
  data?: Employee[] | null;
  total?: number;
}