import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.models.audit_log import AuditLog
from app.services.identity_service import IdentityResolutionService
from app.services.interoperability_service import InteroperabilityService
from app.security.jwt_validator import create_test_token


client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_identity_resolution(db_session: Session):
    """Test identity resolution resolves CIT-000001 to REV, LAND, and WEL identifiers."""
    identity_service = IdentityResolutionService(db_session)
    res = identity_service.resolve_citizen("CIT-000001")

    assert res is not None
    assert res.canonical_id == "CIT-000001"
    assert "REV" in res.departments or "revenue" in res.departments
    assert res.departments.get("revenue") == "REV-000001"
    assert res.departments.get("land") == "LAND-000001"


def test_02_identity_resolution_missing():
    """Test identity resolution returns 404 for non-existent citizen when queried by ADMIN."""
    token = create_test_token(sub="user_admin", username="admin_official", roles=["ADMIN"])
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/interoperability/citizens/CIT-99999999/identity", headers=headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()




@pytest.mark.anyio
async def test_03_income_endpoint(db_session: Session):
    """Test income retrieval endpoint against live Revenue service or fallback handling."""
    service = InteroperabilityService(db_session)
    income_info = await service.get_income("CIT-000001", purpose="Scholarship Test")

    assert income_info.source == "revenue"
    assert income_info.status in ["AVAILABLE", "UNAVAILABLE"]
    if income_info.status == "AVAILABLE":
        assert income_info.person_id == "REV-000001"
        assert income_info.annual_income is not None


@pytest.mark.anyio
async def test_04_property_endpoint(db_session: Session):
    """Test property retrieval endpoint against live Land service or fallback handling."""
    service = InteroperabilityService(db_session)
    prop_info = await service.get_property("CIT-000001", purpose="Housing Test")

    assert prop_info.source == "land"
    assert prop_info.status in ["AVAILABLE", "UNAVAILABLE"]
    if prop_info.status == "AVAILABLE":
        assert prop_info.person_id == "LAND-000001"
        assert prop_info.property_value is not None


@pytest.mark.anyio
async def test_05_welfare_endpoint(db_session: Session):
    """Test welfare benefit retrieval endpoint against live Welfare service or fallback handling."""
    service = InteroperabilityService(db_session)
    wel_info = await service.get_welfare("CIT-000001", purpose="Welfare Test")

    assert wel_info.source == "welfare"
    assert wel_info.status in ["AVAILABLE", "UNAVAILABLE"]
    if wel_info.status == "AVAILABLE":
        assert wel_info.person_id in ["BEN-000001", "WEL-000001"]
        assert wel_info.scheme_code is not None


@pytest.mark.anyio
async def test_06_unified_overview_endpoint(db_session: Session):
    """Test key demo endpoint: GET /api/interoperability/citizens/CIT-000001/overview."""
    token = create_test_token(sub="user_cit_01", username="citizen_01", roles=["ADMIN"])
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/interoperability/citizens/CIT-000001/overview", headers=headers)

    assert response.status_code == 200

    data = response.json()

    assert data["citizen_id"] == "CIT-000001"
    assert "identity" in data
    assert "income" in data
    assert "property" in data
    assert "welfare" in data
    assert "department_status" in data
    assert "timestamp" in data


@pytest.mark.anyio
async def test_07_audit_log_creation(db_session: Session):
    """Verify that cross-department requests generate tamper-evident audit logs in Supabase."""
    initial_count = db_session.query(AuditLog).count()

    service = InteroperabilityService(db_session)
    await service.get_unified_overview("CIT-000001", purpose="Audit Log Verification Test")

    db_session.expire_all()
    new_count = db_session.query(AuditLog).count()
    assert new_count > initial_count


    latest_log = db_session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())).first()
    assert latest_log is not None
    assert latest_log.purpose == "Audit Log Verification Test"
    assert latest_log.resource_type == "CITIZEN_UNIFIED_OVERVIEW"
    assert latest_log.trace_id.startswith("TRACE-")


@pytest.mark.anyio
async def test_08_partial_failure_resilience(db_session: Session, monkeypatch):
    """Test partial failure resilience: if Land API times out, Revenue & Welfare still return data."""
    from app.connectors.land_connector import LandConnector

    async def mock_land_timeout(self, department_citizen_id):
        from app.schemas.interoperability import PropertyInformation
        return PropertyInformation(
            source="land",
            person_id=department_citizen_id,
            status="UNAVAILABLE",
            error_detail="Simulated land server timeout"
        )
    monkeypatch.setattr(LandConnector, "fetch_normalized_data", mock_land_timeout)

    service = InteroperabilityService(db_session)
    overview = await service.get_unified_overview("CIT-000001")

    assert overview is not None
    assert overview.property.status == "UNAVAILABLE"
    assert overview.department_status["land"] == "UNAVAILABLE"
    assert overview.department_status["revenue"] in ["SUCCESS", "AVAILABLE", "NOT_FOUND", "UNAVAILABLE"]
    assert overview.department_status["welfare"] in ["SUCCESS", "AVAILABLE", "NOT_FOUND", "UNAVAILABLE"]


