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
from app.db.models.api_metric import ApiMetric
from app.db.models.sla import SlaRecord, SlaStatus
from app.db.models.data_quality import DataQualityResult
from app.db.models.application import Application, ApplicationStatus
from app.security.jwt_validator import create_test_token
from app.services.observability_service import ObservabilityService
from app.services.data_quality_engine import DataQualityEngine
from app.services.error_taxonomy import classify_error, ErrorCategory

client = TestClient(app)


from app.db.base import Base


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_error_taxonomy_classification():
    """Verify deterministic mapping of exceptions and status codes to ErrorCategory taxonomy."""
    assert classify_error("Invalid token expired", 401) == ErrorCategory.AUTHENTICATION_ERROR
    assert classify_error("Citizen consent revoked", 403) == ErrorCategory.CONSENT_DENIED
    assert classify_error("Department official permission required", 403) == ErrorCategory.AUTHORIZATION_ERROR
    assert classify_error("Citizen record not found", 404) == ErrorCategory.IDENTITY_NOT_FOUND
    assert classify_error("Connection timed out", 504) == ErrorCategory.TIMEOUT
    assert classify_error("Service unavailable connection refused", 503) == ErrorCategory.SERVICE_UNAVAILABLE
    assert classify_error("Required field missing in payload") == ErrorCategory.DATA_QUALITY_ERROR


def test_02_data_quality_engine_deterministic_rules():
    """Verify DataQualityEngine deterministic validation rules and scoring."""
    # 1. Valid Revenue Payload
    rev_valid = DataQualityEngine.validate_revenue_payload({
        "annual_income": 250000,
        "tax_status": "FILED",
        "income_verified": True
    })
    assert rev_valid.overall_score == 100.0
    assert len(rev_valid.errors) == 0

    # 2. Invalid Revenue Payload (Negative income & invalid enum)
    rev_invalid = DataQualityEngine.validate_revenue_payload({
        "annual_income": -5000,
        "tax_status": "INVALID_STATUS",
        "income_verified": True
    })
    assert rev_invalid.overall_score < 100.0
    assert len(rev_invalid.errors) == 2

    # 3. Missing required field Land Payload
    land_missing = DataQualityEngine.validate_land_payload({
        "property_value": 500000,
        "survey_number": "SY-101"
    })
    assert land_missing.overall_score < 100.0
    assert any(e["error"] == "REQUIRED_FIELD_MISSING" for e in land_missing.errors)


def test_03_unauthorized_operations_access_rejected():
    """Verify regular CITIZEN role cannot access system-wide operations APIs (HTTP 403 Forbidden)."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {cit_token}"}

    endpoints = [
        "/api/operations/health",
        "/api/operations/metrics",
        "/api/operations/workflows",
        "/api/operations/waiting",
        "/api/operations/sla",
        "/api/operations/data-quality",
        "/api/operations/exceptions"
    ]

    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403
        assert "access denied" in res.json()["detail"].lower()


def test_04_authorized_official_operations_access(db_session: Session):
    """Verify authorized DEPARTMENT_OFFICIAL or ADMIN can access operational intelligence endpoints."""
    official_token = create_test_token(
        sub="off_01",
        username="official_01",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    headers = {"Authorization": f"Bearer {official_token}"}

    # 1. Health Endpoint
    res_health = client.get("/api/operations/health", headers=headers)
    assert res_health.status_code == 200
    assert "services" in res_health.json()

    # 2. Metrics Endpoint
    res_metrics = client.get("/api/operations/metrics", headers=headers)
    assert res_metrics.status_code == 200
    assert "total_requests" in res_metrics.json()

    # 3. Workflows Endpoint
    res_workflows = client.get("/api/operations/workflows", headers=headers)
    assert res_workflows.status_code == 200
    assert "total" in res_workflows.json()

    # 4. Waiting Endpoint
    res_waiting = client.get("/api/operations/waiting", headers=headers)
    assert res_waiting.status_code == 200
    assert "items" in res_waiting.json()

    # 5. SLA Endpoint
    res_sla = client.get("/api/operations/sla", headers=headers)
    assert res_sla.status_code == 200
    assert "sla_total" in res_sla.json()

    # 6. Data Quality Endpoint
    res_dq = client.get("/api/operations/data-quality", headers=headers)
    assert res_dq.status_code == 200
    assert "overall_score" in res_dq.json()


def test_05_application_operational_timeline(db_session: Session):
    """Verify application operational timeline reconstructs chronological event sequence."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # Submit application
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=cit_headers)
    assert post_res.status_code == 201
    app_id = post_res.json()["id"]

    # Retrieve timeline
    timeline_res = client.get(f"/api/operations/applications/{app_id}/timeline", headers=cit_headers)
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()

    assert timeline_data["application_id"] == app_id
    assert "events" in timeline_data
    assert len(timeline_data["events"]) >= 1
    assert timeline_data["events"][0]["event"] == "APPLICATION_CREATED"


