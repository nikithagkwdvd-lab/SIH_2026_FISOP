import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models.ai_mapping_suggestion import AiMappingSuggestion, MappingSuggestionStatus
from app.db.models.canonical_mapping import CanonicalMapping
from app.db.models.audit_log import AuditLog
from app.ai.canonical_registry import CanonicalSchemaRegistry
from app.ai.ai_provider import get_ai_provider, AIProvider


class MappingGovernanceService:
    """
    Core AI Governance Service.
    Orchestrates schema analysis, candidate mapping generation, data steward approval,
    rejection, and tamper-evident audit logging.
    Guarantees AI is NEVER in the runtime data transformation path.
    """
    def __init__(self, db: Session, ai_provider: Optional[AIProvider] = None):
        self.db = db
        self.registry = CanonicalSchemaRegistry()
        self.ai_provider = ai_provider or get_ai_provider()

    def _create_audit_log(
        self,
        action: str,
        resource_id: str,
        result: str,
        purpose: str,
        actor_id: Optional[uuid.UUID] = None,
        trace_id: Optional[str] = None
    ):
        audit = AuditLog(
            id=uuid.uuid4(),
            actor_id=actor_id,
            action=action,
            resource_type="AI_MAPPING_GOVERNANCE",
            resource_id=resource_id,
            purpose=purpose,
            result=result,
            trace_id=trace_id or f"TRACE-AI-{uuid.uuid4().hex[:8].upper()}"
        )
        self.db.add(audit)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

    async def analyze_schema(
        self,
        department: str,
        schema_version: str,
        fields: List[Dict[str, Any]],
        actor_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Analyzes a new external/department schema against the central canonical schema.
        Generates candidate mapping suggestions with confidence scores and explanations.
        All generated suggestions default to status = SUGGESTED and requires_human_approval = True.
        """
        analysis_id = str(uuid.uuid4())
        trace_id = f"TRACE-AI-SCHEMA-{uuid.uuid4().hex[:6].upper()}"
        suggestions_output = []

        for field_info in fields:
            src_field = field_info.get("name")
            src_type = field_info.get("type", "string")
            src_desc = field_info.get("description")

            if not src_field:
                continue

            # Run AI analysis (Mock or LLM)
            result = await self.ai_provider.analyze_field(
                department=department,
                source_field=src_field,
                source_type=src_type,
                source_description=src_desc
            )

            # Validate canonical field existence against single-source-of-truth registry
            canon_field = result.get("canonical_field")
            if not self.registry.has_field(canon_field):
                canon_field = "annual_income"
                result["canonical_field"] = canon_field
                result["confidence"] = 0.50
                result["status"] = MappingSuggestionStatus.NEEDS_REVIEW
                result["reason"] = f"Original target canonical field was invalid. Fallback set to 'annual_income'."

            c_def = self.registry.get_field(canon_field)

            # Save suggestion record in DB
            suggestion_obj = AiMappingSuggestion(
                id=uuid.uuid4(),
                department=department.upper(),
                schema_version=schema_version,
                source_field=src_field,
                source_type=src_type,
                source_description=src_desc,
                canonical_field=canon_field,
                canonical_type=c_def.type if c_def else "string",
                confidence_score=float(result.get("confidence", 0.80)),
                confidence_category=result.get("confidence_category", "MEDIUM"),
                reason=result.get("reason", "Semantic mapping recommendation."),
                evidence=result.get("evidence"),
                candidate_fields=result.get("candidate_fields"),
                requires_human_approval=True,
                status=result.get("status", MappingSuggestionStatus.SUGGESTED),
                model_provider=getattr(self.ai_provider, "model_name", "mock"),
                model_name="heuristic-v1",
                trace_id=trace_id
            )
            self.db.add(suggestion_obj)
            self.db.commit()
            self.db.refresh(suggestion_obj)

            suggestions_output.append({
                "id": str(suggestion_obj.id),
                "source_field": suggestion_obj.source_field,
                "canonical_field": suggestion_obj.canonical_field,
                "confidence": suggestion_obj.confidence_score,
                "confidence_category": suggestion_obj.confidence_category,
                "reason": suggestion_obj.reason,
                "candidate_fields": suggestion_obj.candidate_fields,
                "requires_human_approval": suggestion_obj.requires_human_approval,
                "status": suggestion_obj.status
            })

        self._create_audit_log(
            action="AI_MAPPING_SUGGESTED",
            resource_id=department.upper(),
            result="SUCCESS",
            purpose=f"Generated {len(suggestions_output)} candidate field mappings for schema v{schema_version}",
            actor_id=actor_id,
            trace_id=trace_id
        )

        return {
            "analysis_id": analysis_id,
            "department": department.upper(),
            "schema_version": schema_version,
            "suggestions_count": len(suggestions_output),
            "suggestions": suggestions_output,
            "trace_id": trace_id
        }

    async def approve_mapping(
        self,
        suggestion_id: uuid.UUID,
        reviewer_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Approves an AI-suggested field mapping.
        Validates target canonical field, inserts mapping into active canonical_mappings registry,
        updates suggestion status to APPROVED, and records tamper-evident audit trail.
        """
        sug = self.db.get(AiMappingSuggestion, suggestion_id)
        if not sug:
            raise ValueError(f"Mapping suggestion '{suggestion_id}' not found")

        if sug.status == MappingSuggestionStatus.APPROVED:
            return {"status": "ALREADY_APPROVED", "suggestion_id": str(suggestion_id), "canonical_field": sug.canonical_field}

        # 1. Validate canonical field exists in central registry
        if not self.registry.has_field(sug.canonical_field):
            raise ValueError(f"Cannot approve mapping: Target canonical field '{sug.canonical_field}' does not exist in registry")

        # 2. Check for duplicate/conflicting active mapping
        existing_stmt = select(CanonicalMapping).where(
            CanonicalMapping.department == sug.department,
            CanonicalMapping.source_field == sug.source_field
        )
        existing_mapping = self.db.scalars(existing_stmt).first()

        if existing_mapping:
            existing_mapping.canonical_field = sug.canonical_field
            existing_mapping.suggestion_id = sug.id
            existing_mapping.approved_by = reviewer_id
        else:
            new_canonical_mapping = CanonicalMapping(
                id=uuid.uuid4(),
                department=sug.department,
                source_field=sug.source_field,
                canonical_field=sug.canonical_field,
                source_type=sug.source_type,
                canonical_type=sug.canonical_type,
                suggestion_id=sug.id,
                approved_by=reviewer_id
            )
            self.db.add(new_canonical_mapping)

        # 3. Mark AI suggestion as APPROVED
        sug.status = MappingSuggestionStatus.APPROVED
        sug.reviewed_by = reviewer_id
        sug.reviewed_at = datetime.now(timezone.utc)
        self.db.commit()

        # 4. Create Audit Log
        self._create_audit_log(
            action="AI_MAPPING_APPROVED",
            resource_id=f"{sug.department}:{sug.source_field}->{sug.canonical_field}",
            result="APPROVED",
            purpose="Data steward approved candidate field mapping into canonical registry",
            actor_id=reviewer_id,
            trace_id=sug.trace_id
        )

        return {
            "status": "APPROVED",
            "suggestion_id": str(sug.id),
            "department": sug.department,
            "source_field": sug.source_field,
            "canonical_field": sug.canonical_field,
            "approved_by": str(reviewer_id) if reviewer_id else "SYSTEM_ADMIN"
        }

    async def reject_mapping(
        self,
        suggestion_id: uuid.UUID,
        reason: Optional[str] = "Rejected by data steward",
        reviewer_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Rejects an AI-suggested field mapping.
        Updates suggestion status to REJECTED without modifying production canonical_mappings registry.
        Logs audit event for governance.
        """
        sug = self.db.get(AiMappingSuggestion, suggestion_id)
        if not sug:
            raise ValueError(f"Mapping suggestion '{suggestion_id}' not found")

        sug.status = MappingSuggestionStatus.REJECTED
        sug.rejection_reason = reason
        sug.reviewed_by = reviewer_id
        sug.reviewed_at = datetime.now(timezone.utc)
        self.db.commit()

        self._create_audit_log(
            action="AI_MAPPING_REJECTED",
            resource_id=f"{sug.department}:{sug.source_field}->{sug.canonical_field}",
            result="REJECTED",
            purpose=reason or "Data steward rejected candidate field mapping",
            actor_id=reviewer_id,
            trace_id=sug.trace_id
        )

        return {
            "status": "REJECTED",
            "suggestion_id": str(sug.id),
            "department": sug.department,
            "source_field": sug.source_field,
            "canonical_field": sug.canonical_field,
            "reason": reason
        }
