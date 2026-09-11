import { apiClient } from './client';
import {
  CanonicalFieldResponse,
  SchemaAnalysisRequest,
  SchemaAnalysisResponse,
  MappingSuggestionResponse,
  MappingApprovalRequest,
  MappingRejectionRequest,
} from '../types/api';

export const aiGovernanceApi = {
  /**
   * Single Source of Truth Canonical Schema Definitions
   */
  async getCanonicalSchema(): Promise<CanonicalFieldResponse[]> {
    return apiClient<CanonicalFieldResponse[]>('/api/ai/canonical-schema', {
      method: 'GET',
    });
  },

  /**
   * Submit incoming department schema for AI semantic analysis
   */
  async analyzeSchema(payload: SchemaAnalysisRequest): Promise<SchemaAnalysisResponse> {
    return apiClient<SchemaAnalysisResponse>('/api/ai/schema/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List AI Mapping Suggestions with optional department and status filters
   */
  async listSuggestions(
    department?: string,
    status?: string
  ): Promise<MappingSuggestionResponse[]> {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (status) params.append('status', status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<MappingSuggestionResponse[]>(`/api/ai/mappings/suggestions${query}`, {
      method: 'GET',
    });
  },

  /**
   * Get single mapping suggestion detail
   */
  async getSuggestion(suggestionId: string): Promise<MappingSuggestionResponse> {
    return apiClient<MappingSuggestionResponse>(`/api/ai/mappings/suggestions/${suggestionId}`, {
      method: 'GET',
    });
  },

  /**
   * Approve candidate field mapping (Human-in-the-loop)
   */
  async approveMapping(
    suggestionId: string,
    payload?: MappingApprovalRequest
  ): Promise<{ message: string; id: string; canonical_field: string }> {
    return apiClient<{ message: string; id: string; canonical_field: string }>(
      `/api/ai/mappings/${suggestionId}/approve`,
      {
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined,
      }
    );
  },

  /**
   * Reject candidate field mapping (Human-in-the-loop)
   */
  async rejectMapping(
    suggestionId: string,
    payload?: MappingRejectionRequest
  ): Promise<{ message: string; id: string; status: string; reason: string }> {
    return apiClient<{ message: string; id: string; status: string; reason: string }>(
      `/api/ai/mappings/${suggestionId}/reject`,
      {
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined,
      }
    );
  },
};
