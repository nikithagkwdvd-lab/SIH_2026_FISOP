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
from app.db.base import Base
from app.db.models.ai_mapping_suggestion import AiMappingSuggestion, MappingSuggestionStatus
from app.db.models.canonical_mapping import CanonicalMapping
from app.db.models.audit_log import AuditLog
from app.security.jwt_validator import create_test_token

client = TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    engine = build_engine(test_url)
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.close()


def test_01_get_canonical_schema():
    """Verify API exposes single-source-of-truth canonical schema field definitions."""
    res = client.get("/api/ai/canonical-schema")
    assert res.status_code == 200
    data = res.json()
    field_names = [f["name"] for f in data]
    assert "citizen_id" in field_names
    assert "annual_income" in field_names
    assert "property_value" in field_names
    assert "scheme_code" in field_names


def test_02_schema_analysis_generates_suggestions(db_session: Session):
    """Verify submitting a new department schema generates candidate mapping suggestions with status SUGGESTED."""
    official_token = create_test_token(
        sub="official_user_01",
        username="official_01",
        roles=["DEPARTMENT_OFFICIAL"],
        department_code="EDU"
    )
    headers = {"Authorization": f"Bearer {official_token}"}

    payload = {
        "department": "EducationTest02",
        "schema_version": "1.0",
        "fields": [
            {
                "name": "studentIdentifier",
                "type": "string",
                "description": "Unique identifier of the student"
            },
            {
                "name": "yearlyFamilyEarnings",
                "type": "number",
                "description": "Annual income of student's family in INR"
            }
        ]
    }

    res = client.post("/api/ai/schema/analyze", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["department"] == "EDUCATIONTEST02"
    assert data["suggestions_count"] == 2

    sug1 = next(s for s in data["suggestions"] if s["source_field"] == "studentIdentifier")
    assert sug1["canonical_field"] == "citizen_id"
    assert sug1["confidence"] >= 0.90
    assert sug1["status"] == "SUGGESTED"
    assert sug1["requires_human_approval"] is True

    sug2 = next(s for s in data["suggestions"] if s["source_field"] == "yearlyFamilyEarnings")
    assert sug2["canonical_field"] == "annual_income"
    assert sug2["confidence"] >= 0.90
    assert sug2["status"] == "SUGGESTED"

    # Verify suggestions are stored separately from production canonical_mappings registry
    prod_mappings = db_session.scalars(
        select(CanonicalMapping).where(CanonicalMapping.department == "EDUCATIONTEST02")
    ).all()
    assert len(prod_mappings) == 0, "AI suggestions must NOT automatically enter production mappings prior to human approval."


def test_03_ambiguous_fields_flagged_needs_review(db_session: Session):
    """Verify ambiguous fields without clear descriptions receive status NEEDS_REVIEW and candidates list."""
    official_token = create_test_token(
        sub="official_user_01",
        username="official_01",
        roles=["DEPARTMENT_OFFICIAL"]
    )
    headers = {"Authorization": f"Bearer {official_token}"}

    payload = {
        "department": "Education",
        "schema_version": "1.0",
        "fields": [
            {
                "name": "amount",
                "type": "number",
                "description": "num"
            }
        ]
    }

    res = client.post("/api/ai/schema/analyze", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    sug = data["suggestions"][0]
    assert sug["status"] == "NEEDS_REVIEW"
    assert sug["confidence"] < 0.75
    assert "annual_income" in sug["candidate_fields"]
    assert "property_value" in sug["candidate_fields"]


def test_04_citizen_cannot_approve_mapping():
    """Verify citizen role attempting to approve a candidate mapping receives HTTP 403 Forbidden."""
    cit_token = create_test_token(
        sub="user_cit_01",
        username="citizen_01",
        roles=["CITIZEN"]
    )
    headers = {"Authorization": f"Bearer {cit_token}"}
    fake_id = str(uuid.uuid4())

    res = client.post(f"/api/ai/mappings/{fake_id}/approve", headers=headers)
    assert res.status_code == 403


def test_05_data_steward_approval_registers_canonical_mapping(db_session: Session):
    """Verify authorized Data Steward approval transfers AI suggestion into production canonical_mappings and logs audit event."""
    official_token = create_test_token(
        sub="official_steward_01",
        username="data_steward_01",
        roles=["DEPARTMENT_OFFICIAL", "DATA_STEWARD"]
    )
    headers = {"Authorization": f"Bearer {official_token}"}

    # 1. Analyze schema
    payload = {
        "department": "Education",
        "schema_version": "1.0",
        "fields": [
            {
                "name": "landHoldingAmount",
                "type": "number",
                "description": "Value of land owned by the family"
            }
        ]
    }
    analyze_res = client.post("/api/ai/schema/analyze", json=payload, headers=headers)
    sug_id = analyze_res.json()["suggestions"][0]["id"]

    # 2. Approve mapping
    approve_res = client.post(f"/api/ai/mappings/{sug_id}/approve", headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 3. Verify inserted into canonical_mappings table
    cm = db_session.scalars(
        select(CanonicalMapping).where(
            CanonicalMapping.department == "EDUCATION",
            CanonicalMapping.source_field == "landHoldingAmount"
        )
    ).first()
    assert cm is not None
    assert cm.canonical_field == "property_value"

    # 4. Verify Audit Log entry
    audit = db_session.scalars(
        select(AuditLog).where(AuditLog.action == "AI_MAPPING_APPROVED")
    ).first()
    assert audit is not None


def test_06_rejection_retains_audited_suggestion(db_session: Session):
    """Verify rejecting an AI suggestion marks status REJECTED without modifying production canonical_mappings."""
    official_token = create_test_token(
        sub="official_steward_01",
        username="data_steward_01",
        roles=["ADMIN"]
    )
    headers = {"Authorization": f"Bearer {official_token}"}

    payload = {
        "department": "Education",
        "schema_version": "1.0",
        "fields": [
            {
                "name": "randomField",
                "type": "string",
                "description": "Arbitrary extra field"
            }
        ]
    }
    analyze_res = client.post("/api/ai/schema/analyze", json=payload, headers=headers)
    sug_id = analyze_res.json()["suggestions"][0]["id"]

    # Reject mapping
    reject_res = client.post(
        f"/api/ai/mappings/{sug_id}/reject",
        json={"reason": "Irrelevant field"},
        headers=headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    # Verify suggestion status updated in DB
    sug_obj = db_session.get(AiMappingSuggestion, uuid.UUID(sug_id))
    assert sug_obj.status == MappingSuggestionStatus.REJECTED
    assert sug_obj.rejection_reason == "Irrelevant field"

    # Verify audit log
    audit = db_session.scalars(
        select(AuditLog).where(AuditLog.action == "AI_MAPPING_REJECTED")
    ).first()
    assert audit is not None
