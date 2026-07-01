import { apiClient } from './client';
import {
  IncrementWorkflow,
  MoveToAssessmentRequest,
  WorkflowCounts,
} from '../../types/incrementWorkflow';

export async function getIncrementWorkflows(status?: 'assessments' | 'approvals' | 'approved') {
  const response = await apiClient.get<IncrementWorkflow[]>('/increment-workflows', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getWorkflowCounts(from: string, to: string) {
  const response = await apiClient.get<WorkflowCounts>('/increment-workflows/counts', {
    params: { from, to },
  });
  return response.data;
}

export async function moveToAssessment(request: MoveToAssessmentRequest) {
  const response = await apiClient.post<IncrementWorkflow>('/increment-workflows', request);
  return response.data;
}

export async function approveIncrement(id: string) {
  const response = await apiClient.post<IncrementWorkflow>(`/increment-workflows/${id}/approve`);
  return response.data;
}

export async function rejectIncrement(id: string) {
  const response = await apiClient.post<IncrementWorkflow>(`/increment-workflows/${id}/reject`);
  return response.data;
}

export async function returnToIncrements(id: string) {
  const response = await apiClient.post<IncrementWorkflow>(
    `/increment-workflows/${id}/return-to-increments`,
  );
  return response.data;
}

export function notifyWorkflowUpdated() {
  window.dispatchEvent(new Event('increment-workflow-updated'));
}
