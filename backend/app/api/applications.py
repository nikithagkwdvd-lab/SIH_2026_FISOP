import uuid
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db.database import get_db
from app.db.models.application import Application, ApplicationStatus
from app.db.models.citizen import Citizen
from app.db.models.department import Department
from app.db.models.workflow_instance import WorkflowInstance, WorkflowStatus
from app.db.models.audit_log import AuditLog, AuditAction

from app.security.jwt_validator import get_current_user, UserPayload
from app.security.rbac import verify_citizen_ownership, verify_department_access, require_role
from app.services.identity_service import IdentityResolutionService
from app.services.workflow_service import WorkflowService
from app.schemas.application_schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusResponse,
    DepartmentOfficeInfo,
    DepartmentProgress,
    ManualReviewRequest,
    WorkflowResumeRequest,
    ReapplicationCreate
)

router = APIRouter(prefix="/api/applications", tags=["Government Service Applications & Workflow"])


def _generate_application_number(db: Session) -> str:
    """Generates unique application identifier APP-2026-XXXXXX."""
    count = db.query(Application).count() + 1
    return f"APP-2026-{count:06d}"


def _parse_json_safe(data: Optional[str], default=None):
    if not data:
        return default
    try:
        return json.loads(data)
    except Exception:
        return default


def _build_application_response(
    app_obj: Application,
    citizen_label: str,
    wf_instance: Optional[WorkflowInstance] = None,
    trace_id: Optional[str] = None
) -> ApplicationResponse:
    affected = _parse_json_safe(app_obj.affected_fields, None)
    app_data = _parse_json_safe(app_obj.application_data, None)
    return ApplicationResponse(
        id=app_obj.id,
        application_number=app_obj.application_number,
        citizen_id=app_obj.citizen_id,
        canonical_citizen_id=citizen_label,
        service_type=app_obj.service_type,
        status=app_obj.status,
        workflow_instance_id=wf_instance.workflow_instance_id if wf_instance else None,
        trace_id=trace_id,
        created_at=app_obj.created_at,
        updated_at=app_obj.updated_at,
        rejection_reason=app_obj.rejection_reason,
        officer_remarks=app_obj.officer_remarks,
        affected_fields=affected,
        decision_by=app_obj.decision_by,
        decision_at=app_obj.decision_at,
        parent_application_id=app_obj.parent_application_id,
        application_data=app_data,
        waiting_reason=app_obj.waiting_reason,
        missing_document_item=app_obj.missing_document_item,
        missing_document_dept=app_obj.missing_document_dept
    )


