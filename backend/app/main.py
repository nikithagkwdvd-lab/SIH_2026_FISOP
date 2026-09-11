import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.interoperability import router as interoperability_router
from app.api.applications import router as applications_router
from app.api.operations import router as operations_router
from app.api.ai_governance import router as ai_governance_router
from app.api.citizen_auth import router as citizen_auth_router
from app.api.notifications import router as notifications_router

app = FastAPI(
    title="Government Digital Interoperability Platform",
    description=(
        "Central Interoperability Platform orchestrating identity resolution, "
        "departmental API connectors, payload normalization, resilience, audit logging, "
        "SLA monitoring, data quality validation, and AI-assisted mapping governance."
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interoperability_router)
app.include_router(applications_router)
app.include_router(operations_router)
app.include_router(ai_governance_router)
app.include_router(citizen_auth_router)
app.include_router(notifications_router)


# Dev-only: register token issuance endpoint so the frontend devLogin() can get a real JWT
# This is strictly gated behind ENVIRONMENT=development and must never be deployed to production
if os.getenv("ENVIRONMENT", "development").lower() == "development":
    from app.api.dev_auth import router as dev_auth_router
    app.include_router(dev_auth_router)


@app.on_event("startup")
def startup_event():
    from app.db.database import engine
    from app.db.base import Base
    import app.db.models  # ensure models are registered
    if engine:
        try:
            Base.metadata.create_all(bind=engine)
            from seed.seed_database import seed_database
            from app.db.database import SessionLocal
            if SessionLocal:
                db = SessionLocal()
                try:
                    seed_database(db)
                except Exception as e:
                    print(f"[STARTUP] Seeding check/skip: {e}")
                finally:
                    db.close()
        except Exception as e:
            print(f"[STARTUP] DB initialization: {e}")


@app.get("/", tags=["Platform Root"])
def platform_root():
    return {
        "status": "healthy",
        "service": "Central Government Digital Interoperability Platform",
        "documentation": "/docs",
        "health": "/health",
        "frontend_url": "http://localhost:3000"
    }


@app.get("/health", tags=["Platform Health"])
def platform_health():
    return {
        "status": "healthy",
        "service": "Central Government Digital Interoperability Platform",
        "version": "1.0.0"
    }

