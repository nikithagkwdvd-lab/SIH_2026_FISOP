import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.database import build_engine, get_settings
from app.db.models.application import Application, ApplicationStatus
from app.db.models.citizen import Citizen
from app.db.models.notification import Notification
from app.security.jwt_validator import get_current_user, UserPayload


client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    session = Session(bind=engine)
    yield session
    session.close()


def test_smart_reapplication_and_decision_lifecycle(db_session: Session):
    """
    Comprehensive verification for:
    - Test A: Submit -> Officer approves -> APPROVED + notification
    - Test B: Submit -> Officer rejects with reason + affected fields -> REJECTED + reason + notification
    - Test C: Reapply from rejected -> New APP number -> parent_application_id -> original remains REJECTED
    - Test D: Cross-citizen reapplication security denial
    - Test E: Rejection without rejection_reason fails validation (400)
    - Test F: Duplicate reapplication idempotency protection
    """
    # 1. Setup two citizens in DB
    cit1 = db_session.query(Citizen).first()
    assert cit1 is not None, "Citizen must exist in seeded DB"
    citizen_1_id = cit1.id
    citizen_1_canonical = f"CIT-{str(citizen_1_id)[:8].upper()}"

    cit2 = db_session.query(Citizen).filter(Citizen.id != cit1.id).first()
    if not cit2:
        cit2 = Citizen(
            id=uuid.uuid4(),
            full_name="Second Citizen",
            phone="9876543219",
            email="citizen2@example.gov.in"
        )
        db_session.add(cit2)
        db_session.commit()
        db_session.refresh(cit2)
    citizen_2_id = cit2.id
    citizen_2_canonical = f"CIT-{str(citizen_2_id)[:8].upper()}"

    # Helper Auth Overrides
    def auth_as_citizen_1():
        return UserPayload(
            sub=str(citizen_1_id),
            username="citizen1",
            roles=["CITIZEN"],
            preferred_username="citizen1",
            canonical_citizen_id=citizen_1_canonical
        )

    def auth_as_citizen_2():
        return UserPayload(
            sub=str(citizen_2_id),
            username="citizen2",
            roles=["CITIZEN"],
            preferred_username="citizen2",
            canonical_citizen_id=citizen_2_canonical
        )

    def auth_as_officer():
        return UserPayload(
            sub=str(uuid.uuid4()),
            username="officer_rev",
            roles=["DEPARTMENT_OFFICIAL"],
            department_code="REV"
        )

    try:
        # ─── TEST A: Submit -> Officer Approves ────────────────────────────────────
        app.dependency_overrides[get_current_user] = auth_as_citizen_1
        submit_res = client.post("/api/applications", json={
            "service_type": "SCHOLARSHIP",
            "purpose": "SCHOLARSHIP_ELIGIBILITY",
            "application_data": {
                "applicantName": "Nikit Citizen",
                "annualIncome": "150000",
                "instituteName": "COEP Pune"
            }
        })
        assert submit_res.status_code == 201, submit_res.text
        app_a_data = submit_res.json()
        app_a_id = app_a_data["id"]

        # Officer Approves
        app.dependency_overrides[get_current_user] = auth_as_officer
        approve_res = client.post(f"/api/applications/{app_a_id}/manual-review", json={
            "action": "APPROVE",
            "comments": "All verification documents clear and eligible",
            "officer_remarks": "Approved with full fee concession"
        })
        assert approve_res.status_code == 200, approve_res.text
        assert approve_res.json()["status"] == "APPROVED"
        assert approve_res.json()["decision_by"] == "REV"

        # Citizen verifies approved status
        app.dependency_overrides[get_current_user] = auth_as_citizen_1
        status_res = client.get(f"/api/applications/{app_a_id}/status")
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "APPROVED"
        assert status_res.json()["decision_by"] == "REV"

        # Citizen sees approval notification
        notifs_res = client.get("/api/notifications")
        assert notifs_res.status_code == 200
        notifs_data = notifs_res.json()
        assert notifs_data["total"] > 0
        app_a_notif = next((n for n in notifs_data["notifications"] if str(n["application_id"]) == str(app_a_id)), None)
        assert app_a_notif is not None
        assert "APPROVED" in app_a_notif["type"].upper() or "APPROVED" in app_a_notif["message"].upper()

        # ─── TEST E: Officer Rejects WITHOUT rejection_reason -> MUST FAIL (400) ──
        # Submit another application
        app.dependency_overrides[get_current_user] = auth_as_citizen_1
        submit_res_b = client.post("/api/applications", json={
            "service_type": "SCHOLARSHIP",
            "application_data": {
                "applicantName": "Nikit Citizen",
                "annualIncome": "450000",
                "incomeSource": "Commercial Business",
                "instituteName": "COEP Pune"
            }
        })
        assert submit_res_b.status_code == 201
        app_b_id = submit_res_b.json()["id"]

        # Attempt rejection with empty reason
        app.dependency_overrides[get_current_user] = auth_as_officer
        empty_reject_res = client.post(f"/api/applications/{app_b_id}/manual-review", json={
            "action": "REJECT",
            "rejection_reason": ""
        })
        assert empty_reject_res.status_code == 400
        assert "Rejection reason is required" in empty_reject_res.text

        # ─── TEST B: Officer Rejects with Reason + Affected Fields ─────────────────
        reject_res = client.post(f"/api/applications/{app_b_id}/manual-review", json={
            "action": "REJECT",
            "rejection_reason": "Annual family income exceeds the scholarship maximum limit of Rs 3,00,000",
            "officer_remarks": "Please provide updated ITR or non-creamy layer certificate",
            "affected_fields": ["annualIncome", "incomeSource"]
        })
        assert reject_res.status_code == 200, reject_res.text
        assert reject_res.json()["status"] == "REJECTED"
        assert reject_res.json()["rejection_reason"] == "Annual family income exceeds the scholarship maximum limit of Rs 3,00,000"
        assert reject_res.json()["affected_fields"] == ["annualIncome", "incomeSource"]

        # Citizen sees exact rejection reason and affected fields
        app.dependency_overrides[get_current_user] = auth_as_citizen_1
        status_b_res = client.get(f"/api/applications/{app_b_id}/status")
        assert status_b_res.status_code == 200
        assert status_b_res.json()["status"] == "REJECTED"
        assert status_b_res.json()["rejection_reason"] == "Annual family income exceeds the scholarship maximum limit of Rs 3,00,000"
        assert status_b_res.json()["officer_remarks"] == "Please provide updated ITR or non-creamy layer certificate"
        assert status_b_res.json()["affected_fields"] == ["annualIncome", "incomeSource"]

        # Notification contains rejection reason
        notifs_b = client.get("/api/notifications").json()
        app_b_notif = next((n for n in notifs_b["notifications"] if str(n["application_id"]) == str(app_b_id) and "REJECTED" in n["type"].upper()), None)
        assert app_b_notif is not None
        assert "exceeds the scholarship maximum limit" in app_b_notif["message"]

        # Citizen marks notification as read
        mark_read_res = client.post(f"/api/notifications/{app_b_notif['id']}/read")
        assert mark_read_res.status_code == 200
        assert mark_read_res.json()["is_read"] is True

        # ─── TEST D: Citizen 2 attempts to reapply from Citizen 1's app -> 403 ────
        app.dependency_overrides[get_current_user] = auth_as_citizen_2
        unauth_reapply = client.post(f"/api/applications/{app_b_id}/reapply", json={
            "service_type": "SCHOLARSHIP",
            "application_data": {"annualIncome": "200000"}
        })
        assert unauth_reapply.status_code == 403

        # ─── TEST C: Citizen 1 Reapplies -> New Application with Parent Link ───────
        app.dependency_overrides[get_current_user] = auth_as_citizen_1
        test_idempotency_key = f"REAPPLY-KEY-{uuid.uuid4().hex[:12]}"
        reapply_res = client.post(
            f"/api/applications/{app_b_id}/reapply",
            json={
                "service_type": "SCHOLARSHIP",
                "idempotency_key": test_idempotency_key,
                "application_data": {
                    "applicantName": "Nikit Citizen",
                    "annualIncome": "240000",
                    "incomeSource": "Agricultural Harvest",
                    "instituteName": "COEP Pune"
                }
            },
            headers={"Idempotency-Key": test_idempotency_key}
        )
        assert reapply_res.status_code == 201, reapply_res.text
        new_app = reapply_res.json()
        new_app_id = new_app["id"]

        # Verify NEW application number and ID
        assert new_app_id != app_b_id
        assert new_app["application_number"] != submit_res_b.json()["application_number"]
        assert new_app["parent_application_id"] == str(app_b_id)
        assert new_app["application_data"]["annualIncome"] == "240000"

        # Verify original application remains REJECTED and unchanged
        orig_check = client.get(f"/api/applications/{app_b_id}")
        assert orig_check.status_code == 200
        assert orig_check.json()["status"] == "REJECTED"
        assert orig_check.json()["rejection_reason"] == "Annual family income exceeds the scholarship maximum limit of Rs 3,00,000"

        # ─── TEST F: Duplicate Reapplication Idempotency Protection ────────────────
        dup_reapply = client.post(
            f"/api/applications/{app_b_id}/reapply",
            json={
                "service_type": "SCHOLARSHIP",
                "idempotency_key": test_idempotency_key,
                "application_data": {"annualIncome": "240000"}
            },
            headers={"Idempotency-Key": test_idempotency_key}
        )
        assert dup_reapply.status_code == 201
        assert dup_reapply.json()["id"] == new_app_id  # Returns identical existing record, no duplicate created

    finally:
        # Clean up overrides
        app.dependency_overrides.clear()
