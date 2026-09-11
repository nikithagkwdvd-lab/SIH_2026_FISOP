from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ServiceHealthItem(BaseModel):
    service: str = Field(..., example="REVENUE")
    status: str = Field(..., example="HEALTHY")
    last_checked: str
    response_time_ms: float = Field(..., example=120.5)


class HealthOverviewResponse(BaseModel):
    services: List[ServiceHealthItem]


class DepartmentMetricItem(BaseModel):
    requests: int
    failures: int
    average_latency_ms: float


class MetricsOverviewResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    failure_rate: float
    average_latency_ms: float
    departments: Dict[str, DepartmentMetricItem]


class WorkflowStatusOverviewResponse(BaseModel):
    total: int
    running: int
    waiting: int
    completed: int
    failed: int
    manual_review: int
    breakdown: Dict[str, int]


class WaitingWorkflowItem(BaseModel):
    application_id: str
    application_number: str
    department: str
    status: str
    waiting_since: str
    waiting_duration_ms: float


class WaitingWorkflowsResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[WaitingWorkflowItem]


class SlaOverviewResponse(BaseModel):
    sla_total: int
    sla_met: int
    sla_breached: int
    breach_rate: float
    average_processing_time_ms: float


class DataQualityOverviewResponse(BaseModel):
    overall_score: float
    departments: Dict[str, float]
    validation_errors: int


class TimelineEventItem(BaseModel):
    event: str
    timestamp: str
    application_id: Optional[str] = None
    department: Optional[str] = None
    operation: Optional[str] = None
    status: Optional[str] = None
    duration_ms: Optional[float] = None
    trace_id: Optional[str] = None
    error_category: Optional[str] = None


class ApplicationTimelineResponse(BaseModel):
    application_id: str
    application_number: str
    workflow_status: str
    events: List[TimelineEventItem]


class ExceptionLogItem(BaseModel):
    id: str
    application_id: Optional[str] = None
    department: str
    operation: str
    http_status: Optional[int] = None
    error_category: str
    timestamp: str


class ExceptionLogResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[ExceptionLogItem]
