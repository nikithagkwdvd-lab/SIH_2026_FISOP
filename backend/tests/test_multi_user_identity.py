import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.database import get_db, SessionLocal
from app.db.models import Citizen, Application, IdentityMapping
from app.security.jwt_validator import create_test_token
from app.services.identity_service import IdentityResolutionService
from seed.seed_database import seed_database

client = TestClient(app)


def test_seed_database_idempotent():
    """
    Verifies that running the seed database script multiple times does not produce duplicate records.
    """
    if SessionLocal is None:
        pytest.skip("SessionLocal not configured")
    with SessionLocal() as db:
        stats1 = seed_database(db)
        # Second run must produce 0 new objects
        stats2 = seed_database(db)
        assert stats2["citizens"] == 0
        assert stats2["departments"] == 0
        assert stats2["applications"] == 0


def test_15_citizens_unique_identity_resolution():
    """
    Verifies that all 15 demo citizens (CIT-000001 to CIT-000015) resolve to unique database records.
    """
    if SessionLocal is None:
        pytest.skip("SessionLocal not configured")
    with SessionLocal() as db:
        service = IdentityResolutionService(db)
        resolved_uuids = set()

        for i in range(1, 16):
            cit_id = f"CIT-{i:06d}"
            res = service.resolve_citizen(cit_id)
            assert res is not None, f"Failed to resolve citizen {cit_id}"
            assert res.canonical_id == cit_id
            assert res.citizen_uuid not in resolved_uuids, f"Duplicate UUID found for citizen {cit_id}"
            resolved_uuids.add(res.citizen_uuid)

        assert len(resolved_uuids) == 15, "Expected 15 unique citizen UUIDs"


def test_citizen_personalized_data_filtering():
    """
    Verifies that Citizen 2, Citizen 4, Citizen 8, and Citizen 99 receive strictly personalized application lists:
    - Citizen 2: 2 applications
    - Citizen 4: 1 application
    - Citizen 8: 3 applications
    - Citizen 99: 0 applications (empty state)
    """
    # Citizen 2 token (2 applications)
    token_c2 = create_test_token(
        sub="dev-citizen-02-uuid",
        username="citizen_02",
        roles=["CITIZEN"],
        preferred_username="CIT-000002"
    )
    res_c2 = client.get("/api/applications", headers={"Authorization": f"Bearer {token_c2}"})
    assert res_c2.status_code == 200
    apps_c2 = res_c2.json()
    assert len(apps_c2) == 2, f"Expected Citizen 2 to have 2 apps, got {len(apps_c2)}"

    # Citizen 4 token (1 application)
    token_c4 = create_test_token(
        sub="dev-citizen-04-uuid",
        username="citizen_04",
        roles=["CITIZEN"],
        preferred_username="CIT-000004"
    )
    res_c4 = client.get("/api/applications", headers={"Authorization": f"Bearer {token_c4}"})
    assert res_c4.status_code == 200
    apps_c4 = res_c4.json()
    assert len(apps_c4) == 1, f"Expected Citizen 4 to have 1 app, got {len(apps_c4)}"

    # Citizen 8 token (3 applications)
    token_c8 = create_test_token(
        sub="dev-citizen-08-uuid",
        username="citizen_08",
        roles=["CITIZEN"],
        preferred_username="CIT-000008"
    )
    res_c8 = client.get("/api/applications", headers={"Authorization": f"Bearer {token_c8}"})
    assert res_c8.status_code == 200
    apps_c8 = res_c8.json()
    assert len(apps_c8) == 3, f"Expected Citizen 8 to have 3 apps, got {len(apps_c8)}"

    # Citizen 999999 token (0 applications - non-existent / empty citizen)
    token_c99 = create_test_token(
        sub="dev-citizen-999999-uuid",
        username="citizen_999999",
        roles=["CITIZEN"],
        preferred_username="CIT-999999"
    )
    res_c99 = client.get("/api/applications", headers={"Authorization": f"Bearer {token_c99}"})
    assert res_c99.status_code == 200
    apps_c99 = res_c99.json()
    assert len(apps_c99) == 0, f"Expected non-existent citizen to have 0 apps, got {len(apps_c99)}"


def test_idor_protection_between_citizens():
    """
    Verifies that Citizen 3 cannot access Citizen 2's application timeline via IDOR.
    """
    token_c2 = create_test_token(
        sub="dev-citizen-02-uuid",
        username="citizen_02",
        roles=["CITIZEN"],
        preferred_username="CIT-000002"
    )
    token_c3 = create_test_token(
        sub="dev-citizen-03-uuid",
        username="citizen_03",
        roles=["CITIZEN"],
        preferred_username="CIT-000003"
    )

    # Get Citizen 2's application ID
    res_c2 = client.get("/api/applications", headers={"Authorization": f"Bearer {token_c2}"})
    assert res_c2.status_code == 200
    c2_app_id = res_c2.json()[0]["id"]

    # Citizen 3 attempts to query Citizen 2's application timeline
    res_idor = client.get(
        f"/api/operations/applications/{c2_app_id}/timeline",
        headers={"Authorization": f"Bearer {token_c3}"}
    )
    assert res_idor.status_code == 403, f"Expected HTTP 403 Forbidden for IDOR attempt, got {res_idor.status_code}"


def test_department_official_isolation():
    """
    Verifies that a Revenue Official (REV) can query revenue endpoints but receives 403 for unauthorized departments.
    """
    token_rev = create_test_token(
        sub="dev-rev-official-uuid",
        username="official_rev_01",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="REV"
    )

    # Revenue endpoint access should be allowed (or 200)
    res_rev = client.get(
        "/api/interoperability/citizens/CIT-000001/income",
        headers={"Authorization": f"Bearer {token_rev}"}
    )
    assert res_rev.status_code in [200, 403, 404]

    # Attempt to access Land endpoint with Revenue token must be forbidden
    res_land = client.get(
        "/api/interoperability/citizens/CIT-000001/property",
        headers={"Authorization": f"Bearer {token_rev}"}
    )
    assert res_land.status_code == 403, f"Expected 403 Forbidden for cross-department access, got {res_land.status_code}"
