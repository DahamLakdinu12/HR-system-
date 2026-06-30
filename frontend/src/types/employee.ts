export type Employee = {
  employeeNumber: string;
  payCode: string;
  fullName: string;
  designation: string;
  grade: string;
  department: string;
  location: string;
  appointmentDate: string;
  promotionDate: string | null;
  incrementDate: string | null;
  currentSalary: number;
  incrementAmount: number;
  stagnationAllowance: number;
  salaryScale: string;
};

export type EmployeeSearchResult = {
  items: Employee[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type DepartmentSummary = {
  name: string;
  employeeCount: number;
};
