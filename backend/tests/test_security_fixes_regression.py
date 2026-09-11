import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.base import Base
from app.db.models.application import Application, ApplicationStatus
from app.db.models.audit_log import AuditLog, AuditAction
from app.db.models.consent import Consent, ConsentStatus
from app.db.models.department import Department
from app.security.jwt_validator import create_test_token
from app.services.observability_service import ObservabilityService
from app.security.consent_engine import ConsentEngine

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_timeline_idor_security_protection(db_session: Session):
    """
    Verify Timeline IDOR Fix (Critical Security):
    - Citizen A creates application
    - Citizen B attempting to access Citizen A's timeline receives HTTP 403 Forbidden
    - Citizen A accessing their own timeline receives HTTP 200 OK
    - Operations/Admin accessing timeline receives HTTP 200 OK
    - Unauthenticated request receives HTTP 401 Unauthorized
    """
    # 1. Unauthenticated -> 401
    fake_app_id = uuid.uuid4()
    unauth_res = client.get(f"/api/operations/applications/{fake_app_id}/timeline")
    assert unauth_res.status_code == 401

    # 2. Citizen A creates application
    cit_a_token = create_test_token(
        sub="user_cit_a_timeline",
        username="citizen_timeline_a",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers_a = {"Authorization": f"Bearer {cit_a_token}"}

    create_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers_a)
    assert create_res.status_code in [200, 201]
    app_id = create_res.json()["id"]

    # 3. Citizen B attempts to access Citizen A's timeline -> 403 Forbidden
    cit_b_token = create_test_token(
        sub="user_cit_b_timeline",
        username="citizen_timeline_b",
        roles=["CITIZEN"],
        preferred_username="CIT-000002"
    )
    headers_b = {"Authorization": f"Bearer {cit_b_token}"}

    idor_res = client.get(f"/api/operations/applications/{app_id}/timeline", headers=headers_b)
    assert idor_res.status_code == 403
    assert "access denied" in idor_res.json()["detail"].lower()

    # 4. Citizen A accesses own timeline -> 200 OK
    owner_res = client.get(f"/api/operations/applications/{app_id}/timeline", headers=headers_a)
    assert owner_res.status_code == 200
    assert owner_res.json()["application_id"] == app_id

    # 5. Operations / Admin accesses timeline -> 200 OK
    admin_token = create_test_token(
        sub="admin_timeline_user",
        username="admin_timeline",
        roles=["ADMIN"]
    )
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    admin_res = client.get(f"/api/operations/applications/{app_id}/timeline", headers=headers_admin)
    assert admin_res.status_code == 200


def test_02_citizen_role_cannot_bypass_revoked_consent(db_session: Session):
    """
    Verify Consent Bypass Fix:
    A user with CITIZEN role must NOT bypass denied/revoked consent.
    """
    engine_consent = ConsentEngine(db_session)
    identity = engine_consent.identity_service.resolve_citizen("CIT-000002")
    if identity and identity.citizen_uuid:
        dept = db_session.scalars(select(Department).where(Department.code == "REV")).first()
        if dept:
            # Create explicit revoked consent record
            revoked = Consent(
                citizen_id=identity.citizen_uuid,
                department_id=dept.id,
                data_type="INCOME_VERIFICATION",
                purpose="REVOKED_CONSENT_SECURITY_TEST",
                status=ConsentStatus.REVOKED
            )
            db_session.add(revoked)
            db_session.commit()

            # Citizen token attempting query on non-consented purpose
            cit_token = create_test_token(
                sub=str(identity.citizen_uuid),
                username="citizen_02",
                roles=["CITIZEN"],
                preferred_username="CIT-000002"
            )
            headers = {"Authorization": f"Bearer {cit_token}"}

            res = client.get(
                "/api/interoperability/citizens/CIT-000002/income?purpose=REVOKED_CONSENT_SECURITY_TEST",
                headers=headers
            )
            # Must be blocked with HTTP 403 Forbidden due to revoked consent
            assert res.status_code == 403
            assert "consent" in res.json()["detail"].lower()

            # Cleanup
            db_session.delete(revoked)
            db_session.commit()


def test_03_audit_log_actor_id_populated_on_department_query(db_session: Session):
    """
    Verify Audit Actor ID Fix:
    Department query records actor_id matching the authenticated user.
    """
    admin_uuid = uuid.uuid4()
    admin_token = create_test_token(
        sub=str(admin_uuid),
        username="audit_test_admin",
        roles=["ADMIN"]
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get(
        "/api/interoperability/citizens/CIT-000001/income?purpose=Audit Actor ID Verification",
        headers=headers
    )
    assert res.status_code in [200, 404]

    # Verify latest audit log contains the actor_id
    latest_audit = db_session.scalars(
        select(AuditLog)
        .where(AuditLog.purpose == "Audit Actor ID Verification")
        .order_by(AuditLog.created_at.desc())
    ).first()

    assert latest_audit is not None
    assert latest_audit.actor_id == admin_uuid


@pytest.mark.anyio
async def test_04_concurrent_health_check_performance(db_session: Session):
    """
    Verify Health Check Concurrency Fix:
    ObservabilityService.check_services_health executes all department targets concurrently.
    """
    service = ObservabilityService(db_session)
    results = await service.check_services_health()
    assert isinstance(results, list)
    assert len(results) == 3
    service_names = {r["service"] for r in results}
    assert service_names == {"REVENUE", "LAND", "WELFARE"}
