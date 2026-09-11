import { apiClient } from './client';
import {
  HealthOverviewResponse,
  MetricsOverviewResponse,
  WorkflowStatusOverviewResponse,
  WaitingWorkflowsResponse,
  SlaOverviewResponse,
  DataQualityOverviewResponse,
  ApplicationTimelineResponse,
  ExceptionLogResponse,
} from '../types/api';

export const operationsApi = {
  /**
   * Real-time microservices connectivity and latency health
   */
  async getMicroservicesHealth(): Promise<HealthOverviewResponse> {
    return apiClient<HealthOverviewResponse>('/api/operations/health', {
      method: 'GET',
    });
  },

  /**
   * Aggregated interoperability request metrics & latencies
   */
  async getOperationMetrics(): Promise<MetricsOverviewResponse> {
    return apiClient<MetricsOverviewResponse>('/api/operations/metrics', {
      method: 'GET',
    });
  },

  /**
   * Operational breakdown of workflow states
   */
  async getWorkflowsOverview(): Promise<WorkflowStatusOverviewResponse> {
    return apiClient<WorkflowStatusOverviewResponse>('/api/operations/workflows', {
      method: 'GET',
    });
  },

  /**
   * Applications stuck in WAITING_FOR_DEPARTMENT
   */
  async getWaitingWorkflows(page = 1, size = 20): Promise<WaitingWorkflowsResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient<WaitingWorkflowsResponse>(`/api/operations/waiting?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * SLA metrics and breach rates
   */
  async getSlaOverview(): Promise<SlaOverviewResponse> {
    return apiClient<SlaOverviewResponse>('/api/operations/sla', {
      method: 'GET',
    });
  },

  /**
   * Data quality scores across departments
   */
  async getDataQualityOverview(): Promise<DataQualityOverviewResponse> {
    return apiClient<DataQualityOverviewResponse>('/api/operations/data-quality', {
      method: 'GET',
    });
  },

  /**
   * Paginated operational exception logs
   */
  async getExceptions(page = 1, size = 20): Promise<ExceptionLogResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient<ExceptionLogResponse>(`/api/operations/exceptions?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Complete chronological event timeline for an application
   */
  async getApplicationTimeline(applicationId: string): Promise<ApplicationTimelineResponse> {
    return apiClient<ApplicationTimelineResponse>(
      `/api/operations/applications/${applicationId}/timeline`,
      {
        method: 'GET',
      }
    );
  },
};
