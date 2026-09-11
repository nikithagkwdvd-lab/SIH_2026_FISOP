import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models.citizen import Citizen
from app.db.models.department import Department
from app.db.models.identity_mapping import IdentityMapping
from app.schemas.interoperability import IdentityResolutionResponse


class IdentityResolutionService:
    """
    Identity Resolution Service for Interoperability Platform.
    Resolves canonical citizen IDs (CIT-xxxxxx or UUID) to department-specific legacy IDs.
    Does NOT guess identities—uses explicit identity_mappings stored in Supabase platform DB.
    """
    def __init__(self, db: Session):
        self.db = db

    def resolve_citizen(self, citizen_identifier: str) -> Optional[IdentityResolutionResponse]:
        """
        Resolves citizen_identifier to departmental mappings.
        Supports CIT-xxxxxx format, citizen email format, or raw UUID string.
        """
        if not citizen_identifier:
            return None

        citizen: Optional[Citizen] = None
        citizen_id_clean = citizen_identifier.strip()

        # 1. Try resolving as UUID
        try:
            citizen_uuid = uuid.UUID(citizen_id_clean)
            citizen = self.db.scalars(select(Citizen).where(Citizen.id == citizen_uuid)).first()
        except ValueError:
            pass

        # 2. Try resolving as canonical CIT-xxxxxx, synthetic username (citizen_01, citizen_1), or numeric index format
        if not citizen:
            clean_str = citizen_id_clean.strip()
            idx_str = ""
            if clean_str.upper().startswith("CIT-"):
                idx_str = clean_str[4:]
            elif clean_str.lower().startswith("citizen_"):
                idx_str = clean_str[8:]
            elif clean_str.lower().startswith("citizen"):
                idx_str = clean_str[7:]
            else:
                idx_str = clean_str

            if idx_str.isdigit():
                idx_int = int(idx_str)
                target_email = f"citizen.{idx_int:06d}@synthetic-gov.example"
                citizen = self.db.scalars(select(Citizen).where(Citizen.email == target_email)).first()

        # 3. Fallback string match on email or name
        if not citizen:
            citizen = self.db.scalars(
                select(Citizen).where(
                    (Citizen.email == citizen_id_clean) | (Citizen.name.ilike(f"%{citizen_id_clean}%"))
                )
            ).first()

        if not citizen:
            return None

        # Fetch identity mappings
        mappings = self.db.scalars(
            select(IdentityMapping).where(IdentityMapping.canonical_citizen_id == citizen.id)
        ).all()

        dept_map: Dict[str, Optional[str]] = {}
        for m in mappings:
            dept = self.db.get(Department, m.department_id)
            if dept:
                code_up = dept.code.upper()
                code_low = dept.code.lower()
                dept_map[code_up] = m.department_citizen_id
                dept_map[code_low] = m.department_citizen_id
                if code_up == "REV":
                    dept_map["revenue"] = m.department_citizen_id
                elif code_up == "LAND":
                    dept_map["land"] = m.department_citizen_id
                elif code_up in ["WEL", "WELFARE"]:
                    dept_map["welfare"] = m.department_citizen_id

        # Formatting canonical label (CIT-xxxxxx)
        if citizen.email and "citizen." in citizen.email:
            try:
                num_part = citizen.email.split("citizen.")[1].split("@")[0]
                canonical_label = f"CIT-{num_part}"
            except Exception:
                canonical_label = f"CIT-{str(citizen.id)[:8].upper()}"
        elif citizen_id_clean.upper().startswith("CIT-"):
            canonical_label = citizen_id_clean.upper()
        else:
            canonical_label = f"CIT-{str(citizen.id)[:8].upper()}"

        return IdentityResolutionResponse(
            canonical_id=canonical_label,
            citizen_uuid=citizen.id,
            departments=dept_map
        )
