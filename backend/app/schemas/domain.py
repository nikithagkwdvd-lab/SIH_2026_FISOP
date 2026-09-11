from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Base config for ORM mode compatibility
class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Citizen Schemas
class CitizenBase(ORMBaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)


class CitizenCreate(CitizenBase):
    pass


class CitizenResponse(CitizenBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Department Schemas
class DepartmentBase(ORMBaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Application Schemas
class ApplicationBase(ORMBaseModel):
    application_number: str = Field(..., max_length=100)
    citizen_id: UUID
    service_type: str = Field(..., max_length=100)
    status: str = Field(..., max_length=50)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(ApplicationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Consent Schemas
class ConsentBase(ORMBaseModel):
    citizen_id: UUID
    department_id: UUID
    data_type: str = Field(..., max_length=100)
    purpose: str = Field(..., max_length=255)
    status: str = Field(..., max_length=50)
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class ConsentCreate(ConsentBase):
    pass


class ConsentResponse(ConsentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Identity Mapping Schemas
class IdentityMappingBase(ORMBaseModel):
    canonical_citizen_id: UUID
    department_id: UUID
    department_citizen_id: str = Field(..., max_length=100)


class IdentityMappingCreate(IdentityMappingBase):
    pass


class IdentityMappingResponse(IdentityMappingBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Workflow Instance Schemas
class WorkflowInstanceBase(ORMBaseModel):
    application_id: UUID
    workflow_name: str = Field(..., max_length=100)
    workflow_instance_id: Optional[str] = Field(None, max_length=100)
    status: str = Field(..., max_length=50)


class WorkflowInstanceCreate(WorkflowInstanceBase):
    pass


class WorkflowInstanceResponse(WorkflowInstanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Audit Log Schemas
class AuditLogBase(ORMBaseModel):
    actor_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    action: str = Field(..., max_length=100)
    resource_type: str = Field(..., max_length=100)
    resource_id: Optional[str] = Field(None, max_length=255)
    purpose: Optional[str] = Field(None, max_length=255)
    result: str = Field(..., max_length=50)
    trace_id: Optional[str] = Field(None, max_length=100)


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: UUID
    created_at: datetime


# Notification Schemas
class NotificationBase(ORMBaseModel):
    citizen_id: UUID
    application_id: Optional[UUID] = None
    type: str = Field(..., max_length=50)
    message: str
    status: str = Field(..., max_length=50)


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
