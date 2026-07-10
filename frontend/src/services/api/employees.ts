import { apiClient } from './client';
import { DepartmentSummary, Employee, EmployeeLookupOptions, EmployeeSearchResult } from '../../types/employee';

type SearchEmployeesParams = {
  search?: string;
  payCode?: string;
  department?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
};

type DueIncrementsParams = {
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
};

export type UpdateEmployeeRequest = {
  fullName: string;
  designation: string;
  grade: string;
  department: string;
  location: string;
  salaryScale: string;
  appointmentDate: string;
  promotionDate: string | null;
  nextIncrementDate: string | null;
  currentSalary: number;
  basicSalary2027: number;
  incrementAmount: number;
  stagnationAllowance: number;
  salaryPoint: number | null;
};

export type CreateEmployeeRequest = UpdateEmployeeRequest & {
  payCode: string;
  sex: string;
  dateOfBirth: string;
};

export async function searchEmployees(params: SearchEmployeesParams = {}) {
  const response = await apiClient.get<EmployeeSearchResult>('/employees', { params });
  return response.data;
}

export async function getDueIncrements(params: DueIncrementsParams) {
  const response = await apiClient.get<Employee[]>('/employees/due-increments', { params });
  return response.data;
}

export async function getAllDueIncrements(params: Omit<DueIncrementsParams, 'page' | 'pageSize'>) {
  const employees: Employee[] = [];
  const pageSize = 200;

  for (let page = 1; ; page += 1) {
    const batch = await getDueIncrements({ ...params, page, pageSize });
    employees.push(...batch);
    if (batch.length < pageSize) return employees;
  }
}

export async function getDepartments() {
  const response = await apiClient.get<DepartmentSummary[]>('/employees/departments');
  return response.data;
}

export async function getEmployeeLookupOptions() {
  const response = await apiClient.get<EmployeeLookupOptions>('/employees/lookup-options');
  return response.data;
}

export async function updateEmployee(employeeNumber: string, request: UpdateEmployeeRequest) {
  const response = await apiClient.put<Employee>(
    `/employees/${encodeURIComponent(employeeNumber)}`,
    request,
  );
  return response.data;
}

export async function createEmployee(request: CreateEmployeeRequest) {
  const response = await apiClient.post<Employee>('/employees', request);
  return response.data;
}
