import os
import sys
import uuid
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.base import Base
from app.db.models.application import Application, ApplicationStatus
from app.security.jwt_validator import create_test_token
from app.security.rate_limiter import global_rate_limiter, SlidingWindowRateLimiter
from app.connectors.circuit_breaker import CircuitBreaker, CircuitState, get_circuit_breaker
from app.connectors.land_connector import LandConnector

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_environment_based_department_urls(monkeypatch):
    """Verify connectors read environment-configured service URLs instead of hardcoded strings."""
    monkeypatch.setenv("LAND_API_URL", "http://custom-land-host:9002")
    conn = LandConnector()
    assert conn.base_url == "http://custom-land-host:9002"


def test_02_rate_limiter_threshold_and_http_429():
    """Verify sliding-window rate limiter returns True under threshold and False when exceeded."""
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10.0)
    key = "test_client_ip_123"

    assert limiter.is_allowed(key)[0] is True
    assert limiter.is_allowed(key)[0] is True
    assert limiter.is_allowed(key)[0] is True

    # 4th request exceeds max_requests threshold
    allowed, retry_after = limiter.is_allowed(key)
    assert allowed is False
    assert retry_after >= 1


def test_03_circuit_breaker_state_transitions():
    """Verify CircuitBreaker state machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED."""
    cb = CircuitBreaker("TEST_DEPT", failure_threshold=2, recovery_timeout_seconds=0.5)
    assert cb.state == CircuitState.CLOSED
    assert cb.allow_request() is True

    # Record 2 consecutive failures
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    cb.record_failure()

    # Threshold reached -> OPEN
    assert cb.state == CircuitState.OPEN
    assert cb.allow_request() is False
    assert cb.get_fast_fail_response()["status_code"] == 503

    # Wait recovery timeout
    time.sleep(0.6)
    assert cb.allow_request() is True
    assert cb.state == CircuitState.HALF_OPEN

    # Record success -> CLOSED
    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


def test_04_application_submission_idempotency(db_session: Session):
    """Verify duplicate application submission with same Idempotency-Key returns original application without creating duplicate."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {cit_token}"}
    idempotency_key = f"IDEM-{uuid.uuid4().hex[:8]}"

    # 1. First submission
    res1 = client.post(
        "/api/applications",
        json={"service_type": "SCHOLARSHIP", "idempotency_key": idempotency_key},
        headers=headers
    )
    assert res1.status_code == 201
    data1 = res1.json()
    app_id1 = data1["id"]
    app_num1 = data1["application_number"]

    # 2. Repeated submission with same Idempotency-Key (via header or payload)
    headers_with_key = {
        "Authorization": f"Bearer {cit_token}",
        "Idempotency-Key": idempotency_key
    }
    res2 = client.post(
        "/api/applications",
        json={"service_type": "SCHOLARSHIP"},
        headers=headers_with_key
    )
    assert res2.status_code == 200 or res2.status_code == 201
    data2 = res2.json()

    # Must return exact same application ID and application number
    assert data2["id"] == app_id1
    assert data2["application_number"] == app_num1


def test_05_state_machine_transition_safety(db_session: Session):
    """Verify application state machine blocks invalid resume calls on non-waiting applications."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {cit_token}"}

    # Submit app
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers)
    app_id = post_res.json()["id"]
    app_obj = db_session.get(Application, uuid.UUID(app_id))
    app_obj.status = ApplicationStatus.APPROVED
    db_session.commit()

    # Attempting resume on APPROVED application must return HTTP 400 Bad Request
    resume_res = client.post(f"/api/applications/{app_id}/resume", json={"reason": "Test resume"}, headers=headers)
    assert resume_res.status_code == 400
    assert "not 'waiting_for_department'" in resume_res.json()["detail"].lower()


def test_06_idor_security_protection(db_session: Session):
    """Verify Citizen B cannot view Citizen A's application (HTTP 403 Forbidden)."""
    global_rate_limiter.reset()

    cit_a_token = create_test_token(
        sub="user_cit_idor_a",
        username="citizen_idor_a",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers_a = {"Authorization": f"Bearer {cit_a_token}"}

    # Citizen A creates application
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers_a)
    assert post_res.status_code in [200, 201], f"Failed creating app: {post_res.text}"
    app_id = post_res.json()["id"]

    # Citizen B attempts to view Citizen A's application
    cit_b_token = create_test_token(
        sub="user_cit_idor_b",
        username="citizen_idor_b",
        roles=["CITIZEN"],
        preferred_username="CIT-000002"
    )
    headers_b = {"Authorization": f"Bearer {cit_b_token}"}

    get_res = client.get(f"/api/applications/{app_id}", headers=headers_b)
    assert get_res.status_code == 403
    assert "access denied" in get_res.json()["detail"].lower()


def test_07_operations_rbac_protection():
    """Verify operations APIs require DEPARTMENT_OFFICIAL or ADMIN role."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {cit_token}"}

    res = client.get("/api/operations/health", headers=headers)
    assert res.status_code == 403
