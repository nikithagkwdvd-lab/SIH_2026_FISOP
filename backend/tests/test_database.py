import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

import pytest
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import get_settings, build_engine
from app.db.base import Base
from app.db.models import (
    Citizen, Department, Application, Consent,
    IdentityMapping, WorkflowInstance, AuditLog, Notification,
    ApplicationStatus, ConsentStatus, WorkflowStatus, AuditAction, NotificationStatus
)


@pytest.fixture(scope="session")
def db_engine():
    """
    Fixture providing SQLAlchemy Engine for tests.
    Uses TEST_DATABASE_URL if provided, else falls back to DATABASE_URL.
    Safely creates tables if they don't exist.
    """
    test_url = os.getenv("TEST_DATABASE_URL") or get_settings().database_url
    if not test_url:
        pytest.skip("No DATABASE_URL or TEST_DATABASE_URL provided for running database tests.")
    
    engine = build_engine(test_url)
    
    # Ensure tables exist for test run
    Base.metadata.create_all(bind=engine)
    
    yield engine


@pytest.fixture
def db_session(db_engine):
    """
    Fixture providing an isolated database session per test.
    Rolls back transaction at the end of each test to avoid mutating persistent state.
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


def test_01_database_connection(db_session: Session):
    """Verify database connection works."""
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_02_create_citizen(db_session: Session):
    """Verify citizens can be created with UUID PK and timezone-aware timestamps."""
    unique_email = f"test_citizen_{uuid.uuid4().hex[:8]}@example.gov"
    citizen = Citizen(
        name="Test Citizen John Doe",
        email=unique_email,
        phone="+91 9999988888"
    )
    db_session.add(citizen)
    db_session.flush()

    assert isinstance(citizen.id, uuid.UUID)
    assert citizen.name == "Test Citizen John Doe"
    assert citizen.created_at is not None
    assert citizen.created_at.tzinfo is not None or pytest.approx(datetime.now(timezone.utc).timestamp(), abs=10)


def test_03_create_department(db_session: Session):
    """Verify departments can be created with unique code."""
    unique_code = f"TEST_DEPT_{uuid.uuid4().hex[:6].upper()}"
    dept = Department(
        name="Test Revenue Department",
        code=unique_code
    )
    db_session.add(dept)
    db_session.flush()

    assert isinstance(dept.id, uuid.UUID)
    assert dept.code == unique_code


def test_04_application_references_citizen(db_session: Session):
    """Verify applications correctly reference citizens via FK and enum status."""
    citizen = Citizen(name="App Test Citizen", email=f"app_citizen_{uuid.uuid4().hex[:6]}@example.gov")
    db_session.add(citizen)
    db_session.flush()

    app_num = f"APP-TEST-{uuid.uuid4().hex[:8]}"
    application = Application(
        application_number=app_num,
        citizen_id=citizen.id,
        service_type="INCOME_CERTIFICATE",
        status=ApplicationStatus.SUBMITTED
    )
    db_session.add(application)
    db_session.flush()

    assert application.citizen_id == citizen.id
    assert application.citizen.name == "App Test Citizen"
    assert application in citizen.applications


def test_05_consent_references_citizen_and_department(db_session: Session):
    """Verify consents correctly reference citizens and departments."""
    citizen = Citizen(name="Consent Citizen", email=f"consent_{uuid.uuid4().hex[:6]}@example.gov")
    dept = Department(name="Welfare Dept", code=f"WEL_{uuid.uuid4().hex[:4].upper()}")
    db_session.add_all([citizen, dept])
    db_session.flush()

    now = datetime.now(timezone.utc)
    consent = Consent(
        citizen_id=citizen.id,
        department_id=dept.id,
        data_type="INCOME_DATA",
        purpose="Welfare Assistance Eligibility",
        status=ConsentStatus.GRANTED,
        granted_at=now,
        expires_at=now + timedelta(days=365)
    )
    db_session.add(consent)
    db_session.flush()

    assert consent.citizen_id == citizen.id
    assert consent.department_id == dept.id
    assert consent.citizen == citizen
    assert consent.department == dept


def test_06_identity_mapping(db_session: Session):
    """Verify identity mappings correctly map canonical citizen ID to department-specific identifier."""
    citizen = Citizen(name="Canonical Citizen", email=f"canonical_{uuid.uuid4().hex[:6]}@example.gov")
    dept = Department(name="Land Records Dept", code=f"LAND_{uuid.uuid4().hex[:4].upper()}")
    db_session.add_all([citizen, dept])
    db_session.flush()

    mapping = IdentityMapping(
        canonical_citizen_id=citizen.id,
        department_id=dept.id,
        department_citizen_id="LAND-REC-998877"
    )
    db_session.add(mapping)
    db_session.flush()

    assert mapping.canonical_citizen_id == citizen.id
    assert mapping.department_citizen_id == "LAND-REC-998877"
    assert mapping.citizen == citizen


def test_07_identity_mapping_unique_constraint(db_session: Session):
    """Verify unique constraint on (department_id, department_citizen_id) raises IntegrityError."""
    citizen1 = Citizen(name="Citizen One", email=f"c1_{uuid.uuid4().hex[:6]}@example.gov")
    citizen2 = Citizen(name="Citizen Two", email=f"c2_{uuid.uuid4().hex[:6]}@example.gov")
    dept = Department(name="Education Dept", code=f"EDU_{uuid.uuid4().hex[:4].upper()}")
    db_session.add_all([citizen1, citizen2, dept])
    db_session.flush()

    dept_citizen_id = "EDU-ID-12345"
    m1 = IdentityMapping(
        canonical_citizen_id=citizen1.id,
        department_id=dept.id,
        department_citizen_id=dept_citizen_id
    )
    db_session.add(m1)
    db_session.flush()

    m2 = IdentityMapping(
        canonical_citizen_id=citizen2.id,
        department_id=dept.id,
        department_citizen_id=dept_citizen_id
    )
    db_session.add(m2)

    with pytest.raises(IntegrityError):
        db_session.flush()
    
    db_session.rollback()


def test_08_workflow_instance(db_session: Session):
    """Verify workflow instances correctly reference applications."""
    citizen = Citizen(name="WF Citizen", email=f"wf_{uuid.uuid4().hex[:6]}@example.gov")
    db_session.add(citizen)
    db_session.flush()

    app = Application(
        application_number=f"APP-WF-{uuid.uuid4().hex[:6]}",
        citizen_id=citizen.id,
        service_type="HOUSING_ALLOTMENT",
        status=ApplicationStatus.IN_VERIFICATION
    )
    db_session.add(app)
    db_session.flush()

    wf = WorkflowInstance(
        application_id=app.id,
        workflow_name="HOUSING_VERIFICATION_WORKFLOW",
        workflow_instance_id="CAMUNDA-100200300",
        status=WorkflowStatus.RUNNING
    )
    db_session.add(wf)
    db_session.flush()

    assert wf.application_id == app.id
    assert wf.application == app


def test_09_notification_references(db_session: Session):
    """Verify notifications correctly reference citizens and optional applications."""
    citizen = Citizen(name="Notif Citizen", email=f"notif_{uuid.uuid4().hex[:6]}@example.gov")
    db_session.add(citizen)
    db_session.flush()

    notif = Notification(
        citizen_id=citizen.id,
        type="CONSENT_REQUEST",
        message="Revenue Dept requested access to your income records.",
        status=NotificationStatus.PENDING
    )
    db_session.add(notif)
    db_session.flush()

    assert notif.citizen_id == citizen.id
    assert notif.application_id is None
    assert notif.citizen == citizen


def test_10_audit_log_safety(db_session: Session):
    """Verify audit logs can be created without storing sensitive records."""
    dept = Department(name="Audit Dept", code=f"AUD_{uuid.uuid4().hex[:4].upper()}")
    db_session.add(dept)
    db_session.flush()

    actor_uuid = uuid.uuid4()
    audit = AuditLog(
        actor_id=actor_uuid,
        department_id=dept.id,
        action=AuditAction.REQUEST_INCOME,
        resource_type="TAX_RECORD_METADATA",
        resource_id="REC-98765",
        purpose="Scholarship Income Eligibility Verification",
        result="GRANTED",
        trace_id="TRACE-0019283-ABC"
    )
    db_session.add(audit)
    db_session.flush()

    assert audit.actor_id == actor_uuid
    assert audit.department_id == dept.id
    assert audit.action == AuditAction.REQUEST_INCOME
    # Confirm no payload data column exists
    assert not hasattr(audit, "payload")
    assert not hasattr(audit, "raw_data")
