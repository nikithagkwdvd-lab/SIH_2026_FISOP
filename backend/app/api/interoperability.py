from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.audit_log import AuditAction
from app.services.interoperability_service import InteroperabilityService
from app.security.jwt_validator import get_current_user, UserPayload
from app.security.rbac import verify_citizen_ownership, verify_department_access
from app.security.consent_engine import ConsentEngine
from app.schemas.interoperability import (
    IdentityResolutionResponse,
    IncomeInformation,
    PropertyInformation,
    WelfareInformation,
    UnifiedCitizenOverview
)

router = APIRouter(prefix="/api/interoperability", tags=["Government Digital Interoperability Layer"])


import uuid
from app.services.identity_service import IdentityResolutionService


def _extract_actor_id(current_user: UserPayload, db: Session) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(current_user.sub)
    except ValueError:
        pass
    identity_service = IdentityResolutionService(db)
    res = identity_service.resolve_citizen(current_user.preferred_username or current_user.username)
    if res:
        return res.citizen_uuid
    return None


@router.get(
    "/citizens/{citizen_id}/identity",
    response_model=IdentityResolutionResponse,
    summary="Resolve Canonical Citizen ID to Departmental Legacy Identifiers"
)
async def resolve_citizen_identity(
    citizen_id: str,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_citizen_ownership(current_user, citizen_id, db)
    service = InteroperabilityService(db)
    identity = await service.get_identity(citizen_id)
    if not identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen identifier '{citizen_id}' not found in central registry"
        )
    return identity


@router.get(
    "/citizens/{citizen_id}/income",
    response_model=IncomeInformation,
    summary="Retrieve Normalized Income & Tax Verification from Revenue Department"
)
async def get_citizen_income(
    citizen_id: str,
    purpose: str = Query("Income Verification for Service Application", description="Purpose for data request"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_citizen_ownership(current_user, citizen_id, db)
    verify_department_access(current_user, "REV")
    actor_id = _extract_actor_id(current_user, db)

    consent_engine = ConsentEngine(db)
    has_consent = consent_engine.check_consent(
        citizen_identifier=citizen_id,
        department_code="REV",
        data_type="INCOME_VERIFICATION",
        purpose=purpose
    )

    service = InteroperabilityService(db)
    if not has_consent and "ADMIN" not in [r.upper() for r in current_user.roles]:
        service._create_audit_log(
            action=AuditAction.CONSENT_DENIED,
            resource_type="TAX_RECORD_METADATA",
            resource_id=citizen_id,
            result="DENIED",
            purpose=purpose,
            actor_id=actor_id,
            dept_code="REV"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data access denied: Active citizen consent not found or revoked for Revenue Department"
        )

    return await service.get_income(citizen_id, purpose=purpose, actor_id=actor_id)


@router.get(
    "/citizens/{citizen_id}/property",
    response_model=PropertyInformation,
    summary="Retrieve Normalized Property Ownership from Land Records Department"
)
async def get_citizen_property(
    citizen_id: str,
    purpose: str = Query("Property Ownership Verification", description="Purpose for data request"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_citizen_ownership(current_user, citizen_id, db)
    verify_department_access(current_user, "LAND")
    actor_id = _extract_actor_id(current_user, db)

    consent_engine = ConsentEngine(db)
    has_consent = consent_engine.check_consent(
        citizen_identifier=citizen_id,
        department_code="LAND",
        data_type="PROPERTY_OWNERSHIP",
        purpose=purpose
    )

    service = InteroperabilityService(db)
    if not has_consent and "ADMIN" not in [r.upper() for r in current_user.roles]:
        service._create_audit_log(
            action=AuditAction.CONSENT_DENIED,
            resource_type="LAND_RECORD_METADATA",
            resource_id=citizen_id,
            result="DENIED",
            purpose=purpose,
            actor_id=actor_id,
            dept_code="LAND"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data access denied: Active citizen consent not found or revoked for Land Department"
        )

    return await service.get_property(citizen_id, purpose=purpose, actor_id=actor_id)


@router.get(
    "/citizens/{citizen_id}/welfare",
    response_model=WelfareInformation,
    summary="Retrieve Normalized Social Benefit Entitlement from Welfare Department"
)
async def get_citizen_welfare(
    citizen_id: str,
    purpose: str = Query("Social Welfare Entitlement Check", description="Purpose for data request"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    verify_citizen_ownership(current_user, citizen_id, db)
    verify_department_access(current_user, "WEL")
    actor_id = _extract_actor_id(current_user, db)

    consent_engine = ConsentEngine(db)
    has_consent = consent_engine.check_consent(
        citizen_identifier=citizen_id,
        department_code="WEL",
        data_type="WELFARE_BENEFICIARY_STATUS",
        purpose=purpose
    )

    service = InteroperabilityService(db)
    if not has_consent and "ADMIN" not in [r.upper() for r in current_user.roles]:
        service._create_audit_log(
            action=AuditAction.CONSENT_DENIED,
            resource_type="WELFARE_RECORD_METADATA",
            resource_id=citizen_id,
            result="DENIED",
            purpose=purpose,
            actor_id=actor_id,
            dept_code="WEL"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data access denied: Active citizen consent not found or revoked for Welfare Department"
        )

    return await service.get_welfare(citizen_id, purpose=purpose, actor_id=actor_id)


@router.get(
    "/citizens/{citizen_id}/overview",
    response_model=UnifiedCitizenOverview,
    summary="Unified Cross-Departmental Citizen Overview (Security Protected)"
)
async def get_unified_citizen_overview(
    citizen_id: str,
    purpose: str = Query("Cross-Department Interoperability Overview", description="Purpose for data request"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    actor_id = _extract_actor_id(current_user, db)
    try:
        verify_citizen_ownership(current_user, citizen_id, db)
    except HTTPException as e:
        service = InteroperabilityService(db)
        service._create_audit_log(
            action=AuditAction.ACCESS_DENIED,
            resource_type="CITIZEN_UNIFIED_OVERVIEW",
            resource_id=citizen_id,
            result="DENIED",
            purpose=purpose,
            actor_id=actor_id
        )
        raise e

    service = InteroperabilityService(db)
    overview = await service.get_unified_overview(citizen_id, purpose=purpose, actor_id=actor_id)
    if not overview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen identifier '{citizen_id}' not found in central registry"
        )
    return overview
