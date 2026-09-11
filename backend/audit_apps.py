import os
from sqlalchemy import select, func
from app.db.database import SessionLocal
from app.db.models import Application, Citizen, IdentityMapping, WorkflowInstance

db = SessionLocal()
try:
    total_apps = db.query(Application).count()
    print(f"Total applications in DB: {total_apps}")

    apps_by_cit = db.query(Application.citizen_id, func.count(Application.id)).group_by(Application.citizen_id).all()
    print(f"Total distinct citizens with applications: {len(apps_by_cit)}")
    for cit_uuid, count in sorted(apps_by_cit, key=lambda x: x[1], reverse=True)[:10]:
        cit = db.get(Citizen, cit_uuid)
        c_name = cit.name if cit else "Unknown"
        c_email = cit.email if cit else "Unknown"
        print(f"  Citizen UUID {cit_uuid} ({c_email}, {c_name}): {count} apps")

    print("\nSample of applications for top citizen:")
    top_cit_uuid = sorted(apps_by_cit, key=lambda x: x[1], reverse=True)[0][0]
    top_apps = db.scalars(select(Application).where(Application.citizen_id == top_cit_uuid).order_by(Application.created_at.desc()).limit(25)).all()
    for a in top_apps:
        print(f"  AppNum: {a.application_number} | Service: {a.service_type} | Status: {a.status} | IdempKey: {a.idempotency_key} | Created: {a.created_at}")

finally:
    db.close()
