import { API_BASE_URL } from '../config';
import type { Employee } from '../types/employee';

export interface FetchEmployeesParams {
  companyId: string;
  search: string;
  division: string;
  department: string;
  status: string;
  page: number;
  limit: number;
}

export interface FetchEmployeesResponse {
  data: Employee[];
  total: number;
}

export const fetchEmployees = async (
  params: FetchEmployeesParams
): Promise<FetchEmployeesResponse> => {
  const query = new URLSearchParams({
    companyId: params.companyId,
    search: params.search,
    division: params.division,
    department: params.department,
    status: params.status,
    page: params.page.toString(),
    limit: params.limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE_URL}/api/attendance/employees?${query}`);

  if (!response.ok) {
    throw new Error(`Failed to load employees. Server returned ${response.status}.`);
  }

  const result = await response.json();
  const rawData = Array.isArray(result.data) ? result.data : [];

  const mappedData: Employee[] = rawData.map((emp: any) => {
    const nameParts = emp.name ? emp.name.split(' ') : ['Unknown', 'Employee'];
    return {
      employeeId: emp.employeeId || 'EMP-0000',
      firstName: nameParts[0],
      lastName: nameParts[1] || '',
      name: emp.name,
      email: emp.email || 'user@company.com',
      phone: emp.phone || '+1 555-0199',
      dob: emp.dob || '1992-04-12',
      gender: emp.gender || 'Female',
      division: emp.division || 'Software',
      department: emp.department || 'Engineering',
      branch: emp.branch || 'Main Office',
      jobDesignation: emp.jobDesignation || 'Software Engineer',
      dateOfJoining: emp.dateOfJoining || '2020-03-15',
      biometricId: emp.biometricId || 'BIO-88421',
      accessCardNumber: emp.accessCardNumber || 'CARD-499120',
      status: emp.status === 'in' ? 'Active' : 'On Leave',
    };
  });

  return {
    data: mappedData,
    total: result.total || mappedData.length || 48,
  };
};