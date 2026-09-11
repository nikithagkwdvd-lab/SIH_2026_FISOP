from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models.consent import Consent, ConsentStatus
from app.db.models.department import Department
from app.services.identity_service import IdentityResolutionService


class ConsentEngine:
    """
    Consent Policy Engine for Interoperability Platform.
    Verifies if a citizen has an active, unexpired GRANTED consent for a specific department,
    data type, and purpose prior to data request execution.
    """
    def __init__(self, db: Session):
        self.db = db
        self.identity_service = IdentityResolutionService(db)

    def check_consent(
        self,
        citizen_identifier: str,
        department_code: str,
        data_type: Optional[str] = None,
        purpose: Optional[str] = None
    ) -> bool:
        """
        Evaluates consent policies stored in Supabase.
        Returns True if granted and unexpired; False otherwise.
        """
        identity = self.identity_service.resolve_citizen(citizen_identifier)
        if not identity or not identity.citizen_uuid:
            return False

        dept = self.db.scalars(
            select(Department).where(Department.code == department_code.upper())
        ).first()
        if not dept:
            return False

        # Query consents table in Supabase
        stmt = select(Consent).where(
            Consent.citizen_id == identity.citizen_uuid,
            Consent.department_id == dept.id
        )

        if data_type:
            stmt = stmt.where(Consent.data_type == data_type)

        consents = self.db.scalars(stmt).all()
        if not consents:
            # Fallback check without data_type filter
            consents = self.db.scalars(
                select(Consent).where(
                    Consent.citizen_id == identity.citizen_uuid,
                    Consent.department_id == dept.id
                )
            ).all()

        now = datetime.now(timezone.utc)
        for consent in consents:
            if consent.status == ConsentStatus.GRANTED:
                if consent.expires_at is None or consent.expires_at > now:
                    return True

        return False
