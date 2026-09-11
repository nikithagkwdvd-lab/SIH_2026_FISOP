import { apiClient } from './client';
import {
  ApplicationCreatePayload,
  ApplicationResponse,
  ApplicationStatusResponse,
  ManualReviewRequest,
  WorkflowResumeRequest,
} from '../types/api';

export const applicationsApi = {
  /**
   * Submit a new government service application with client-generated idempotency key
   */
  async submitApplication(
    payload: ApplicationCreatePayload,
    idempotencyKey?: string
  ): Promise<ApplicationResponse> {
    return apiClient<ApplicationResponse>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: idempotencyKey || payload.idempotency_key,
    });
  },

  /**
   * Retrieve full application record by ID
   */
  async getApplication(applicationId: string): Promise<ApplicationResponse> {
    return apiClient<ApplicationResponse>(`/api/applications/${applicationId}`, {
      method: 'GET',
    });
  },

  /**
   * Get detailed workflow status and department progress (polled)
   */
  async getApplicationStatus(applicationId: string): Promise<ApplicationStatusResponse> {
    return apiClient<ApplicationStatusResponse>(`/api/applications/${applicationId}/status`, {
      method: 'GET',
    });
  },

  /**
   * Perform department official / admin manual review (Approve / Reject)
   */
  async performManualReview(
    applicationId: string,
    payload: ManualReviewRequest
  ): Promise<{ message: string; status: string; application_id?: string }> {
    return apiClient<{ message: string; status: string; application_id?: string }>(
      `/api/applications/${applicationId}/manual-review`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Resume stalled workflow in WAITING_FOR_DEPARTMENT
   */
  async resumeWorkflow(
    applicationId: string,
    payload?: WorkflowResumeRequest
  ): Promise<{ message: string; status: string; application_id?: string }> {
    return apiClient<{ message: string; status: string; application_id?: string }>(
      `/api/applications/${applicationId}/resume`,
      {
        method: 'POST',
        body: JSON.stringify(payload || { reason: 'Department service recovered' }),
      }
    );
  },

  /**
   * List applications for current user or all applications for department official / admin
   */
  async getUserApplications(): Promise<ApplicationResponse[]> {
    return apiClient<ApplicationResponse[]>('/api/applications', {
      method: 'GET',
    });
  },

  /**
   * List all applications for a citizen
   */
  async getCitizenApplications(citizenId: string): Promise<ApplicationResponse[]> {
    return apiClient<ApplicationResponse[]>(
      `/api/applications/citizens/${encodeURIComponent(citizenId)}/applications`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Submit a Smart Reapplication linked to a parent rejected application
   */
  async submitReapplication(
    parentApplicationId: string,
    payload: {
      service_type: string;
      idempotency_key?: string;
      application_data?: Record<string, any>;
    },
    idempotencyKey?: string
  ): Promise<ApplicationResponse> {
    return apiClient<ApplicationResponse>(
      `/api/applications/${encodeURIComponent(parentApplicationId)}/reapply`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        idempotencyKey: idempotencyKey || payload.idempotency_key,
      }
    );
  },

  /**
   * Get real DB-backed in-app notifications for authenticated citizen
   */
  async getNotifications(): Promise<{
    total: number;
    unread_count: number;
    notifications: import('../types/api').NotificationItem[];
  }> {
    return apiClient<{
      total: number;
      unread_count: number;
      notifications: import('../types/api').NotificationItem[];
    }>('/api/notifications', {
      method: 'GET',
    });
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(
    notificationId: string
  ): Promise<import('../types/api').NotificationItem> {
    return apiClient<import('../types/api').NotificationItem>(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: 'POST',
      }
    );
  },
};
