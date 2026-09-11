import os
import sys
import uuid
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.models.application import Application, ApplicationStatus
from app.db.models.citizen import Citizen
from app.db.models.department import Department
from app.db.models.notification import Notification
from app.db.models.audit_log import AuditLog
from app.db.models.identity_mapping import IdentityMapping
from app.db.models.workflow_instance import WorkflowInstance
from app.security.jwt_validator import get_current_user, UserPayload
from app.schemas.interoperability import IncomeInformation, PropertyInformation, WelfareInformation


client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_citizen_specific_missing_document_and_available_flows(db_session: Session):
    """
    Explicit test suite verifying:
    - TEST 1: Citizen A -> document AVAILABLE -> workflow continues.
    - TEST 2: Citizen B -> document NOT_FOUND -> workflow waits.
    - TEST 3: Citizen A submits another application -> still receives AVAILABLE behaviour.
    - TEST 4: Citizen B submits another application -> deterministic NOT_FOUND behaviour remains consistent.
    - TEST 5: Citizen A and B applications exist simultaneously -> states remain independent.
    - TEST 6: Officer queue contains both applications -> only Citizen B's application is WAITING FOR DOCUMENT.
    - TEST 7: Citizen A does NOT receive Citizen B's missing-document notification.
    - TEST 8: Technical timeout -> DEPT_UNAVAILABLE, NOT DOCUMENT_NOT_FOUND.
    - TEST 9: Resume workflow -> connector re-queried -> document becomes AVAILABLE -> workflow completes.
    """
    # ── 1. Setup isolated Test Citizen A and Test Citizen B ────────────────────
    dept_rev = db_session.scalars(select(Department).where(Department.code == "REV")).first()
    dept_land = db_session.scalars(select(Department).where(Department.code == "LAND")).first()
    dept_wel = db_session.scalars(select(Department).where(Department.code == "WEL")).first()

    # Test Citizen A (Document Available) - Use Seeded Citizen 91 (REV-000091)
    cit_a = db_session.scalars(select(Citizen).where(Citizen.email == "citizen.000091@synthetic-gov.example")).first()
    if not cit_a:
        cit_a = Citizen(
            id=uuid.uuid4(),
            name="Test Citizen A (Available)",
            phone="9876000091",
            email="citizen.000091@synthetic-gov.example"
        )
        db_session.add(cit_a)
        db_session.commit()
        db_session.refresh(cit_a)

        if dept_rev:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_a.id, department_id=dept_rev.id, department_citizen_id="REV-000091"))
        if dept_land:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_a.id, department_id=dept_land.id, department_citizen_id="LAND-000091"))
        if dept_wel:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_a.id, department_id=dept_wel.id, department_citizen_id="WEL-000091"))
        db_session.commit()

    citizen_a_id = cit_a.id
    citizen_a_canonical = "CIT-000091"

    # Test Citizen B (Document Not Found) - Use Seeded Citizen 92 (REV-000092)
    cit_b = db_session.scalars(select(Citizen).where(Citizen.email == "citizen.000092@synthetic-gov.example")).first()
    if not cit_b:
        cit_b = Citizen(
            id=uuid.uuid4(),
            name="Test Citizen B (Missing Doc)",
            phone="9876000092",
            email="citizen.000092@synthetic-gov.example"
        )
        db_session.add(cit_b)
        db_session.commit()
        db_session.refresh(cit_b)

        if dept_rev:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_b.id, department_id=dept_rev.id, department_citizen_id="REV-000092"))
        if dept_land:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_b.id, department_id=dept_land.id, department_citizen_id="LAND-000092"))
        if dept_wel:
            db_session.add(IdentityMapping(id=uuid.uuid4(), canonical_citizen_id=cit_b.id, department_id=dept_wel.id, department_citizen_id="WEL-000092"))
        db_session.commit()

    citizen_b_id = cit_b.id
    citizen_b_canonical = "CIT-000092"

    def auth_as_citizen_a():
        return UserPayload(
            sub=str(citizen_a_id),
            username="citizen_000091",
            roles=["CITIZEN"],
            preferred_username="citizen_000091",
            canonical_citizen_id=citizen_a_canonical
        )

    def auth_as_citizen_b():
        return UserPayload(
            sub=str(citizen_b_id),
            username="citizen_000092",
            roles=["CITIZEN"],
            preferred_username="citizen_000092",
            canonical_citizen_id=citizen_b_canonical
        )

    def auth_as_officer():
        return UserPayload(
            sub=str(uuid.uuid4()),
            username="official_rev_01",
            roles=["DEPARTMENT_OFFICIAL"],
            department_code="REV"
        )

    created_app_ids = []

    try:
        # ─── TEST 1: Citizen A -> Document AVAILABLE -> Workflow continues ──────
        with patch("app.services.interoperability_service.RevenueConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_rev, \
             patch("app.services.interoperability_service.LandConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_land, \
             patch("app.services.interoperability_service.WelfareConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_wel:

            # Realistic lookup evaluation: Citizen A has AVAILABLE data, Citizen B has NOT_FOUND
            async def side_effect_rev(person_id):
                if person_id == "REV-000091" or person_id == "REV-000001":
                    return IncomeInformation(
                        source="revenue",
                        person_id=person_id,
                        annual_income=150000.0,
                        tax_status="FILED",
                        income_verified=True,
                        status="AVAILABLE"
                    )
                elif person_id == "REV-000092" or person_id == "REV-000002":
                    return IncomeInformation(
                        source="revenue",
                        person_id=person_id,
                        status="NOT_FOUND",
                        error_detail=f"Revenue record for person identifier '{person_id}' not found"
                    )
                return IncomeInformation(source="revenue", status="NOT_FOUND")

            mock_rev.side_effect = side_effect_rev
            mock_land.return_value = PropertyInformation(source="land", person_id="LAND-000091", property_value=500000.0, status="AVAILABLE")
            mock_wel.return_value = WelfareInformation(source="welfare", person_id="WEL-000091", status="AVAILABLE")

            app.dependency_overrides[get_current_user] = auth_as_citizen_a
            res_a = client.post("/api/applications", json={
                "service_type": "INCOME_CERTIFICATE",
                "purpose": "INCOME_VERIFICATION",
                "application_data": {"applicantName": "Test Citizen A", "annualIncome": "150000"}
            })
            assert res_a.status_code == 201, res_a.text
            app_a_id = res_a.json()["id"]
            created_app_ids.append(app_a_id)

            status_res_a = client.get(f"/api/applications/{app_a_id}/status")
            assert status_res_a.status_code == 200
            status_a = status_res_a.json()
            assert status_a["status"] == "APPROVED"
            assert status_a["waiting_reason"] is None
            assert status_a["missing_document_item"] is None

        # ─── TEST 2: Citizen B -> Document NOT_FOUND -> Workflow waits ─────────
            app.dependency_overrides[get_current_user] = auth_as_citizen_b
            res_b = client.post("/api/applications", json={
                "service_type": "INCOME_CERTIFICATE",
                "purpose": "INCOME_VERIFICATION",
                "application_data": {"applicantName": "Test Citizen B", "annualIncome": "200000"}
            })
            assert res_b.status_code == 201, res_b.text
            app_b_id = res_b.json()["id"]
            created_app_ids.append(app_b_id)

            status_res_b = client.get(f"/api/applications/{app_b_id}/status")
            assert status_res_b.status_code == 200
            status_b = status_res_b.json()
            assert status_b["status"] == "WAITING_FOR_DEPARTMENT"
            assert status_b["waiting_reason"] == "DOCUMENT_NOT_FOUND"
            assert status_b["missing_document_item"] == "Income Verification Record"
            assert status_b["missing_document_dept"] == "REV"
            assert status_b["responsible_office"] is not None
            assert status_b["responsible_office"]["code"] == "REV"
            assert "[Prototype Info]" in status_b["responsible_office"]["office_address"]

        # ─── TEST 3: Citizen A submits 2nd application -> still AVAILABLE ──────
            app.dependency_overrides[get_current_user] = auth_as_citizen_a
            res_a2 = client.post("/api/applications", json={
                "service_type": "SCHOLARSHIP",
                "purpose": "SCHOLARSHIP_ELIGIBILITY",
                "application_data": {"applicantName": "Test Citizen A", "course": "Engineering"}
            })
            assert res_a2.status_code == 201
            app_a2_id = res_a2.json()["id"]
            created_app_ids.append(app_a2_id)

            status_a2 = client.get(f"/api/applications/{app_a2_id}/status").json()
            assert status_a2["status"] == "APPROVED"
            assert status_a2["waiting_reason"] is None

        # ─── TEST 4: Citizen B submits 2nd application -> still NOT_FOUND ──────
            app.dependency_overrides[get_current_user] = auth_as_citizen_b
            res_b2 = client.post("/api/applications", json={
                "service_type": "SCHOLARSHIP",
                "purpose": "SCHOLARSHIP_ELIGIBILITY",
                "application_data": {"applicantName": "Test Citizen B", "course": "Medical"}
            })
            assert res_b2.status_code == 201
            app_b2_id = res_b2.json()["id"]
            created_app_ids.append(app_b2_id)

            status_b2 = client.get(f"/api/applications/{app_b2_id}/status").json()
            assert status_b2["status"] == "WAITING_FOR_DEPARTMENT"
            assert status_b2["waiting_reason"] == "DOCUMENT_NOT_FOUND"

        # ─── TEST 5: Simultaneous State Isolation ─────────────────────────────
        # Check both Citizen A applications and both Citizen B applications exist simultaneously
        app.dependency_overrides[get_current_user] = auth_as_citizen_a
        assert client.get(f"/api/applications/{app_a_id}/status").json()["status"] == "APPROVED"
        assert client.get(f"/api/applications/{app_a2_id}/status").json()["status"] == "APPROVED"

        app.dependency_overrides[get_current_user] = auth_as_citizen_b
        assert client.get(f"/api/applications/{app_b_id}/status").json()["status"] == "WAITING_FOR_DEPARTMENT"
        assert client.get(f"/api/applications/{app_b2_id}/status").json()["status"] == "WAITING_FOR_DEPARTMENT"

        # ─── TEST 6: Officer Queue Distinction ─────────────────────────────────
        app.dependency_overrides[get_current_user] = auth_as_officer
        officer_res = client.get("/api/applications")
        assert officer_res.status_code == 200
        all_apps = {a["id"]: a for a in officer_res.json()}

        assert all_apps[app_a_id]["status"] == "APPROVED"
        assert all_apps[app_b_id]["status"] == "WAITING_FOR_DEPARTMENT"
        assert all_apps[app_b_id]["waiting_reason"] == "DOCUMENT_NOT_FOUND"

        # ─── TEST 7: Notification Isolation ────────────────────────────────────
        app.dependency_overrides[get_current_user] = auth_as_citizen_b
        notifs_b = client.get("/api/notifications").json()["notifications"]
        b_has_notif = any(n["application_id"] == app_b_id and "Income Verification Record" in n["message"] for n in notifs_b)
        assert b_has_notif, "Citizen B must receive missing document notification"

        app.dependency_overrides[get_current_user] = auth_as_citizen_a
        notifs_a = client.get("/api/notifications").json()["notifications"]
        a_has_b_notif = any(n["application_id"] == app_b_id for n in notifs_a)
        assert not a_has_b_notif, "Citizen A must NOT receive Citizen B's notification"

        # ─── TEST 8: Technical Timeout vs Missing Document Distinction ─────────
        with patch("app.services.interoperability_service.RevenueConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_rev_timeout:
            mock_rev_timeout.return_value = IncomeInformation(
                source="revenue",
                person_id="REV-000001",
                status="UNAVAILABLE",
                error_detail="Timeout connecting to http://localhost:8001"
            )

            app.dependency_overrides[get_current_user] = auth_as_citizen_a
            res_timeout = client.post("/api/applications", json={
                "service_type": "INCOME_CERTIFICATE",
                "purpose": "INCOME_VERIFICATION"
            })
            assert res_timeout.status_code == 201
            app_timeout_id = res_timeout.json()["id"]
            created_app_ids.append(app_timeout_id)

            status_timeout = client.get(f"/api/applications/{app_timeout_id}/status").json()
            assert status_timeout["status"] == "WAITING_FOR_DEPARTMENT"
            assert status_timeout["waiting_reason"] == "DEPT_UNAVAILABLE"
            assert status_timeout["missing_document_item"] is None

        # ─── TEST 9: Resume Workflow When Document Becomes Available ────────────
        with patch("app.services.interoperability_service.RevenueConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_resume_rev, \
             patch("app.services.interoperability_service.LandConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_resume_land, \
             patch("app.services.interoperability_service.WelfareConnector.fetch_normalized_data", new_callable=AsyncMock) as mock_resume_wel:

            mock_resume_rev.return_value = IncomeInformation(
                source="revenue",
                person_id="REV-000092",
                annual_income=220000.0,
                tax_status="FILED",
                income_verified=True,
                status="AVAILABLE"
            )
            mock_resume_land.return_value = PropertyInformation(source="land", person_id="LAND-000092", property_value=400000.0, status="AVAILABLE")
            mock_resume_wel.return_value = WelfareInformation(source="welfare", person_id="WEL-000092", status="AVAILABLE")

            app.dependency_overrides[get_current_user] = auth_as_citizen_b
            resume_res = client.post(f"/api/applications/{app_b_id}/resume", json={
                "reason": "Citizen provided income certificate at Revenue Bhavan"
            })
            assert resume_res.status_code == 200, resume_res.text
            assert resume_res.json()["status"] == "APPROVED"

            status_after_resume = client.get(f"/api/applications/{app_b_id}/status").json()
            assert status_after_resume["status"] == "APPROVED"
            assert status_after_resume["waiting_reason"] is None
            assert status_after_resume["missing_document_item"] is None

    finally:
        app.dependency_overrides.clear()
        # Clean up isolated test applications and notifications
        for app_id_str in created_app_ids:
            try:
                target_uuid = uuid.UUID(app_id_str)
                app_rec = db_session.get(Application, target_uuid)
                if app_rec:
                    db_session.query(Notification).filter(Notification.application_id == target_uuid).delete()
                    db_session.query(WorkflowInstance).filter(WorkflowInstance.application_id == target_uuid).delete()
                    db_session.query(AuditLog).filter(AuditLog.resource_id == app_rec.application_number).delete()
                    db_session.delete(app_rec)
                    db_session.commit()
            except Exception:
                db_session.rollback()
