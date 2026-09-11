from datetime import datetime, timezone, timedelta
from decimal import Decimal
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import text

from revenue.api.database import get_db, engine, Base, SessionLocal
from revenue.api.models import RevenuePerson

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(RevenuePerson).count()
        if count == 0:
            names = [
                'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
                'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
                'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
                'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
                'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
                'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
            ]
            statuses = ['FILED', 'PENDING', 'EXEMPT', 'AUDIT_FLAGGED']
            persons = []
            now = datetime.now(timezone.utc)
            for i in range(1, 101):
                # Citizen 2 (REV-000002) is deterministically omitted to demonstrate the MISSING DOCUMENT / NOT FOUND workflow
                if i == 2:
                    continue
                p_id = f"REV-{i:06d}"
                p_name = f"{names[(i % len(names))]} ({i:03d})"
                p_income = Decimal(str(250000 + (i * 12500.50)))
                p_status = statuses[i % len(statuses)]
                p_verified = (i % 2 == 0)
                persons.append(RevenuePerson(
                    revenue_person_id=p_id,
                    full_name=p_name,
                    annual_income=p_income,
                    tax_status=p_status,
                    income_verified=p_verified,
                    last_updated=now - timedelta(hours=i)
                ))
            db.add_all(persons)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield

app = FastAPI(
    title="Revenue Department Legacy API",
    description="Simulated Revenue Department System serving tax and income verification data.",
    version="1.0.0",
    lifespan=lifespan
)

class RevenuePersonResponse(BaseModel):
    revenue_person_id: str
    full_name: str
    annual_income: Decimal
    tax_status: str
    income_verified: bool
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "Department of Revenue API",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get(
    "/api/revenue/person/{revenue_person_id}",
    response_model=RevenuePersonResponse,
    tags=["Revenue Records"]
)
def get_revenue_person(revenue_person_id: str, db: Session = Depends(get_db)):
    person = db.query(RevenuePerson).filter(RevenuePerson.revenue_person_id == revenue_person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Revenue record for person identifier '{revenue_person_id}' not found."
        )
    return person
