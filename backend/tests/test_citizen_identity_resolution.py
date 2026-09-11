import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.security.jwt_validator import create_test_token
from app.db.database import get_db, build_engine, get_settings
from app.services.identity_service import IdentityResolutionService
from sqlalchemy.orm import Session

client = TestClient(app)


def test_synthetic_citizen_01_identity_resolution():
    """Verify that synthetic username 'citizen_01' resolves to canonical CIT-000001."""
    settings = get_settings()
    engine = build_engine(settings.database_url)
    with Session(engine) as session:
        service = IdentityResolutionService(session)
        
        res1 = service.resolve_citizen("citizen_01")
        assert res1 is not None
        assert res1.canonical_id == "CIT-000001"

        res2 = service.resolve_citizen("CIT-000001")
        assert res2 is not None
        assert res2.canonical_id == "CIT-000001"
        assert res1.citizen_uuid == res2.citizen_uuid


def test_citizen_01_can_access_own_applications():
    """Verify that Keycloak user 'citizen_01' can access /api/applications/citizens/citizen_01/applications without 403."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="citizen_01"
    )
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/applications/citizens/citizen_01/applications", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_citizen_01_cannot_access_other_citizen_applications():
    """Verify that Keycloak user 'citizen_01' CANNOT access citizen_02 applications (403 Forbidden)."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="citizen_01"
    )
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/applications/citizens/citizen_02/applications", headers=headers)
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()
