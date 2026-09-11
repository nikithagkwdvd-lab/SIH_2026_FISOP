import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.security.jwt_validator import get_current_user, UserPayload
from app.db.models.ai_mapping_suggestion import AiMappingSuggestion
from app.ai.canonical_registry import CanonicalSchemaRegistry
from app.ai.mapping_governance_service import MappingGovernanceService
from app.schemas.ai_schemas import (
    SchemaAnalysisRequest,
    SchemaAnalysisResponse,
    MappingSuggestionResponse,
    MappingApprovalRequest,
    MappingRejectionRequest,
    CanonicalFieldResponse
)

router = APIRouter(prefix="/api/ai", tags=["AI Schema Onboarding & Mapping Governance"])


def _verify_governance_role(user: UserPayload):
    roles_upper = [r.upper() for r in user.roles]
    allowed_roles = {"DEPARTMENT_OFFICIAL", "ADMIN", "OPERATIONS", "DATA_STEWARD"}
    if not allowed_roles.intersection(set(roles_upper)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Mapping approval/rejection requires DEPARTMENT_OFFICIAL, ADMIN, or DATA_STEWARD role"
        )


@router.get(
    "/canonical-schema",
    response_model=List[CanonicalFieldResponse],
    summary="Get Single Source of Truth Canonical Schema Definitions"
)
async def get_canonical_schema():
    """
    Exposes canonical schema field definitions, data types, semantic descriptions, and domain tags.
    """
    registry = CanonicalSchemaRegistry()
    return registry.get_all_fields()


@router.post(
    "/schema/analyze",
    response_model=SchemaAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="AI-Assisted Schema Onboarding & Candidate Mapping Generation"
)
async def analyze_schema(
    payload: SchemaAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Submits a new department schema for AI semantic analysis.
    Generates candidate field mappings with confidence scores and explanations.
    All suggestions default to status = SUGGESTED and requires_human_approval = True.
    AI is NEVER in the runtime data transformation path.
    """
    service = MappingGovernanceService(db)
    actor_id = uuid.UUID(current_user.sub) if len(current_user.sub) == 36 else None

    result = await service.analyze_schema(
        department=payload.department,
        schema_version=payload.schema_version,
        fields=[f.model_dump() for f in payload.fields],
        actor_id=actor_id
    )
    return result


@router.get(
    "/mappings/suggestions",
    response_model=List[MappingSuggestionResponse],
    summary="List AI Mapping Suggestions"
)
async def list_suggestions(
    department: Optional[str] = Query(None, description="Filter suggestions by department"),
    suggestion_status: Optional[str] = Query(None, alias="status", description="Filter by status: SUGGESTED, APPROVED, REJECTED, NEEDS_REVIEW"),
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Retrieves candidate mapping suggestions from PostgreSQL DB.
    """
    stmt = select(AiMappingSuggestion)
    if department:
        stmt = stmt.where(AiMappingSuggestion.department == department.upper())
    if suggestion_status:
        stmt = stmt.where(AiMappingSuggestion.status == suggestion_status.upper())

    stmt = stmt.order_by(AiMappingSuggestion.created_at.desc())
    return db.scalars(stmt).all()


@router.get(
    "/mappings/suggestions/{suggestion_id}",
    response_model=MappingSuggestionResponse,
    summary="Get Mapping Suggestion Details by ID"
)
async def get_suggestion(
    suggestion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    sug = db.get(AiMappingSuggestion, suggestion_id)
    if not sug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapping suggestion '{suggestion_id}' not found"
        )
    return sug


@router.post(
    "/mappings/{suggestion_id}/approve",
    summary="Approve Candidate Field Mapping (Data Steward / Admin Protected)"
)
async def approve_mapping(
    suggestion_id: uuid.UUID,
    payload: Optional[MappingApprovalRequest] = None,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Data Steward / Admin approves candidate field mapping into canonical_mappings registry.
    Requires DEPARTMENT_OFFICIAL, ADMIN, or DATA_STEWARD role in Keycloak JWT token.
    AI cannot approve its own recommendations.
    """
    _verify_governance_role(current_user)
    service = MappingGovernanceService(db)
    reviewer_id = uuid.UUID(current_user.sub) if len(current_user.sub) == 36 else None

    try:
        res = await service.approve_mapping(suggestion_id=suggestion_id, reviewer_id=reviewer_id)
        return res
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/mappings/{suggestion_id}/reject",
    summary="Reject Candidate Field Mapping (Data Steward / Admin Protected)"
)
async def reject_mapping(
    suggestion_id: uuid.UUID,
    payload: Optional[MappingRejectionRequest] = None,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Data Steward / Admin rejects candidate field mapping.
    Record is retained in DB with status = REJECTED for auditability.
    """
    _verify_governance_role(current_user)
    service = MappingGovernanceService(db)
    reviewer_id = uuid.UUID(current_user.sub) if len(current_user.sub) == 36 else None
    reason = payload.reason if payload else "Rejected by data steward"

    try:
        res = await service.reject_mapping(
            suggestion_id=suggestion_id,
            reason=reason,
            reviewer_id=reviewer_id
        )
        return res
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
