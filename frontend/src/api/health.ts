import { apiClient } from './client';
import { PlatformHealthResponse } from '../types/api';

export const platformHealthApi = {
  /**
   * Unauthenticated platform health check
   */
  async getHealth(): Promise<PlatformHealthResponse> {
    return apiClient<PlatformHealthResponse>('/health', {
      method: 'GET',
      skipAuth: true,
    });
  },
};
