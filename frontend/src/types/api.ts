/**
 * Data models and TypeScript types matching backend FastAPI Pydantic schemas.
 * Reference: backend/app/schemas/
 */

export type ServiceType = 'SCHOLARSHIP' | 'HOUSING' | 'PENSION' | 'HEALTHCARE' | string;

export type StageStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'WAITING'
  | 'MANUAL_REVIEW'
  | 'FAILED'
  | string;

export type ApplicationWorkflowStatus =
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
  | 'MANUAL_REVIEW'
  | 'FAILED'
  | string;

export interface DepartmentProgress {
  application: StageStatus;
  consent: StageStatus;
  identity: StageStatus;
  revenue: StageStatus;
  land: StageStatus;
  welfare: StageStatus;
  eligibility: StageStatus;
}

export interface ApplicationCreatePayload {
  service_type: string;
  purpose?: string;
  idempotency_key?: string;
  application_data?: Record<string, any>;
}

export interface DepartmentOfficeInfo {
  name: string;
  code: string;
  zone?: string | null;
  office_address?: string | null;
  contact_info?: string | null;
}

export interface ApplicationResponse {
  id: string;
  application_number: string;
  citizen_id: string;
  canonical_citizen_id?: string;
  service_type: string;
  status: string;
  workflow_instance_id?: string | null;
  trace_id?: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
  officer_remarks?: string | null;
  affected_fields?: string[] | null;
  decision_by?: string | null;
  decision_at?: string | null;
  parent_application_id?: string | null;
  application_data?: Record<string, any> | null;
  waiting_reason?: string | null;
  missing_document_item?: string | null;
  missing_document_dept?: string | null;
}

export interface ApplicationStatusResponse {
  application_id: string;
  service: string;
  status: string;
  progress: DepartmentProgress;
  workflow_instance_id?: string | null;
  trace_id?: string | null;
  waiting_reason?: string | null;
  missing_document_item?: string | null;
  missing_document_dept?: string | null;
  responsible_office?: DepartmentOfficeInfo | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
  officer_remarks?: string | null;
  affected_fields?: string[] | null;
  decision_by?: string | null;
  decision_at?: string | null;
  parent_application_id?: string | null;
}

export interface ManualReviewRequest {
  action: 'APPROVE' | 'REJECT';
  comments?: string;
  rejection_reason?: string;
  officer_remarks?: string;
  affected_fields?: string[];
}

export interface WorkflowResumeRequest {
  reason?: string;
}

export interface ReapplicationCreatePayload {
  service_type: string;
  idempotency_key?: string;
  application_data?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  citizen_id: string;
  application_id?: string | null;
  type: string;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  total: number;
  unread_count: number;
  notifications: NotificationItem[];
}

// Interoperability Schemas
export interface IdentityResolutionResponse {
  canonical_id: string;
  citizen_uuid?: string | null;
  departments: Record<string, string | null>;
}

export interface IncomeInformation {
  source: string;
  person_id?: string | null;
  annual_income?: number | null;
  tax_status?: string | null;
  income_verified?: boolean | null;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_MAPPED' | 'TIMEOUT' | string;
  error_detail?: string | null;
}

export interface PropertyInformation {
  source: string;
  person_id?: string | null;
  survey_number?: string | null;
  property_value?: number | null;
  ownership_status?: string | null;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_MAPPED' | 'TIMEOUT' | string;
  error_detail?: string | null;
}

export interface WelfareInformation {
  source: string;
  person_id?: string | null;
  scheme_code?: string | null;
  eligibility_status?: string | null;
  benefit_status?: string | null;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_MAPPED' | 'TIMEOUT' | string;
  error_detail?: string | null;
}

export interface UnifiedCitizenOverview {
  citizen_id: string;
  citizen_name?: string | null;
  identity: Record<string, string | null>;
  income: IncomeInformation;
  property: PropertyInformation;
  welfare: WelfareInformation;
  sources: string[];
  department_status: Record<string, string>;
  timestamp: string;
}

// Operations & Observability Schemas
export interface ServiceHealthItem {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | string;
  last_checked: string;
  response_time_ms: number;
}

export interface HealthOverviewResponse {
  services: ServiceHealthItem[];
}

export interface DepartmentMetricItem {
  requests: number;
  failures: number;
  average_latency_ms: number;
}

export interface MetricsOverviewResponse {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  failure_rate: number;
  average_latency_ms: number;
  departments: Record<string, DepartmentMetricItem>;
}

export interface WorkflowStatusOverviewResponse {
  total: number;
  running: number;
  waiting: number;
  completed: number;
  failed: number;
  manual_review: number;
  breakdown: Record<string, number>;
}

export interface WaitingWorkflowItem {
  application_id: string;
  application_number: string;
  department: string;
  status: string;
  waiting_since: string;
  waiting_duration_ms: number;
}

export interface WaitingWorkflowsResponse {
  total: number;
  page: number;
  size: number;
  items: WaitingWorkflowItem[];
}

export interface SlaOverviewResponse {
  sla_total: number;
  sla_met: number;
  sla_breached: number;
  breach_rate: number;
  average_processing_time_ms: number;
}

export interface DataQualityOverviewResponse {
  overall_score: number;
  departments: Record<string, number>;
  validation_errors: number;
}

export interface TimelineEventItem {
  event: string;
  timestamp: string;
  application_id?: string | null;
  department?: string | null;
  operation?: string | null;
  status?: string | null;
  duration_ms?: number | null;
  trace_id?: string | null;
  error_category?: string | null;
}

export interface ApplicationTimelineResponse {
  application_id: string;
  application_number: string;
  workflow_status: string;
  events: TimelineEventItem[];
}

export interface ExceptionLogItem {
  id: string;
  application_id?: string | null;
  department: string;
  operation: string;
  http_status?: number | null;
  error_category: string;
  timestamp: string;
}

export interface ExceptionLogResponse {
  total: number;
  page: number;
  size: number;
  items: ExceptionLogItem[];
}

// AI Schema Mapping Governance Schemas
export interface CanonicalFieldResponse {
  name: string;
  type: string;
  description: string;
  domain: string;
  example?: unknown;
}

export interface FieldDefinitionInput {
  name: string;
  type: string;
  description?: string;
}

export interface SchemaAnalysisRequest {
  department: string;
  schema_version: string;
  fields: FieldDefinitionInput[];
}

export interface MappingSuggestionResponse {
  id: string;
  department: string;
  schema_version: string;
  source_field: string;
  source_type: string;
  source_description?: string | null;
  canonical_field: string;
  canonical_type: string;
  confidence_score: number;
  confidence_category: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reason: string;
  candidate_fields?: string[] | null;
  requires_human_approval: boolean;
  status: 'SUGGESTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  model_provider: string;
  model_name: string;
  trace_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchemaAnalysisResponse {
  analysis_id: string;
  department: string;
  schema_version: string;
  suggestions_count: number;
  suggestions: Record<string, unknown>[];
  trace_id: string;
}

export interface MappingApprovalRequest {
  comments?: string;
}

export interface MappingRejectionRequest {
  reason?: string;
}

export interface PlatformHealthResponse {
  status: string;
  service: string;
  version: string;
}
