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
from app.db.models.application import Application, ApplicationStatus
from app.db.models.workflow_instance import WorkflowInstance, WorkflowStatus
from app.db.models.audit_log import AuditLog
from app.db.models.notification import Notification
from app.db.models.citizen import Citizen
from app.security.jwt_validator import create_test_token
from app.services.workflow_service import WorkflowService

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_unauthenticated_submission_rejected():
    """Verify submitting application without Bearer token returns 401 Unauthorized."""
    response = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"})
    assert response.status_code == 401
    assert "not provided" in response.json()["detail"].lower()


def test_02_submit_application_authenticated_citizen(db_session: Session):
    """Verify authenticated citizen can submit scholarship application."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/applications",
        json={"service_type": "SCHOLARSHIP", "purpose": "SCHOLARSHIP_ELIGIBILITY"},
        headers=headers
    )

    assert response.status_code == 201
    data = response.json()

    assert "application_number" in data
    assert data["application_number"].startswith("APP-2026-")
    assert data["service_type"] == "SCHOLARSHIP"
    assert data["workflow_instance_id"] is not None
    assert data["trace_id"].startswith("TRACE-")


def test_03_scholarship_workflow_end_to_end_success(db_session: Session):
    """
    DEMO SCENARIO 1 — End-to-End Success Flow.
    Citizen CIT-000001 submits application.
    Workflow coordinates across Revenue, Land, and Welfare APIs via Interoperability Layer.
    Evaluates eligibility rule (income <= 300,000) -> APPROVED (or WAITING_FOR_DEPARTMENT if APIs offline).
    """
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/applications",
        json={"service_type": "SCHOLARSHIP"},
        headers=headers
    )
    assert response.status_code == 201
    app_data = response.json()
    app_id = app_data["id"]

    # Verify Application status
    app_uuid = uuid.UUID(app_id) if isinstance(app_id, str) else app_id
    app_obj = db_session.get(Application, app_uuid)
    assert app_obj is not None
    assert app_obj.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.WAITING_FOR_DEPARTMENT]

    # Verify WorkflowInstance record
    wf_stmt = select(WorkflowInstance).where(WorkflowInstance.application_id == app_uuid)
    wf_instance = db_session.scalars(wf_stmt).first()
    assert wf_instance is not None
    assert wf_instance.workflow_name == "scholarship-eligibility-workflow"
    assert wf_instance.status in [WorkflowStatus.COMPLETED, WorkflowStatus.WAITING, WorkflowStatus.RUNNING]

    # Verify Notification creation
    notif_stmt = select(Notification).where(Notification.application_id == app_uuid)
    notifications = db_session.scalars(notif_stmt).all()
    assert len(notifications) >= 1

    # Verify Audit Log entries
    audit_stmt = select(AuditLog).where(AuditLog.resource_id == app_obj.application_number)
    audit_logs = db_session.scalars(audit_stmt).all()
    assert len(audit_logs) >= 2


def test_04_get_application_status_breakdown(db_session: Session):
    """Verify application status API returns structured department progress breakdown."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Submit app
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers)
    assert post_res.status_code == 201
    app_id = post_res.json()["id"]

    # Fetch status breakdown
    status_res = client.get(f"/api/applications/{app_id}/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()

    assert status_data["application_id"] == app_id
    assert status_data["service"] == "SCHOLARSHIP"
    assert "progress" in status_data
    assert status_data["progress"]["application"] == "COMPLETED"
    assert status_data["progress"]["revenue"] in ["COMPLETED", "IN_PROGRESS", "WAITING"]
    assert status_data["progress"]["land"] in ["COMPLETED", "IN_PROGRESS", "WAITING"]
    assert status_data["progress"]["welfare"] in ["COMPLETED", "IN_PROGRESS", "WAITING", "PENDING"]


def test_05_land_api_failure_and_resumption_demo_scenario_2(db_session: Session, monkeypatch):
    """
    DEMO SCENARIO 2 — Failure and Recovery.
    1. Land API times out / fails -> Workflow transitions to WAITING_FOR_DEPARTMENT without crashing.
    2. Land API recovers -> POST /api/applications/{id}/resume called -> Workflow resumes and completes.
    """
    from app.connectors.revenue_connector import RevenueConnector
    from app.connectors.land_connector import LandConnector
    from app.connectors.welfare_connector import WelfareConnector
    from app.schemas.interoperability import IncomeInformation, PropertyInformation, WelfareInformation

    # Mock Revenue and Welfare as AVAILABLE for deterministic recovery test
    async def mock_revenue(self, rev_id):
        return IncomeInformation(source="revenue", person_id=rev_id, status="AVAILABLE", annual_income=250000.0)
    async def mock_welfare(self, wel_id):
        return WelfareInformation(source="welfare", person_id=wel_id, status="AVAILABLE", scheme_name="SCHOLAR_GRANT")

    monkeypatch.setattr(RevenueConnector, "fetch_normalized_data", mock_revenue)
    monkeypatch.setattr(WelfareConnector, "fetch_normalized_data", mock_welfare)

    # 1. Simulate Land API timeout/failure
    async def mock_land_timeout(self, department_citizen_id):
        return PropertyInformation(
            source="land",
            person_id=department_citizen_id,
            status="UNAVAILABLE",
            error_detail="Simulated connection timeout"
        )
    monkeypatch.setattr(LandConnector, "fetch_normalized_data", mock_land_timeout)

    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}

    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers)
    assert post_res.status_code == 201
    app_id = post_res.json()["id"]

    # Verify status is WAITING_FOR_DEPARTMENT
    app_uuid = uuid.UUID(app_id) if isinstance(app_id, str) else app_id
    app_obj = db_session.get(Application, app_uuid)
    assert app_obj.status == ApplicationStatus.WAITING_FOR_DEPARTMENT

    # 2. Restore Land API to healthy state
    async def mock_land_success(self, department_citizen_id):
        return PropertyInformation(
            source="land",
            person_id=department_citizen_id,
            status="AVAILABLE",
            property_value=350000.0,
            plots_count=1
        )
    monkeypatch.setattr(LandConnector, "fetch_normalized_data", mock_land_success)

    # 3. Call Resume Endpoint
    resume_res = client.post(f"/api/applications/{app_id}/resume", json={"reason": "Land API service recovered"}, headers=headers)
    assert resume_res.status_code == 200

    # Verify workflow completed successfully
    db_session.refresh(app_obj)
    assert app_obj.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]



def test_06_authorized_manual_review(db_session: Session):
    """Verify authorized department official can perform manual review."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    cit_headers = {"Authorization": f"Bearer {cit_token}"}
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=cit_headers)
    app_id = post_res.json()["id"]

    # Official token
    officer_token = create_test_token(
        sub="off_rev_01",
        username="revenue_official",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    review_payload = {"action": "APPROVE", "comments": "Approved via manual officer verification"}
    review_res = client.post(f"/api/applications/{app_id}/manual-review", json=review_payload, headers=officer_headers)

    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"


def test_07_unauthorized_manual_review_rejected(db_session: Session):
    """Verify regular citizen cannot perform manual review (403 Forbidden)."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {cit_token}"}
    post_res = client.post("/api/applications", json={"service_type": "SCHOLARSHIP"}, headers=headers)
    app_id = post_res.json()["id"]

    review_res = client.post(
        f"/api/applications/{app_id}/manual-review",
        json={"action": "APPROVE"},
        headers=headers
    )
    assert review_res.status_code == 403
    assert "access denied" in review_res.json()["detail"].lower()
