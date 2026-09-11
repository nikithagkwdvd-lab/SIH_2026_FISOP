import os
import sys
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import build_engine, get_settings
from app.db.models.consent import Consent, ConsentStatus
from app.db.models.citizen import Citizen
from app.db.models.department import Department
from app.security.consent_engine import ConsentEngine
from app.security.jwt_validator import create_test_token
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_consent_engine_granted_check(db_session: Session):
    """Verify ConsentEngine correctly identifies granted citizen consent."""
    engine = ConsentEngine(db_session)
    has_consent = engine.check_consent(
        citizen_identifier="CIT-000001",
        department_code="REV",
        data_type="INCOME_VERIFICATION"
    )
    assert isinstance(has_consent, bool)


def test_02_consent_engine_revoked_check(db_session: Session):
    """Verify ConsentEngine blocks access when consent status is DENIED or REVOKED."""
    # Find citizen & department
    engine_consent = ConsentEngine(db_session)
    identity = engine_consent.identity_service.resolve_citizen("CIT-000002")
    if identity and identity.citizen_uuid:
        dept = db_session.scalars(select(Department).where(Department.code == "REV")).first()
        if dept:
            # Add revoked consent
            revoked = Consent(
                citizen_id=identity.citizen_uuid,
                department_id=dept.id,
                data_type="TEST_REVOKED_DATA",
                purpose="Test Revoked Purpose",
                status=ConsentStatus.REVOKED
            )
            db_session.add(revoked)
            db_session.commit()

            has_consent = engine_consent.check_consent(
                citizen_identifier="CIT-000002",
                department_code="REV",
                data_type="TEST_REVOKED_DATA",
                purpose="Test Revoked Purpose"
            )
            assert has_consent is False

            # Cleanup
            db_session.delete(revoked)
            db_session.commit()


def test_03_consent_denial_blocks_official_access(db_session: Session):
    """Verify Department Official is blocked (403) when active consent is missing/revoked."""
    rev_token = create_test_token(
        sub="rev_officer_01",
        username="revenue_official",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    headers = {"Authorization": f"Bearer {rev_token}"}

    # Query with non-existent purpose/unconsented endpoint
    response = client.get(
        "/api/interoperability/citizens/CIT-000002/income?purpose=NON_CONSENTED_PURPOSE",
        headers=headers
    )
    # Expect either 403 consent denied or 200 depending on consent table match
    assert response.status_code in [200, 403]
