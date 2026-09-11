import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models.audit_log import AuditLog, AuditAction
from app.db.models.department import Department
from app.db.models.citizen import Citizen
from app.services.identity_service import IdentityResolutionService
from app.services.observability_service import ObservabilityService
from app.services.data_quality_engine import DataQualityEngine
from app.services.error_taxonomy import classify_error
from app.connectors.revenue_connector import RevenueConnector
from app.connectors.land_connector import LandConnector
from app.connectors.welfare_connector import WelfareConnector
from app.schemas.interoperability import (
    IdentityResolutionResponse,
    IncomeInformation,
    PropertyInformation,
    WelfareInformation,
    UnifiedCitizenOverview
)


class InteroperabilityService:
    """
    Core Interoperability Service.
    Orchestrates identity resolution, asynchronous connector calls, data normalization,
    partial failure resilience, tamper-evident audit logging, and Phase 6 observability/SLA/DQ tracking.
    """
    def __init__(self, db: Session):
        self.db = db
        self.identity_service = IdentityResolutionService(db)
        self.observability_service = ObservabilityService(db)
        self.revenue_connector = RevenueConnector()
        self.land_connector = LandConnector()
        self.welfare_connector = WelfareConnector()

    def _create_audit_log(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        result: str,
        purpose: Optional[str] = "Routine Interoperability Query",
        actor_id: Optional[uuid.UUID] = None,
        dept_code: Optional[str] = None
    ) -> AuditLog:
        """
        Creates an immutable audit log entry in Supabase platform DB without storing raw payload.
        """
        dept_id: Optional[uuid.UUID] = None
        if dept_code:
            dept = self.db.scalars(select(Department).where(Department.code == dept_code.upper())).first()
            if dept:
                dept_id = dept.id

        audit = AuditLog(
            id=uuid.uuid4(),
            actor_id=actor_id,
            department_id=dept_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            purpose=purpose,
            result=result,
            trace_id=f"TRACE-{uuid.uuid4().hex[:8].upper()}"
        )
        self.db.add(audit)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
        return audit

    async def get_identity(self, citizen_id: str) -> Optional[IdentityResolutionResponse]:
        """Resolve citizen identity mappings."""
        return self.identity_service.resolve_citizen(citizen_id)

    async def get_income(
        self,
        citizen_id: str,
        purpose: str = "Income Verification",
        actor_id: Optional[uuid.UUID] = None
    ) -> IncomeInformation:
        """Fetch normalized income information from Revenue Department."""
        identity = await self.get_identity(citizen_id)
        if not identity:
            self._create_audit_log(
                action=AuditAction.REQUEST_INCOME,
                resource_type="TAX_RECORD_METADATA",
                resource_id=citizen_id,
                result="NOT_FOUND",
                purpose=purpose,
                actor_id=actor_id,
                dept_code="REV"
            )
            return IncomeInformation(
                source="revenue",
                status="NOT_FOUND",
                error_detail=f"Citizen '{citizen_id}' not found in platform registry"
            )

        rev_id = identity.departments.get("REV") or identity.departments.get("revenue")
        income_info = await self.revenue_connector.fetch_normalized_data(rev_id)

        self._create_audit_log(
            action=AuditAction.REQUEST_INCOME,
            resource_type="TAX_RECORD_METADATA",
            resource_id=income_info.person_id or citizen_id,
            result="SUCCESS" if income_info.status == "AVAILABLE" else income_info.status,
            purpose=purpose,
            actor_id=actor_id,
            dept_code="REV"
        )
        return income_info

    async def get_property(
        self,
        citizen_id: str,
        purpose: str = "Property Verification",
        actor_id: Optional[uuid.UUID] = None
    ) -> PropertyInformation:
        """Fetch normalized property information from Land Department."""
        identity = await self.get_identity(citizen_id)
        if not identity:
            self._create_audit_log(
                action=AuditAction.REQUEST_PROPERTY,
                resource_type="LAND_RECORD_METADATA",
                resource_id=citizen_id,
                result="NOT_FOUND",
                purpose=purpose,
                actor_id=actor_id,
                dept_code="LAND"
            )
            return PropertyInformation(
                source="land",
                status="NOT_FOUND",
                error_detail=f"Citizen '{citizen_id}' not found in platform registry"
            )

        land_id = identity.departments.get("LAND") or identity.departments.get("land")
        property_info = await self.land_connector.fetch_normalized_data(land_id)

        self._create_audit_log(
            action=AuditAction.REQUEST_PROPERTY,
            resource_type="LAND_RECORD_METADATA",
            resource_id=property_info.person_id or citizen_id,
            result="SUCCESS" if property_info.status == "AVAILABLE" else property_info.status,
            purpose=purpose,
            actor_id=actor_id,
            dept_code="LAND"
        )
        return property_info

    async def get_welfare(
        self,
        citizen_id: str,
        purpose: str = "Welfare Verification",
        actor_id: Optional[uuid.UUID] = None
    ) -> WelfareInformation:
        """Fetch normalized welfare benefit information from Welfare Department."""
        identity = await self.get_identity(citizen_id)
        if not identity:
            self._create_audit_log(
                action="REQUEST_WELFARE",
                resource_type="WELFARE_RECORD_METADATA",
                resource_id=citizen_id,
                result="NOT_FOUND",
                purpose=purpose,
                actor_id=actor_id,
                dept_code="WEL"
            )
            return WelfareInformation(
                source="welfare",
                status="NOT_FOUND",
                error_detail=f"Citizen '{citizen_id}' not found in platform registry"
            )

        wel_id = identity.departments.get("WEL") or identity.departments.get("welfare") or identity.departments.get("BEN")
        welfare_info = await self.welfare_connector.fetch_normalized_data(wel_id)

        self._create_audit_log(
            action="REQUEST_WELFARE",
            resource_type="WELFARE_RECORD_METADATA",
            resource_id=welfare_info.person_id or citizen_id,
            result="SUCCESS" if welfare_info.status == "AVAILABLE" else welfare_info.status,
            purpose=purpose,
            actor_id=actor_id,
            dept_code="WEL"
        )
        return welfare_info

    async def get_unified_overview(
        self,
        citizen_id: str,
        purpose: str = "Cross-Department Interoperability Verification",
        actor_id: Optional[uuid.UUID] = None
    ) -> Optional[UnifiedCitizenOverview]:
        """
        Key Demonstration Endpoint.
        Concurrently queries Revenue, Land, and Welfare connectors in parallel using asyncio.gather.
        Provides partial failure resilience (returns available data even if one system is down).
        """
        identity = await self.get_identity(citizen_id)
        if not identity:
            self._create_audit_log(
                action=AuditAction.VIEW_CITIZEN,
                resource_type="CITIZEN_UNIFIED_OVERVIEW",
                resource_id=citizen_id,
                result="NOT_FOUND",
                purpose=purpose,
                actor_id=actor_id
            )
            return None

        rev_id = identity.departments.get("REV") or identity.departments.get("revenue")
        land_id = identity.departments.get("LAND") or identity.departments.get("land")
        wel_id = identity.departments.get("WEL") or identity.departments.get("welfare") or identity.departments.get("BEN")

        # Concurrently execute all 3 connectors with Exception safety
        income_res, property_res, welfare_res = await asyncio.gather(
            self.revenue_connector.fetch_normalized_data(rev_id),
            self.land_connector.fetch_normalized_data(land_id),
            self.welfare_connector.fetch_normalized_data(wel_id),
            return_exceptions=True
        )

        # Handle potential unhandled exceptions safely
        if isinstance(income_res, Exception):
            income_info = IncomeInformation(source="revenue", status="UNAVAILABLE", error_detail=str(income_res))
        else:
            income_info = income_res

        if isinstance(property_res, Exception):
            property_info = PropertyInformation(source="land", status="UNAVAILABLE", error_detail=str(property_res))
        else:
            property_info = property_res

        if isinstance(welfare_res, Exception):
            welfare_info = WelfareInformation(source="welfare", status="UNAVAILABLE", error_detail=str(welfare_res))
        else:
            welfare_info = welfare_res

        # Status compilation
        dept_status = {
            "revenue": "SUCCESS" if income_info.status == "AVAILABLE" else income_info.status,
            "land": "SUCCESS" if property_info.status == "AVAILABLE" else property_info.status,
            "welfare": "SUCCESS" if welfare_info.status == "AVAILABLE" else welfare_info.status,
        }

        active_sources = [src for src, st in dept_status.items() if st == "SUCCESS"]
        overall_result = "SUCCESS" if len(active_sources) == 3 else ("PARTIAL_SUCCESS" if len(active_sources) > 0 else "FAILED")

        # Audit log creation
        self._create_audit_log(
            action=AuditAction.VIEW_CITIZEN,
            resource_type="CITIZEN_UNIFIED_OVERVIEW",
            resource_id=identity.canonical_id,
            result=overall_result,
            purpose=purpose,
            actor_id=actor_id
        )

        # Retrieve citizen name if available
        citizen_obj = None
        if identity.citizen_uuid:
            citizen_obj = self.db.get(Citizen, identity.citizen_uuid)

        return UnifiedCitizenOverview(
            citizen_id=identity.canonical_id,
            citizen_name=citizen_obj.name if citizen_obj else None,
            identity={
                "revenue": rev_id,
                "land": land_id,
                "welfare": wel_id
            },
            income=income_info,
            property=property_info,
            welfare=welfare_info,
            sources=active_sources,
            department_status=dept_status,
            timestamp=datetime.now(timezone.utc)
        )
