export type IncrementWorkflowStatus =
  | 'Draft'
  | 'PendingAssessment'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Finalized'
  | 'ReturnedToIncrement';

export type IncrementWorkflow = {
  id: string;
  employeeNumber: string;
  payCode: string;
  employeeName: string;
  designation: string;
  grade: string;
  department: string;
  location: string;
  dataSource: string;
  incrementDate: string;
  currentSalary: number;
  salaryPoint: number;
  incrementAmount: number;
  convertedSalary: number;
  payableSalary: number;
  stagnationAllowance: number;
  status: IncrementWorkflowStatus;
  createdAtUtc: string;
  modifiedAtUtc: string | null;
};

export type MoveToAssessmentRequest = {
  employeeNumber: string;
  payCode: string;
  employeeName: string;
  designation: string;
  grade: string;
  department: string;
  location: string;
  incrementDate: string;
  currentSalary: number;
  salaryPoint: number;
  incrementAmount: number;
  convertedSalary: number;
  payableSalary: number;
  stagnationAllowance: number;
};

export type WorkflowCounts = {
  increments: number;
  assessments: number;
  approvals: number;
};
