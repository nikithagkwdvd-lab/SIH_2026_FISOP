import os
import sys
import random
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_settings, build_engine
from app.db.models import (
    Citizen, Department, Application, Consent,
    IdentityMapping, WorkflowInstance, AuditLog, Notification,
    ApplicationStatus, ConsentStatus, WorkflowStatus, AuditAction, NotificationStatus
)

fake = Faker()
Faker.seed(42)
random.seed(42)

DEPARTMENT_DATA = [
    {
        "name": "Department of Revenue",
        "code": "REV",
        "zone": "Central & Revenue Zone 1",
        "office_address": "Revenue Bhavan, Sector 17, Mini Secretariat, Room 104 [Prototype Info]",
        "contact_info": "revenue-support-demo@gov.example / 011-23010001 [Prototype Info]"
    },
    {
        "name": "Department of Land Records",
        "code": "LAND",
        "zone": "Land & Survey Zone 2",
        "office_address": "Bhumi Seva Kendra, Survey Bhavan, Block B, Sub-District IV [Prototype Info]",
        "contact_info": "landrecords-demo@gov.example / 011-23010002 [Prototype Info]"
    },
    {
        "name": "Department of Higher Education",
        "code": "EDU",
        "zone": "State Education Zone 3",
        "office_address": "Vidya Bhavan, Education Directorate, Sector 5 [Prototype Info]",
        "contact_info": "education-demo@gov.example / 011-23010003 [Prototype Info]"
    },
    {
        "name": "Department of Social Welfare",
        "code": "WEL",
        "zone": "Social Justice Zone 4",
        "office_address": "Samaj Kalyan Bhavan, Welfare Complex, 2nd Floor, Wing A [Prototype Info]",
        "contact_info": "welfare-demo@gov.example / 011-23010004 [Prototype Info]"
    },
    {
        "name": "Department of Housing and Urban Development",
        "code": "HOU",
        "zone": "Urban Development Zone 5",
        "office_address": "Awas Bhavan, Urban Housing Authority, Central Plaza [Prototype Info]",
        "contact_info": "housing-demo@gov.example / 011-23010005 [Prototype Info]"
    },
]

SERVICE_TYPES = [
    "INCOME_CERTIFICATE_ISSUANCE",
    "LAND_TITLE_MUTATION",
    "SCHOLARSHIP_APPLICATION",
    "DISABILITY_PENSION_CLAIM",
    "AFFORDABLE_HOUSING_ALLOTMENT"
]

DATA_TYPES = [
    "INCOME_VERIFICATION",
    "PROPERTY_OWNERSHIP",
    "EDUCATIONAL_QUALIFICATION",
    "WELFARE_BENEFICIARY_STATUS",
    "TAX_CLEARANCE"
]

PURPOSES = [
    "Verification for Scholarship Eligibility",
    "Subsidized Housing Allotment Processing",
    "Pension Benefit Entitlement Check",
    "Land Transfer Permission Verification"
]


import uuid

