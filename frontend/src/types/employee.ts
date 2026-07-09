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
  presentBasicSalary: number;
  presentPayableSalary: number;
  salaryPoint: number | null;
  incrementAmount: number;
  convertedSalary: number;
  payableSalary: number;
  stagnationAllowance: number;
  salaryScale: string;
  salaryConversionStatus: 'Applied' | 'MaximumPoint' | 'Stagnation' | 'Unmatched' | 'Unavailable';
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

export type EmployeeLookupOptions = {
  departments: string[];
  locations: string[];
  salaryScales: string[];
  grades: string[];
  designations: string[];
};
