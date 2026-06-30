import { apiClient } from './client';
import { DepartmentSummary, Employee, EmployeeSearchResult } from '../../types/employee';

type SearchEmployeesParams = {
  search?: string;
  payCode?: string;
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

export async function searchEmployees(params: SearchEmployeesParams = {}) {
  const response = await apiClient.get<EmployeeSearchResult>('/employees', { params });
  return response.data;
}

export async function getDueIncrements(params: DueIncrementsParams) {
  const response = await apiClient.get<Employee[]>('/employees/due-increments', { params });
  return response.data;
}

export async function getDepartments() {
  const response = await apiClient.get<DepartmentSummary[]>('/employees/departments');
  return response.data;
}
