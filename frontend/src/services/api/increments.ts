import { apiClient } from './client';

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
  salaryPoint: number | null;
  incrementAmount: number;
  convertedSalary: number;
  payableSalary: number;
  gazetteReference: string;
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
