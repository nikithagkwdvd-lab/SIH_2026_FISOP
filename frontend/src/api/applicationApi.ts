import { apiClient } from './client';
import {
  ApplicationItem,
  ApplicationStatusResponse,
  ApplicationCreatePayload,
} from '../types/application';

export async function getCitizenApplications(citizenId: string): Promise<ApplicationItem[]> {
  return apiClient<ApplicationItem[]>(`/api/applications/citizens/${citizenId}/applications`);
}

export async function getApplicationStatus(applicationId: string): Promise<ApplicationStatusResponse> {
  return apiClient<ApplicationStatusResponse>(`/api/applications/${applicationId}/status`);
}

export async function submitApplication(
  payload: ApplicationCreatePayload,
  idempotencyKey?: string
): Promise<ApplicationItem> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return apiClient<ApplicationItem>('/api/applications', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
