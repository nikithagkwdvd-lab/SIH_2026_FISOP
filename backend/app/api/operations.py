import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.security.jwt_validator import get_current_user, UserPayload
from app.security.rbac import verify_citizen_ownership
from app.services.observability_service import ObservabilityService
from app.schemas.operations_schemas import (
    HealthOverviewResponse,
    MetricsOverviewResponse,
    WorkflowStatusOverviewResponse,
    WaitingWorkflowsResponse,
    SlaOverviewResponse,
    DataQualityOverviewResponse,
    ApplicationTimelineResponse,
    ExceptionLogResponse
)

router = APIRouter(prefix="/api/operations", tags=["Operational Intelligence & Observability Layer"])


def verify_operations_role(current_user: UserPayload):
    """
    RBAC dependency ensuring only authorized officials/admins access system-wide operational metadata.
    """
    roles_upper = [r.upper() for r in current_user.roles]
    if "DEPARTMENT_OFFICIAL" not in roles_upper and "ADMIN" not in roles_upper and "OPERATIONS" not in roles_upper:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: System-wide operations APIs require DEPARTMENT_OFFICIAL, OPERATIONS, or ADMIN role"
        )


@router.get(
    "/health",
    response_model=HealthOverviewResponse,
    summary="Get Real-Time Department Microservices Connectivity & Latency Health"
)
async def get_department_health(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    health_data = await service.check_services_health()
    return HealthOverviewResponse(services=health_data)


@router.get(
    "/metrics",
    response_model=MetricsOverviewResponse,
    summary="Get Aggregated Interoperability API Request Metrics & Latencies"
)
async def get_operation_metrics(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_aggregated_metrics()


@router.get(
    "/workflows",
    response_model=WorkflowStatusOverviewResponse,
    summary="Get Operational Breakdown of Application Workflow States"
)
async def get_workflow_operational_status(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_workflow_operational_counts()


@router.get(
    "/waiting",
    response_model=WaitingWorkflowsResponse,
    summary="Get Applications Currently Stuck in WAITING_FOR_DEPARTMENT State"
)
async def get_waiting_workflows(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_waiting_workflows(page=page, size=size)


@router.get(
    "/sla",
    response_model=SlaOverviewResponse,
    summary="Get System-Wide SLA Compliance Metrics & Breach Rate"
)
async def get_sla_overview(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_sla_overview()


@router.get(
    "/data-quality",
    response_model=DataQualityOverviewResponse,
    summary="Get Aggregated Deterministic Data Quality Scores Across Departments"
)
async def get_data_quality_overview(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_data_quality_overview()


@router.get(
    "/exceptions",
    response_model=ExceptionLogResponse,
    summary="Get Paginated Operational Exception Logs Categorized by Error Taxonomy"
)
async def get_exceptions_log(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_operations_role(current_user)
    service = ObservabilityService(db)
    return service.get_exceptions_log(page=page, size=size)


@router.get(
    "/applications/{application_id}/timeline",
    response_model=ApplicationTimelineResponse,
    summary="Reconstruct Complete Chronological Event Timeline for an Application"
)
async def get_application_timeline(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    from app.db.models.application import Application
    from app.db.models.citizen import Citizen
    from app.services.identity_service import IdentityResolutionService

    app_obj = db.get(Application, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )

    user_roles_upper = [r.upper() for r in current_user.roles]
    if "ADMIN" not in user_roles_upper and "OPERATIONS" not in user_roles_upper and "DEPARTMENT_OFFICIAL" not in user_roles_upper:
        identity_service = IdentityResolutionService(db)
        citizen_obj = db.get(Citizen, app_obj.citizen_id)
        target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
        citizen_label = target_identity.canonical_id if target_identity else str(app_obj.citizen_id)
        verify_citizen_ownership(current_user, citizen_label, db)

    service = ObservabilityService(db)
    timeline = service.get_application_timeline(application_id)
    if not timeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )
    return timeline
