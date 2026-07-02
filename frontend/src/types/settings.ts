export type ApplicationSettings = {
  organizationName: string;
  organizationCode: string;
  financialYearStartMonth: number;
  currency: string;
  defaultIncrementMonth: number;
  assessmentReminderDays: number;
  requireApproval: boolean;
  emailNotifications: boolean;
  approvalNotifications: boolean;
  monthlyReportNotifications: boolean;
  compactTables: boolean;
};

export const defaultApplicationSettings: ApplicationSettings = {
  organizationName: 'Board of Investment of Sri Lanka',
  organizationCode: 'BOI',
  financialYearStartMonth: 0,
  currency: 'LKR',
  defaultIncrementMonth: new Date().getMonth(),
  assessmentReminderDays: 7,
  requireApproval: true,
  emailNotifications: true,
  approvalNotifications: true,
  monthlyReportNotifications: true,
  compactTables: false,
};
