import { apiClient } from './client';
import { MonthlyReportSummary } from '../../types/report';

type ReportPeriod = {
  year: number;
  month: number;
};

export async function getMonthlyReportSummary(period: ReportPeriod) {
  const response = await apiClient.get<MonthlyReportSummary>(
    '/reports/monthly-summary',
    { params: period },
  );
  return response.data;
}

export async function getIncrementRegisterPdf(period: ReportPeriod) {
  const response = await apiClient.get<Blob>('/reports/increment-register', {
    params: period,
    responseType: 'blob',
  });
  return response.data;
}

export async function getMonthlyApprovalPdf(period: ReportPeriod) {
  const response = await apiClient.get<Blob>('/reports/monthly-approvals', {
    params: period,
    responseType: 'blob',
  });
  return response.data;
}