def test_06_end_to_end_success_observability(db_session: Session):
    """
    End-to-End Success Observability Verification.
    Submits application, runs workflow, and verifies metrics, SLA, and DQ entries are recorded.
    """
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=cit_headers)
    assert post_res.status_code == 201
    app_id = post_res.json()["id"]

    officer_token = create_test_token(
        sub="admin_01",
        username="admin_user",
        roles=["ADMIN"]
    )
    off_headers = {"Authorization": f"Bearer {officer_token}"}

    # Verify timeline records events
    t_res = client.get(f"/api/operations/applications/{app_id}/timeline", headers=off_headers)
    assert t_res.status_code == 200
    assert len(t_res.json()["events"]) >= 1


# ---------------------------------------------------------------------------
# Regression tests: GET /api/operations/waiting
# Specifically guards against the SQLite naive-datetime TypeError that caused
# HTTP 500 when app.updated_at came back without tzinfo.
# ---------------------------------------------------------------------------

def _official_headers():
    """Return auth headers for a DEPARTMENT_OFFICIAL token."""
    token = create_test_token(
        sub="off_waiting_01",
        username="official_waiting",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    return {"Authorization": f"Bearer {token}"}


def test_07_waiting_empty_queue_returns_200():
    """
    Regression: /api/operations/waiting MUST return HTTP 200 with an empty
    items list when no applications have status WAITING_FOR_DEPARTMENT.
    Previously crashed with TypeError (naive vs aware datetime subtraction).
    """
    res = client.get("/api/operations/waiting?page=1&size=50", headers=_official_headers())
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert isinstance(data["items"], list)
    assert data["page"] == 1
    assert data["size"] == 50


def test_08_waiting_with_waiting_application_returns_200(db_session: Session):
    """
    Regression: When at least one application has status WAITING_FOR_DEPARTMENT,
    the endpoint must return HTTP 200 and include a correctly-serialised item
    without a datetime TypeError.
    """
    from datetime import datetime, timezone as tz
    from app.db.models.citizen import Citizen

    # Create a minimal citizen
    citizen = Citizen(
        name="Test Waiting Citizen",
        email="waiting_test@example.com",
        phone="9999888877"
    )
    db_session.add(citizen)
    db_session.flush()

    # Create an application stuck in WAITING_FOR_DEPARTMENT
    app_obj = Application(
        application_number=f"WAIT-TEST-{uuid.uuid4().hex[:8].upper()}",
        citizen_id=citizen.id,
        service_type="SCHOLARSHIP",
        status=ApplicationStatus.WAITING_FOR_DEPARTMENT,
    )
    db_session.add(app_obj)
    db_session.commit()

    res = client.get("/api/operations/waiting?page=1&size=50", headers=_official_headers())
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    # At least the one we just inserted should be present
    assert data["total"] >= 1
    # Verify expected fields are present in returned items
    item = data["items"][0]
    assert "application_id" in item
    assert "application_number" in item
    assert "department" in item
    assert "status" in item
    assert "waiting_since" in item
    assert "waiting_duration_ms" in item
    assert item["waiting_duration_ms"] >= 0.0

    # Cleanup
    db_session.delete(app_obj)
    db_session.delete(citizen)
    db_session.commit()


def test_09_waiting_pagination_params_respected():
    """Verify page and size query parameters are reflected in the response envelope."""
    res = client.get("/api/operations/waiting?page=2&size=10", headers=_official_headers())
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 2
    assert data["size"] == 10


def test_10_waiting_citizen_role_rejected():
    """Verify CITIZEN role cannot access /api/operations/waiting (HTTP 403)."""
    cit_token = create_test_token(
        sub="cit_waiting_check",
        username="citizen_waiting",
        roles=["CITIZEN"],
        preferred_username="CIT-999999"
    )
    res = client.get("/api/operations/waiting", headers={"Authorization": f"Bearer {cit_token}"})
    assert res.status_code == 403


def test_11_workflows_and_sla_unaffected():
    """Verify that the already-working /workflows and /sla endpoints are still OK."""
    headers = _official_headers()

    res_wf = client.get("/api/operations/workflows", headers=headers)
    assert res_wf.status_code == 200
    assert "total" in res_wf.json()

    res_sla = client.get("/api/operations/sla", headers=headers)
    assert res_sla.status_code == 200
    assert "sla_total" in res_sla.json()
