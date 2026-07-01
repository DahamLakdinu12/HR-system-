export type MonthlyReportSummary = {
  year: number;
  month: number;
  monthLabel: string;
  incrementEmployees: number;
  totalIncrementAmount: number;
  totalPayableSalary: number;
  approvedEmployees: number;
  declinedEmployees: number;
  approvalRate: number;
};