def seed_database(session: Session) -> dict[str, int]:
    """
    Idempotent seeding script for Interoperability Platform database layer.
    Optimized for remote PostgreSQL / Supabase with zero-flush batch operations.
    """
    stats = {
        "citizens": 0,
        "departments": 0,
        "identity_mappings": 0,
        "applications": 0,
        "consents": 0,
        "workflow_instances": 0,
        "audit_logs": 0,
        "notifications": 0
    }

    print("[SEED] Pre-fetching existing database state...", flush=True)
    existing_depts = {d.code: d for d in session.scalars(select(Department)).all()}
    existing_citizens = {c.email: c for c in session.scalars(select(Citizen)).all()}
    existing_mappings = {
        (m.department_id, m.department_citizen_id)
        for m in session.scalars(select(IdentityMapping)).all()
    }
    existing_apps = {a.application_number: a for a in session.scalars(select(Application)).all()}
    existing_wfs = {w.application_id for w in session.scalars(select(WorkflowInstance)).all()}
    existing_notifs = {n.application_id for n in session.scalars(select(Notification)).all() if n.application_id}
    existing_consents = {
        (c.citizen_id, c.department_id, c.data_type)
        for c in session.scalars(select(Consent)).all()
    }
    existing_audits = {
        (a.resource_id, a.action)
        for a in session.scalars(select(AuditLog)).all()
    }

    departments_dict: dict[str, Department] = {}
    new_objects = []

    print("[SEED] Processing Departments...", flush=True)
    for dept_info in DEPARTMENT_DATA:
        code = dept_info["code"]
        if code in existing_depts:
            dept = existing_depts[code]
            dept.zone = dept_info.get("zone")
            dept.office_address = dept_info.get("office_address")
            dept.contact_info = dept_info.get("contact_info")
            departments_dict[code] = dept
        else:
            dept = Department(
                id=uuid.uuid4(),
                name=dept_info["name"],
                code=code,
                zone=dept_info.get("zone"),
                office_address=dept_info.get("office_address"),
                contact_info=dept_info.get("contact_info")
            )
            new_objects.append(dept)
            departments_dict[code] = dept
            stats["departments"] += 1

    DEMO_CITIZENS_METADATA = {
        1: {"name": "Ramesh Kumar", "phone": "9876000001"},
        2: {"name": "Priya Sharma", "phone": "9876000002"},
        3: {"name": "Amit Patel", "phone": "9876000003"},
        4: {"name": "Sunita Deshmukh", "phone": "9876000004"},
        5: {"name": "Rajesh Verma", "phone": "9876000005"},
        6: {"name": "Ananya Joshi", "phone": "9876000006"},
        7: {"name": "Vikram Singh", "phone": "9876000007"},
        8: {"name": "Meera Kulkarni", "phone": "9876000008"},
        9: {"name": "Sanjay Pawar", "phone": "9876000009"},
        10: {"name": "Kavita Reddy", "phone": "9876000010"},
    }

    print("[SEED] Processing 100 Synthetic Citizens...", flush=True)
    citizens_list: list[Citizen] = []
    for i in range(1, 101):
        synthetic_email = f"citizen.{i:06d}@synthetic-gov.example"
        demo_meta = DEMO_CITIZENS_METADATA.get(i)
        target_name = demo_meta["name"] if demo_meta else f"Synthetic Citizen {i:06d} ({fake.name()})"
        target_phone = demo_meta["phone"] if demo_meta else f"9876{i:06d}"

        if synthetic_email in existing_citizens:
            citizen = existing_citizens[synthetic_email]
            # Ensure deterministic phone and name are set
            if citizen.phone != target_phone or (demo_meta and citizen.name != target_name):
                citizen.phone = target_phone
                if demo_meta:
                    citizen.name = target_name
        else:
            citizen = Citizen(
                id=uuid.uuid4(),
                name=target_name,
                email=synthetic_email,
                phone=target_phone
            )
            new_objects.append(citizen)
            stats["citizens"] += 1
            existing_citizens[synthetic_email] = citizen
        citizens_list.append(citizen)


    print("[SEED] Processing Identity Mappings...", flush=True)
    for idx, citizen in enumerate(citizens_list, start=1):
        for dept_code, dept in departments_dict.items():
            dept_citizen_id = f"{dept_code}-{idx:06d}"
            key = (dept.id, dept_citizen_id)
            if key not in existing_mappings:
                mapping = IdentityMapping(
                    id=uuid.uuid4(),
                    canonical_citizen_id=citizen.id,
                    department_id=dept.id,
                    department_citizen_id=dept_citizen_id
                )
                new_objects.append(mapping)
                existing_mappings.add(key)
                stats["identity_mappings"] += 1

    print("[SEED] Processing Applications, Consents, Workflows, Audit Logs, Notifications...", flush=True)
    statuses_cycle = [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.IN_VERIFICATION,
        ApplicationStatus.PENDING,
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED
    ]
    consent_statuses = [ConsentStatus.GRANTED, ConsentStatus.REQUESTED, ConsentStatus.DENIED]

    # Explicit application count mapping for 15 demo citizens (3, 7, 12 have 0 applications)
    APP_DISTRIBUTION = {
        1: 1, 2: 2, 3: 0, 4: 1, 5: 2, 6: 1, 7: 0, 8: 3, 9: 1, 10: 2,
        11: 1, 12: 0, 13: 1, 14: 2, 15: 1
    }

    for idx, citizen in enumerate(citizens_list, start=1):
        num_apps = APP_DISTRIBUTION.get(idx, 1 if idx % 2 == 0 else 2)
        for app_idx in range(1, num_apps + 1):
            app_num = f"APP-2026-{idx:06d}-{app_idx}"
            if app_num in existing_apps:
                app = existing_apps[app_num]
            else:
                status = statuses_cycle[(idx + app_idx) % len(statuses_cycle)]
                service_type = SERVICE_TYPES[(idx + app_idx) % len(SERVICE_TYPES)]
                app = Application(
                    id=uuid.uuid4(),
                    application_number=app_num,
                    citizen_id=citizen.id,
                    service_type=service_type,
                    status=status
                )
                new_objects.append(app)
                existing_apps[app_num] = app
                stats["applications"] += 1

                if app.id not in existing_wfs:
                    wf_status = WorkflowStatus.COMPLETED if status == ApplicationStatus.APPROVED else WorkflowStatus.RUNNING
                    wf = WorkflowInstance(
                        id=uuid.uuid4(),
                        application_id=app.id,
                        workflow_name=f"WF_{service_type}",
                        workflow_instance_id=f"CAMUNDA-PROC-{idx:06d}-{app_idx}",
                        status=wf_status
                    )
                    new_objects.append(wf)
                    existing_wfs.add(app.id)
                    stats["workflow_instances"] += 1

                if app.id not in existing_notifs:
                    notif = Notification(
                        id=uuid.uuid4(),
                        citizen_id=citizen.id,
                        application_id=app.id,
                        type="APPLICATION_STATUS_UPDATE",
                        message=f"Your application {app_num} for {service_type} is currently {status}.",
                        status=NotificationStatus.SENT
                    )
                    new_objects.append(notif)
                    existing_notifs.add(app.id)
                    stats["notifications"] += 1

        dept_code = list(departments_dict.keys())[idx % len(departments_dict)]
        target_dept = departments_dict[dept_code]
        data_type = DATA_TYPES[idx % len(DATA_TYPES)]
        purpose = PURPOSES[idx % len(PURPOSES)]

        consent_key = (citizen.id, target_dept.id, data_type)
        if consent_key not in existing_consents:
            c_status = consent_statuses[idx % len(consent_statuses)]
            now_utc = datetime.now(timezone.utc)
            consent = Consent(
                id=uuid.uuid4(),
                citizen_id=citizen.id,
                department_id=target_dept.id,
                data_type=data_type,
                purpose=purpose,
                status=c_status,
                granted_at=now_utc if c_status == ConsentStatus.GRANTED else None,
                expires_at=now_utc + timedelta(days=365) if c_status == ConsentStatus.GRANTED else None
            )
            new_objects.append(consent)
            existing_consents.add(consent_key)
            stats["consents"] += 1

        audit_key = (str(citizen.id), AuditAction.VIEW_CITIZEN)
        if audit_key not in existing_audits:
            audit = AuditLog(
                id=uuid.uuid4(),
                actor_id=citizen.id,
                department_id=target_dept.id,
                action=AuditAction.VIEW_CITIZEN,
                resource_type="CITIZEN_RECORD",
                resource_id=str(citizen.id),
                purpose="Routine Interoperability Verification",
                result="SUCCESS",
                trace_id=f"TRACE-{idx:06d}-XYZ"
            )
            new_objects.append(audit)
            existing_audits.add(audit_key)
            stats["audit_logs"] += 1

    print(f"[SEED] Committing {len(new_objects)} new records to Supabase...", flush=True)
    if new_objects:
        session.add_all(new_objects)
    session.commit()

    print("\n[SUCCESS] Database Seeding Completed Successfully!", flush=True)
    print(f"[STATS] Seeded summary: {stats}", flush=True)
    return stats


def main():
    """CLI entrypoint for database seeding script."""
    try:
        settings = get_settings()
        engine = build_engine(settings.database_url)
    except Exception as e:
        print(f"[ERROR] Could not initialize database engine: {e}")
        sys.exit(1)

    with Session(engine) as session:
        seed_database(session)


if __name__ == "__main__":
    main()
