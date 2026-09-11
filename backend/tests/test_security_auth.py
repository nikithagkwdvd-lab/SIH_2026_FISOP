import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.security.jwt_validator import create_test_token

client = TestClient(app)


def test_01_unauthenticated_request_rejected():
    """Verify unauthenticated requests without Bearer token return 401 Unauthorized."""
    response = client.get("/api/interoperability/citizens/CIT-000001/overview")
    assert response.status_code == 401
    assert "not provided" in response.json()["detail"].lower()


def test_02_invalid_token_rejected():
    """Verify request with malformed JWT token returns 401 Unauthorized."""
    headers = {"Authorization": "Bearer invalid_garbage_token_12345"}
    response = client.get("/api/interoperability/citizens/CIT-000001/overview", headers=headers)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_03_expired_token_rejected():
    """Verify expired JWT token returns 401 Unauthorized."""
    expired_token = create_test_token(
        sub="test_user_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001",
        expires_in=-3600  # Expired 1 hour ago
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/interoperability/citizens/CIT-000001/overview", headers=headers)
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_04_valid_token_citizen_own_data_allowed():
    """Verify authenticated citizen can access their own data (CIT-000001)."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/interoperability/citizens/CIT-000001/overview", headers=headers)
    assert response.status_code == 200
    assert response.json()["citizen_id"] == "CIT-000001"


def test_05_citizen_cannot_access_other_citizen_data():
    """Verify citizen CIT-000001 CANNOT access citizen CIT-000002 data (403 Forbidden)."""
    token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"],
        preferred_username="CIT-000001"
    )
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/interoperability/citizens/CIT-000002/overview", headers=headers)
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


def test_06_department_official_unauthorized_access_denied():
    """Verify Revenue Official CANNOT access Land endpoint directly (403 Forbidden)."""
    rev_token = create_test_token(
        sub="rev_officer_01",
        username="revenue_official",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )
    headers = {"Authorization": f"Bearer {rev_token}"}

    # Revenue official querying Land endpoint -> Forbidden
    response = client.get("/api/interoperability/citizens/CIT-000001/property", headers=headers)
    assert response.status_code == 403
    assert "official is not authorized" in response.json()["detail"].lower()
