import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.db.database import SessionLocal
from app.db.models import (
    Citizen, Department, Application, Consent,
    IdentityMapping, WorkflowInstance, AuditLog, Notification,
    ApplicationStatus, ConsentStatus, WorkflowStatus, AuditAction, NotificationStatus
)

def reset_demo_data():
    db: Session = SessionLocal()
    try:
        print("[RESET] Looking up Citizen CIT-000001...")
        cit = db.scalars(
            select(Citizen).where(Citizen.email == "citizen.000001@synthetic-gov.example")
        ).first()

        if not cit:
            print("[RESET] Error: Citizen CIT-000001 not found!")
            return

        print(f"[RESET] Found citizen {cit.id} ({cit.email}). Cleaning test pollution...")

        # 1. Fetch all existing applications for CIT-000001
        apps = db.scalars(
            select(Application).where(Application.citizen_id == cit.id)
        ).all()
        app_ids = [a.id for a in apps]
        app_nums = [a.application_number for a in apps]

        print(f"[RESET] Found {len(apps)} applications for citizen {cit.email}.")

        # Delete dependent notifications, workflow instances, and audit logs for these apps
        if app_ids:
            db.execute(delete(Notification).where(Notification.application_id.in_(app_ids)))
            db.execute(delete(WorkflowInstance).where(WorkflowInstance.application_id.in_(app_ids)))
            db.execute(delete(AuditLog).where(
                (AuditLog.resource_id.in_(app_nums)) | (AuditLog.resource_id.in_([str(i) for i in app_ids]))
            ))
            db.execute(delete(Application).where(Application.id.in_(app_ids)))
            db.commit()
            print("[RESET] Removed test pollution applications.")

        # 2. Re-create the 3 controlled demo applications
        now = datetime.now(timezone.utc)
        dept_land = db.scalars(select(Department).where(Department.code == "LAND")).first()

        # App 1: APPROVED Scholarship
        app1_id = uuid.uuid4()
        app1 = Application(
            id=app1_id,
            application_number="APP-2026-000001-1",
            citizen_id=cit.id,
            service_type="SCHOLARSHIP",
            status=ApplicationStatus.APPROVED,
            idempotency_key="DEMO-SEED-APP-1",
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=3)
        )
        wf1 = WorkflowInstance(
            id=uuid.uuid4(),
            application_id=app1_id,
            workflow_name="WF_SCHOLARSHIP",
            workflow_instance_id="CAMUNDA-PROC-000001-1",
            status=WorkflowStatus.COMPLETED,
            created_at=now - timedelta(days=3)
        )
        notif1 = Notification(
            id=uuid.uuid4(),
            citizen_id=cit.id,
            application_id=app1_id,
            type="APPLICATION_STATUS_UPDATE",
            message="Your application APP-2026-000001-1 for SCHOLARSHIP has been approved.",
            status=NotificationStatus.SENT,
            created_at=now - timedelta(days=3)
        )

        # App 2: IN_PROGRESS Scholarship (Under Verification)
        app2_id = uuid.uuid4()
        app2 = Application(
            id=app2_id,
            application_number="APP-2026-000001-2",
            citizen_id=cit.id,
            service_type="SCHOLARSHIP",
            status=ApplicationStatus.REVENUE_VERIFICATION,
            idempotency_key="DEMO-SEED-APP-2",
            created_at=now - timedelta(hours=4),
            updated_at=now - timedelta(hours=4)
        )
        wf2 = WorkflowInstance(
            id=uuid.uuid4(),
            application_id=app2_id,
            workflow_name="WF_SCHOLARSHIP",
            workflow_instance_id="CAMUNDA-PROC-000001-2",
            status=WorkflowStatus.RUNNING,
            created_at=now - timedelta(hours=4)
        )
        notif2 = Notification(
            id=uuid.uuid4(),
            citizen_id=cit.id,
            application_id=app2_id,
            type="APPLICATION_STATUS_UPDATE",
            message="Your application APP-2026-000001-2 is undergoing cross-department verification.",
            status=NotificationStatus.SENT,
            created_at=now - timedelta(hours=4)
        )

        # App 3: WAITING_FOR_DEPARTMENT (Stalled on Land API timeout, retry active)
        app3_id = uuid.uuid4()
        app3 = Application(
            id=app3_id,
            application_number="APP-2026-000001-3",
            citizen_id=cit.id,
            service_type="SCHOLARSHIP",
            status=ApplicationStatus.WAITING_FOR_DEPARTMENT,
            idempotency_key="DEMO-SEED-APP-3",
            created_at=now - timedelta(hours=1),
            updated_at=now - timedelta(hours=1)
        )
        wf3 = WorkflowInstance(
            id=uuid.uuid4(),
            application_id=app3_id,
            workflow_name="WF_SCHOLARSHIP",
            workflow_instance_id="CAMUNDA-PROC-000001-3",
            status=WorkflowStatus.RUNNING,
            created_at=now - timedelta(hours=1)
        )
        audit3 = AuditLog(
            id=uuid.uuid4(),
            action="WORKFLOW_WAITING",
            resource_type="APPLICATION",
            resource_id="APP-2026-000001-3",
            result="TIMEOUT",
            purpose="SCHOLARSHIP_ELIGIBILITY",
            department_id=dept_land.id if dept_land else None,
            trace_id="TRACE-DEMO-WAIT",
            created_at=now - timedelta(minutes=45)
        )
        notif3 = Notification(
            id=uuid.uuid4(),
            citizen_id=cit.id,
            application_id=app3_id,
            type="APPLICATION_STATUS_UPDATE",
            message="Your application APP-2026-000001-3 is waiting for Department of Land Records response. Auto-retry active.",
            status=NotificationStatus.SENT,
            created_at=now - timedelta(hours=1)
        )

        db.add_all([app1, wf1, notif1, app2, wf2, notif2, app3, wf3, audit3, notif3])
        db.commit()

        print("[RESET] Successfully established 3 controlled demo applications for CIT-000001:")
        print("  1. APP-2026-000001-1: APPROVED")
        print("  2. APP-2026-000001-2: IN_PROGRESS (REVENUE_VERIFICATION)")
        print("  3. APP-2026-000001-3: WAITING_FOR_DEPARTMENT (LAND)")

    finally:
        db.close()

if __name__ == "__main__":
    reset_demo_data()
