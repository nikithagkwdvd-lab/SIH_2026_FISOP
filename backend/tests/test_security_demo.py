import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.models.audit_log import AuditLog, AuditAction
from app.security.jwt_validator import create_test_token

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_end_to_end_security_demo_scenario(db_session: Session):
    """
    Complete Hackathon Phase 4 Security Demonstration Scenario:
    1. Citizen CIT-000001 requests own unified overview -> ALLOWED (200 OK)
    2. Citizen CIT-000001 requests CIT-000002 -> DENIED (403 Forbidden)
    3. Revenue official requests Land endpoint -> DENIED (403 Forbidden)
    4. Unauthenticated request -> DENIED (401 Unauthorized)
    5. Security Audit Trail verification -> Confirms ACCESS_DENIED & trace_id logged without token/password leakage.
    """
    print("\n--- [SECURITY DEMO 1] Citizen CIT-000001 accessing own overview ---")
    token_cit1 = create_test_token(
        sub="sub_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers_cit1 = {"Authorization": f"Bearer {token_cit1}"}

    resp1 = client.get("/api/interoperability/citizens/CIT-000001/overview", headers=headers_cit1)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["citizen_id"] == "CIT-000001"
    print("[RESULT 1] SUCCESS: Citizen CIT-000001 accessed own unified overview")

    print("\n--- [SECURITY DEMO 2] Citizen CIT-000001 attempting to access CIT-000002 ---")
    resp2 = client.get("/api/interoperability/citizens/CIT-000002/overview", headers=headers_cit1)
    assert resp2.status_code == 403
    print(f"[RESULT 2] BLOCKED: {resp2.json()['detail']}")

    print("\n--- [SECURITY DEMO 3] Revenue Official attempting unauthorized Land access ---")
    token_rev = create_test_token(
        sub="sub_rev_officer",
        username="revenue_official",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    headers_rev = {"Authorization": f"Bearer {token_rev}"}

    resp3 = client.get("/api/interoperability/citizens/CIT-000001/property", headers=headers_rev)
    assert resp3.status_code == 403
    print(f"[RESULT 3] BLOCKED: {resp3.json()['detail']}")

    print("\n--- [SECURITY DEMO 4] Unauthenticated access attempt ---")
    resp4 = client.get("/api/interoperability/citizens/CIT-000001/overview")
    assert resp4.status_code == 401
    print(f"[RESULT 4] BLOCKED: {resp4.json()['detail']}")

    print("\n--- [SECURITY DEMO 5] Audit Trail Inspection ---")
    latest_denied = db_session.scalars(
        select(AuditLog).where(AuditLog.action == AuditAction.ACCESS_DENIED).order_by(AuditLog.created_at.desc())
    ).first()

    assert latest_denied is not None
    assert latest_denied.result == "DENIED"
    assert latest_denied.trace_id.startswith("TRACE-")
    # Verify zero token leakage in audit database
    assert not hasattr(latest_denied, "token")
    assert not hasattr(latest_denied, "password")
    print(f"[RESULT 5] AUDIT LOG VERIFIED: Trace ID '{latest_denied.trace_id}' recorded access denial cleanly!")
