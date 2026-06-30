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
  incrementAmount: number;
  payableSalary: number;
  gazetteReference: string;
};

export async function generateAssessmentForm(payload: AssessmentFormPayload) {
  const response = await apiClient.post<Blob>('/increments/assessment-form', payload, {
    responseType: 'blob',
  });

  return response.data;
}
