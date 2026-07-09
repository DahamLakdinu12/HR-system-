import { apiClient } from './client';

export type AssessmentLeavePeriodPayload = {
  casual?: string | number | null;
  vacation?: string | number | null;
  sick?: string | number | null;
  noPay?: string | number | null;
  lateAttendance?: string | number | null;
};

export type AssessmentLeaveParticularsPayload = {
  previousYear?: AssessmentLeavePeriodPayload | null;
  currentYear?: AssessmentLeavePeriodPayload | null;
};

export type AssessmentFormPayload = {
  employeeNumber: string;
  payCode: string;
  employeeName: string;
  designation: string;
  grade: string;
  department: string;
  location: string;
  appointmentDate: string;
  promotionDate: string | null;
  incrementDate: string;
  currentSalary: number;
  presentBasicSalary: number;
  presentPayableSalary: number;
  salaryPoint: number | null;
  incrementAmount: number;
  convertedSalary: number;
  payableSalary: number;
  gazetteReference: string;
  leaveParticulars?: AssessmentLeaveParticularsPayload | null;
  isStagnationIncrement: boolean;
};

export async function generateAssessmentForm(payload: AssessmentFormPayload) {
  const response = await apiClient.post<Blob>('/increments/assessment-form', payload, {
    responseType: 'blob',
  });

  return response.data;
}

export async function generateAssessmentForms(payloads: AssessmentFormPayload[]) {
  const response = await apiClient.post<Blob>('/increments/assessment-forms', payloads, {
    responseType: 'blob',
  });

  return response.data;
}
