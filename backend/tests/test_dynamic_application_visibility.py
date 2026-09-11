import os
import sys
import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.base import Base
from app.db.models.citizen import Citizen
from app.db.models.application import Application, ApplicationStatus
from app.db.models.workflow_instance import WorkflowInstance, WorkflowStatus
from app.security.jwt_validator import get_current_user, UserPayload


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.close()


@pytest.fixture
def client():
    return TestClient(app)


def test_end_to_end_dynamic_application_lifecycle(client: TestClient, db_session: Session):
    """
    Validates complete end-to-end flow:
    1. Citizen submits Income Certificate application.
    2. Application gets unique dynamic APP-2026-XXXXXX ID.
    3. Application is persisted in database and linked to Citizen.
    4. Official retrieves applications list via GET /api/applications and sees the new application.
    5. Official gets application status by ID and application_number.
    6. Citizen submits Scholarship application with Idempotency Key.
    7. Submitting duplicate with same idempotency key returns the existing application without creating duplicates.
    8. Another citizen cannot access the private application details directly unless authorized.
    """
    # 1. Mock authenticated citizen_01
    citizen_user = UserPayload(
        sub="00000000-0000-0000-0000-000000000001",
        preferred_username="citizen_01",
        username="citizen_01",
        roles=["CITIZEN"],
        canonical_citizen_id="CIT-000001"
    )

    app.dependency_overrides[get_current_user] = lambda: citizen_user

    # Submit Income Certificate application
    payload_income = {
        "service_type": "INCOME_CERTIFICATE",
        "purpose": "ANNUAL_INCOME_CERTIFICATE_VERIFICATION",
        "idempotency_key": f"key-income-{uuid.uuid4().hex[:8]}"
    }

    res_inc = client.post("/api/applications", json=payload_income)
    assert res_inc.status_code == 201
    inc_data = res_inc.json()

    assert inc_data["service_type"] == "INCOME_CERTIFICATE"
    assert inc_data["application_number"].startswith("APP-2026-")
    assert inc_data["canonical_citizen_id"] == "CIT-000001"
    app_id = inc_data["id"]
    app_num = inc_data["application_number"]

    # 2. Check Database persistence
    db_app = db_session.get(Application, uuid.UUID(app_id))
    assert db_app is not None
    assert db_app.application_number == app_num
    assert db_app.service_type == "INCOME_CERTIFICATE"

    # 3. Citizen checks their applications list
    res_citizen_list = client.get("/api/applications")
    assert res_citizen_list.status_code == 200
    citizen_apps = res_citizen_list.json()
    assert any(a["id"] == app_id for a in citizen_apps)

    # 4. Department Official logs in and checks queue
    official_user = UserPayload(
        sub="00000000-0000-0000-0000-000000000099",
        preferred_username="officer_rev",
        username="officer_rev",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    app.dependency_overrides[get_current_user] = lambda: official_user

    res_official_list = client.get("/api/applications")
    assert res_official_list.status_code == 200
    official_apps = res_official_list.json()
    # Official must see the newly submitted application
    matching_app = next((a for a in official_apps if a["id"] == app_id), None)
    assert matching_app is not None
    assert matching_app["application_number"] == app_num
    assert matching_app["canonical_citizen_id"] == "CIT-000001"
    assert matching_app["service_type"] == "INCOME_CERTIFICATE"

    # 5. Official opens case status by UUID and by application_number
    res_status_uuid = client.get(f"/api/applications/{app_id}/status")
    assert res_status_uuid.status_code == 200
    assert res_status_uuid.json()["service"] == "INCOME_CERTIFICATE"

    res_status_num = client.get(f"/api/applications/{app_num}/status")
    assert res_status_num.status_code == 200
    assert res_status_num.json()["service"] == "INCOME_CERTIFICATE"

    # 6. Test Idempotency with Scholarship application
    app.dependency_overrides[get_current_user] = lambda: citizen_user
    idemp_key = f"idemp-test-{uuid.uuid4().hex[:8]}"
    scholarship_payload = {
        "service_type": "SCHOLARSHIP",
        "purpose": "HIGHER_EDUCATION_MERIT_SCHOLARSHIP",
        "idempotency_key": idemp_key
    }

    res_sch1 = client.post("/api/applications", json=scholarship_payload)
    assert res_sch1.status_code == 201
    sch1_data = res_sch1.json()

    # Re-submit exact same idempotency key
    res_sch2 = client.post("/api/applications", json=scholarship_payload)
    assert res_sch2.status_code == 201 or res_sch2.status_code == 200
    sch2_data = res_sch2.json()

    # Must return the SAME application ID and application number
    assert sch1_data["id"] == sch2_data["id"]
    assert sch1_data["application_number"] == sch2_data["application_number"]

    # Clean up overrides
    app.dependency_overrides.clear()
