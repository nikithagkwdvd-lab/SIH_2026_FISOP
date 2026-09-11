import { apiClient } from './client';
import {
  IdentityResolutionResponse,
  IncomeInformation,
  PropertyInformation,
  WelfareInformation,
  UnifiedCitizenOverview,
} from '../types/api';

export const interoperabilityApi = {
  /**
   * Resolve canonical citizen ID to departmental identifiers
   */
  async resolveIdentity(citizenId: string): Promise<IdentityResolutionResponse> {
    return apiClient<IdentityResolutionResponse>(
      `/api/interoperability/citizens/${encodeURIComponent(citizenId)}/identity`,
      { method: 'GET' }
    );
  },

  /**
   * Retrieve income & tax verification from Revenue Department
   */
  async getIncome(
    citizenId: string,
    purpose: string = 'Income Verification for Service Application'
  ): Promise<IncomeInformation> {
    const params = new URLSearchParams({ purpose });
    return apiClient<IncomeInformation>(
      `/api/interoperability/citizens/${encodeURIComponent(citizenId)}/income?${params.toString()}`,
      { method: 'GET' }
    );
  },

  /**
   * Retrieve property ownership from Land Records Department
   */
  async getProperty(
    citizenId: string,
    purpose: string = 'Property Ownership Verification'
  ): Promise<PropertyInformation> {
    const params = new URLSearchParams({ purpose });
    return apiClient<PropertyInformation>(
      `/api/interoperability/citizens/${encodeURIComponent(citizenId)}/property?${params.toString()}`,
      { method: 'GET' }
    );
  },

  /**
   * Retrieve social benefit entitlement from Welfare Department
   */
  async getWelfare(
    citizenId: string,
    purpose: string = 'Social Welfare Entitlement Check'
  ): Promise<WelfareInformation> {
    const params = new URLSearchParams({ purpose });
    return apiClient<WelfareInformation>(
      `/api/interoperability/citizens/${encodeURIComponent(citizenId)}/welfare?${params.toString()}`,
      { method: 'GET' }
    );
  },

  /**
   * Retrieve unified cross-departmental overview
   */
  async getUnifiedOverview(
    citizenId: string,
    purpose: string = 'Cross-Department Interoperability Overview'
  ): Promise<UnifiedCitizenOverview> {
    const params = new URLSearchParams({ purpose });
    return apiClient<UnifiedCitizenOverview>(
      `/api/interoperability/citizens/${encodeURIComponent(citizenId)}/overview?${params.toString()}`,
      { method: 'GET' }
    );
  },
};
