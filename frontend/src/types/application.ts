export type ApplicationStatusType =
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'CONSENT_CHECK'
  | 'IDENTITY_RESOLUTION'
  | 'REVENUE_VERIFICATION'
  | 'LAND_VERIFICATION'
  | 'WELFARE_VERIFICATION'
  | 'ELIGIBILITY_EVALUATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITING_FOR_DEPARTMENT'
  | 'MANUAL_REVIEW';

export interface DepartmentProgress {
  application: string;
  consent: string;
  identity: string;
  revenue: string;
  land: string;
  welfare: string;
  eligibility: string;
}

export interface ApplicationItem {
  id: string;
  application_number: string;
  citizen_id: string;
  canonical_citizen_id?: string;
  service_type: string;
  status: ApplicationStatusType | string;
  workflow_instance_id?: string | null;
  trace_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusResponse {
  application_id: string;
  application_number: string;
  citizen_id: string;
  canonical_citizen_id?: string;
  service: string;
  status: ApplicationStatusType | string;
  progress: DepartmentProgress;
  workflow_instance_id?: string | null;
  trace_id?: string | null;
  waiting_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreatePayload {
  service_type: string;
  purpose?: string;
  idempotency_key?: string;
}
