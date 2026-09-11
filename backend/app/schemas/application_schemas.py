import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreate(BaseModel):
    service_type: str = Field(..., json_schema_extra={"example": "SCHOLARSHIP"}, description="Type of government service requested")
    purpose: Optional[str] = Field("SCHOLARSHIP_ELIGIBILITY", description="Purpose for cross-department verification")
    idempotency_key: Optional[str] = Field(None, description="Client-supplied key to guarantee duplicate-safe application submission")
    # Submitted form data — stored as JSON; enables smart reapplication pre-fill
    application_data: Optional[Dict[str, Any]] = Field(None, description="Submitted form payload (safe fields only — no passwords, JWTs, OTPs)")


class DepartmentOfficeInfo(BaseModel):
    name: str = Field(..., description="Department official name")
    code: str = Field(..., description="Department code, e.g. REV, LAND, WEL")
    zone: Optional[str] = Field(None, description="Administrative zone")
    office_address: Optional[str] = Field(None, description="Designated office address (Prototype Info)")
    contact_info: Optional[str] = Field(None, description="Department contact information (Prototype Info)")

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    application_number: str
    citizen_id: uuid.UUID
    canonical_citizen_id: Optional[str] = None
    service_type: str
    status: str
    workflow_instance_id: Optional[str] = None
    trace_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Decision fields — populated when officer approves or rejects
    rejection_reason: Optional[str] = None
    officer_remarks: Optional[str] = None
    # JSON-decoded list of affected field names
    affected_fields: Optional[List[str]] = None
    decision_by: Optional[str] = None
    decision_at: Optional[str] = None

    # Reapplication link — populated when this application reapplied from a rejected one
    parent_application_id: Optional[str] = None

    # Submitted form payload — returned for citizen to use in ReapplyPage
    application_data: Optional[Dict[str, Any]] = None

    # Missing document fields
    waiting_reason: Optional[str] = None
    missing_document_item: Optional[str] = None
    missing_document_dept: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DepartmentProgress(BaseModel):
    application: str = Field("COMPLETED", description="Application creation step status")
    consent: str = Field("PENDING", description="Consent verification step status")
    identity: str = Field("PENDING", description="Identity mapping resolution status")
    revenue: str = Field("PENDING", description="Revenue/Income verification status")
    land: str = Field("PENDING", description="Land/Property verification status")
    welfare: str = Field("PENDING", description="Welfare/Benefits verification status")
    eligibility: str = Field("PENDING", description="Eligibility evaluation status")


class ApplicationStatusResponse(BaseModel):
    application_id: str
    service: str
    status: str
    progress: DepartmentProgress
    workflow_instance_id: Optional[str] = None
    trace_id: Optional[str] = None
    waiting_reason: Optional[str] = None
    missing_document_item: Optional[str] = None
    missing_document_dept: Optional[str] = None
    responsible_office: Optional[DepartmentOfficeInfo] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Decision fields
    rejection_reason: Optional[str] = None
    officer_remarks: Optional[str] = None
    affected_fields: Optional[List[str]] = None
    decision_by: Optional[str] = None
    decision_at: Optional[str] = None
    parent_application_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ManualReviewRequest(BaseModel):
    action: str = Field(..., example="APPROVE", description="Decision: APPROVE or REJECT")
    comments: Optional[str] = Field(None, description="General official comments (preserved for audit)")
    # Structured rejection fields — rejection_reason REQUIRED when action=REJECT
    rejection_reason: Optional[str] = Field(None, description="Clear reason for rejection (required when action=REJECT)")
    officer_remarks: Optional[str] = Field(None, description="Additional officer remarks (optional)")
    affected_fields: Optional[List[str]] = Field(None, description="List of field names requiring citizen attention")


class WorkflowResumeRequest(BaseModel):
    reason: Optional[str] = Field("Department service recovered", description="Reason for resuming workflow")


class ReapplicationCreate(BaseModel):
    service_type: str = Field(..., description="Must match the original rejected application's service_type")
    idempotency_key: Optional[str] = Field(None, description="Client idempotency key")
    application_data: Optional[Dict[str, Any]] = Field(None, description="New (corrected) submitted form payload")


# ── Notification schemas ───────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: uuid.UUID
    citizen_id: uuid.UUID
    application_id: Optional[uuid.UUID] = None
    type: str
    message: str
    status: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]
