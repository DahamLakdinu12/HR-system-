export type EmployeeDataSource = 'hr-staff';

export const employeeDataSourceStorageKey = 'hr-increment.employee-data-source';

export const employeeDataSources: Array<{
  value: EmployeeDataSource;
  label: string;
  shortLabel: string;
}> = [
  { value: 'hr-staff', label: 'HR staff database', shortLabel: 'HR Staff' },
];

export function getEmployeeDataSourceLabel(source: EmployeeDataSource) {
  return employeeDataSources.find((option) => option.value === source)?.shortLabel ?? 'HR Staff';
}