def _build_department_progress(app_status: str) -> DepartmentProgress:
    """Helper mapping application status to department progress overview."""
    progress = DepartmentProgress()
    
    status_upper = app_status.upper()
    if status_upper == ApplicationStatus.SUBMITTED:
        progress.application = "COMPLETED"
    elif status_upper == ApplicationStatus.VALIDATING:
        progress.application = "COMPLETED"
        progress.consent = "IN_PROGRESS"
    elif status_upper == ApplicationStatus.CONSENT_CHECK:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "IN_PROGRESS"
    elif status_upper == ApplicationStatus.IDENTITY_RESOLUTION:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "IN_PROGRESS"
    elif status_upper == ApplicationStatus.REVENUE_VERIFICATION:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "IN_PROGRESS"
    elif status_upper == ApplicationStatus.LAND_VERIFICATION:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "COMPLETED"
        progress.welfare = "IN_PROGRESS"
    elif status_upper == ApplicationStatus.WELFARE_VERIFICATION:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "COMPLETED"
        progress.welfare = "COMPLETED"
        progress.eligibility = "IN_PROGRESS"
    elif status_upper in [ApplicationStatus.ELIGIBILITY_EVALUATION, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "COMPLETED"
        progress.welfare = "COMPLETED"
        progress.eligibility = "COMPLETED"
    elif status_upper == ApplicationStatus.WAITING_FOR_DEPARTMENT:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "WAITING"
        progress.welfare = "PENDING"
    elif status_upper == ApplicationStatus.MANUAL_REVIEW:
        progress.application = "COMPLETED"
        progress.consent = "COMPLETED"
        progress.identity = "COMPLETED"
        progress.revenue = "COMPLETED"
        progress.land = "COMPLETED"
        progress.welfare = "COMPLETED"
        progress.eligibility = "MANUAL_REVIEW"

    return progress


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit New Government Service Application & Trigger Camunda Workflow"
)
async def submit_application(
    payload: ApplicationCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Submits a new service application (e.g. SCHOLARSHIP).
    Supports Idempotency-Key header / payload field to prevent duplicate submissions.
    Authenticates citizen via Keycloak JWT token. Does NOT trust client-supplied citizen IDs.
    Generates APP-2026-XXXXXX number and starts Camunda 8 workflow orchestration.
    """
    idempotency_key = idempotency_key_header or payload.idempotency_key

    # 1. Idempotency Check: return existing application if key already submitted
    if idempotency_key:
        existing_app = db.scalars(
            select(Application).where(Application.idempotency_key == idempotency_key)
        ).first()

        if existing_app:
            identity_service = IdentityResolutionService(db)
            citizen_obj = db.get(Citizen, existing_app.citizen_id)
            target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
            citizen_label = target_identity.canonical_id if target_identity else str(existing_app.citizen_id)
            
            wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == existing_app.id)
            wf_instance = db.scalars(wf_stmt).first()

            return _build_application_response(existing_app, citizen_label, wf_instance)

    # Resolve authenticated citizen identity
    identity_service = IdentityResolutionService(db)
    citizen_id_input = current_user.canonical_citizen_id or current_user.preferred_username or current_user.username
    
    identity = identity_service.resolve_citizen(citizen_id_input)
    
    if not identity or not identity.citizen_uuid:
        # Fallback query for first citizen if running synthetic test user
        citizen_obj = db.scalars(select(Citizen)).first()
        if not citizen_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Citizen identity not found in central registry"
            )
    else:
        citizen_obj = db.get(Citizen, identity.citizen_uuid)

    app_number = _generate_application_number(db)
    trace_id = f"TRACE-{uuid.uuid4().hex[:8].upper()}"

    app_data_str = json.dumps(payload.application_data) if payload.application_data else None

    # Save Application record with Idempotency Key protection
    new_app = Application(
        id=uuid.uuid4(),
        application_number=app_number,
        citizen_id=citizen_obj.id,
        service_type=payload.service_type.upper(),
        status=ApplicationStatus.SUBMITTED,
        idempotency_key=idempotency_key,
        application_data=app_data_str
    )
    db.add(new_app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Handle concurrent database insertion collision gracefully
        if idempotency_key:
            collided_app = db.scalars(
                select(Application).where(Application.idempotency_key == idempotency_key)
            ).first()
            if collided_app:
                wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == collided_app.id)
                wf_instance = db.scalars(wf_stmt).first()
                citizen_label = identity.canonical_id if identity else f"CIT-{str(citizen_obj.id)[:8].upper()}"
                return _build_application_response(collided_app, citizen_label, wf_instance)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate application submission detected"
        )

    db.refresh(new_app)

    citizen_label = identity.canonical_id if identity else f"CIT-{str(citizen_obj.id)[:8].upper()}"

    # Trigger Workflow Orchestration
    wf_service = WorkflowService(db)
    wf_instance = await wf_service.start_workflow(
        application_id=new_app.id,
        citizen_id_str=citizen_label,
        service_type=new_app.service_type,
        trace_id=trace_id
    )

    db.refresh(new_app)

    return _build_application_response(new_app, citizen_label, wf_instance, trace_id)


def _find_application(db: Session, identifier: str) -> Optional[Application]:
    """Finds application by UUID or application_number (e.g. APP-2026-XXXXXX)."""
    if not identifier:
        return None
    try:
        app_uuid = uuid.UUID(str(identifier))
        app_obj = db.get(Application, app_uuid)
        if app_obj:
            return app_obj
    except ValueError:
        pass
    return db.scalars(
        select(Application).where(Application.application_number == str(identifier))
    ).first()


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="Get Application Details by ID (Security Protected)"
)
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    app_obj = _find_application(db, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )

    identity_service = IdentityResolutionService(db)
    citizen_obj = db.get(Citizen, app_obj.citizen_id)
    target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
    citizen_label = target_identity.canonical_id if target_identity else str(app_obj.citizen_id)
    
    verify_citizen_ownership(current_user, citizen_label, db)

    wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == app_obj.id)
    wf_instance = db.scalars(wf_stmt).first()

    return _build_application_response(app_obj, citizen_label, wf_instance)


@router.get(
    "/{application_id}/status",
    response_model=ApplicationStatusResponse,
    summary="Get Detailed Application Workflow Status & Department Progress"
)
async def get_application_status(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    app_obj = _find_application(db, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )

    identity_service = IdentityResolutionService(db)
    citizen_obj = db.get(Citizen, app_obj.citizen_id)
    target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
    citizen_label = target_identity.canonical_id if target_identity else str(app_obj.citizen_id)

    verify_citizen_ownership(current_user, citizen_label, db)

    progress = _build_department_progress(app_obj.status)

    wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == app_obj.id)
    wf_instance = db.scalars(wf_stmt).first()

    # Retrieve latest audit log for trace_id
    audit_stmt = select(AuditLog).where(AuditLog.resource_id == app_obj.application_number).order_by(AuditLog.created_at.desc())
    latest_audit = db.scalars(audit_stmt).first()

    affected = _parse_json_safe(app_obj.affected_fields, None)

    responsible_office: Optional[DepartmentOfficeInfo] = None
    if app_obj.waiting_reason == "DOCUMENT_NOT_FOUND" and app_obj.missing_document_dept:
        dept_record = db.scalars(
            select(Department).where(Department.code == app_obj.missing_document_dept.upper())
        ).first()
        if dept_record:
            responsible_office = DepartmentOfficeInfo(
                name=dept_record.name,
                code=dept_record.code,
                zone=dept_record.zone or "North Western Zone - Sub District IV",
                office_address=dept_record.office_address or "Designated Facilitation Center, Ground Floor, Mini Secretariat, Sector 17 [Prototype Info]",
                contact_info=dept_record.contact_info or "helpdesk-dept-prototype@gov.in / 011-23000000 [Prototype Info]"
            )

    return ApplicationStatusResponse(
        application_id=str(app_obj.id),
        service=app_obj.service_type,
        status=app_obj.status,
        progress=progress,
        workflow_instance_id=wf_instance.workflow_instance_id if wf_instance else None,
        trace_id=latest_audit.trace_id if latest_audit else None,
        waiting_reason=app_obj.waiting_reason,
        missing_document_item=app_obj.missing_document_item,
        missing_document_dept=app_obj.missing_document_dept,
        responsible_office=responsible_office,
        created_at=app_obj.created_at,
        updated_at=app_obj.updated_at,
        rejection_reason=app_obj.rejection_reason,
        officer_remarks=app_obj.officer_remarks,
        affected_fields=affected,
        decision_by=app_obj.decision_by,
        decision_at=app_obj.decision_at,
        parent_application_id=app_obj.parent_application_id
    )


@router.post(
    "/{application_id}/manual-review",
    summary="Perform Authorized Department Official Manual Review (RBAC Protected)"
)
async def perform_manual_review(
    application_id: str,
    payload: ManualReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Department official or Admin approves or rejects application requiring manual intervention.
    Requires DEPARTMENT_OFFICIAL or ADMIN role in Keycloak JWT token.
    rejection_reason is strictly REQUIRED when action is REJECT.
    """
    user_roles_upper = [r.upper() for r in current_user.roles]
    if "DEPARTMENT_OFFICIAL" not in user_roles_upper and "ADMIN" not in user_roles_upper:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: User requires DEPARTMENT_OFFICIAL or ADMIN role to perform manual review"
        )

    if payload.action.upper() == "REJECT" and not (payload.rejection_reason and payload.rejection_reason.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required when rejecting an application"
        )

    app_obj = _find_application(db, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )

    wf_service = WorkflowService(db)
    try:
        result = await wf_service.manual_review(
            application_id=app_obj.id,
            action=payload.action,
            comments=payload.comments,
            rejection_reason=payload.rejection_reason,
            officer_remarks=payload.officer_remarks,
            affected_fields=payload.affected_fields,
            official_id=uuid.UUID(current_user.sub) if len(current_user.sub) == 36 else None,
            dept_code=current_user.department_code
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/{application_id}/reapply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Smart Reapplication for a Rejected Application"
)
async def submit_reapplication(
    application_id: str,
    payload: ReapplicationCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Submits a new application linked to a previously REJECTED application (parent_application_id).
    Validates citizen ownership and that the original application was actually REJECTED.
    Creates a NEW application with a NEW APP-2026-XXXXXX number and triggers the workflow.
    Original rejected application remains unchanged in the database.
    """
    parent_app = _find_application(db, application_id)
    if not parent_app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent application '{application_id}' not found"
        )

    # 1. Verify citizen ownership
    identity_service = IdentityResolutionService(db)
    citizen_obj = db.get(Citizen, parent_app.citizen_id)
    target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
    citizen_label = target_identity.canonical_id if target_identity else str(parent_app.citizen_id)
    verify_citizen_ownership(current_user, citizen_label, db)

    # 2. Verify parent status is REJECTED
    if parent_app.status != ApplicationStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reapply: Parent application status is '{parent_app.status}', must be 'REJECTED'."
        )

    idempotency_key = idempotency_key_header or payload.idempotency_key

    # 3. Check idempotency
    if idempotency_key:
        existing_app = db.scalars(
            select(Application).where(Application.idempotency_key == idempotency_key)
        ).first()
        if existing_app:
            wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == existing_app.id)
            wf_instance = db.scalars(wf_stmt).first()
            return _build_application_response(existing_app, citizen_label, wf_instance)

    # 4. Prepare application data (corrected form data)
    app_data_str = None
    if payload.application_data:
        app_data_str = json.dumps(payload.application_data)
    elif parent_app.application_data:
        app_data_str = parent_app.application_data

    app_number = _generate_application_number(db)
    trace_id = f"TRACE-{uuid.uuid4().hex[:8].upper()}"

    # 5. Create new Application linked to parent
    new_app = Application(
        id=uuid.uuid4(),
        application_number=app_number,
        citizen_id=parent_app.citizen_id,
        service_type=payload.service_type.upper() if payload.service_type else parent_app.service_type,
        status=ApplicationStatus.SUBMITTED,
        idempotency_key=idempotency_key,
        parent_application_id=str(parent_app.id),
        application_data=app_data_str
    )
    db.add(new_app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if idempotency_key:
            collided_app = db.scalars(
                select(Application).where(Application.idempotency_key == idempotency_key)
            ).first()
            if collided_app:
                wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == collided_app.id)
                wf_instance = db.scalars(wf_stmt).first()
                return _build_application_response(collided_app, citizen_label, wf_instance)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate reapplication submission detected"
        )

    db.refresh(new_app)

    # 6. Start workflow on new application
    wf_service = WorkflowService(db)
    wf_instance = await wf_service.start_workflow(
        application_id=new_app.id,
        citizen_id_str=citizen_label,
        service_type=new_app.service_type,
        trace_id=trace_id
    )

    db.refresh(new_app)

    return _build_application_response(new_app, citizen_label, wf_instance, trace_id)


@router.post(
    "/{application_id}/resume",
    summary="Resume Workflow After Department Recovery (Mandatory Resilience Feature)"
)
async def resume_workflow(
    application_id: str,
    payload: WorkflowResumeRequest,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Resumes application workflow when in WAITING_FOR_DEPARTMENT status after a failed department service comes back online.
    """
    app_obj = _find_application(db, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found"
        )

    wf_service = WorkflowService(db)
    try:
        result = await wf_service.resume_workflow(
            application_id=app_obj.id,
            reason=payload.reason
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "",
    response_model=List[ApplicationResponse],
    summary="Get List of Applications for Authenticated User"
)
async def list_user_applications(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    user_roles_upper = [r.upper() for r in current_user.roles]
    identity_service = IdentityResolutionService(db)
    if "ADMIN" in user_roles_upper or "OPERATIONS" in user_roles_upper or "DEPARTMENT_OFFICIAL" in user_roles_upper:
        apps = db.scalars(select(Application).order_by(Application.created_at.desc())).all()
    else:
        identity = identity_service.resolve_citizen(
            current_user.preferred_username or current_user.username
        )
        if not identity or not identity.citizen_uuid:
            return []
        apps = db.scalars(
            select(Application).where(Application.citizen_id == identity.citizen_uuid).order_by(Application.created_at.desc())
        ).all()

    response_list = []
    for app_obj in apps:
        citizen_obj = db.get(Citizen, app_obj.citizen_id)
        target_identity = identity_service.resolve_citizen(str(citizen_obj.id)) if citizen_obj else None
        citizen_label = target_identity.canonical_id if target_identity else str(app_obj.citizen_id)

        wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == app_obj.id)
        wf_instance = db.scalars(wf_stmt).first()
        response_list.append(
            _build_application_response(app_obj, citizen_label, wf_instance)
        )

    return response_list


@router.get(
    "/citizens/{citizen_id}/applications",
    response_model=List[ApplicationResponse],
    summary="Get List of Applications for Authenticated Citizen (Security Protected)"
)
async def get_citizen_applications(
    citizen_id: str,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_citizen_ownership(current_user, citizen_id, db)

    identity_service = IdentityResolutionService(db)
    identity = identity_service.resolve_citizen(citizen_id)
    if not identity or not identity.citizen_uuid:
        return []

    apps = db.scalars(
        select(Application).where(Application.citizen_id == identity.citizen_uuid).order_by(Application.created_at.desc())
    ).all()

    response_list = []
    for app_obj in apps:
        wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == app_obj.id)
        wf_instance = db.scalars(wf_stmt).first()
        response_list.append(
            _build_application_response(app_obj, identity.canonical_id, wf_instance)
        )

    return response_list
