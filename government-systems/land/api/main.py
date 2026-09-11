from datetime import datetime, timezone, timedelta
from decimal import Decimal
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import text

from land.api.database import get_db, engine, Base, SessionLocal
from land.api.models import LandOwner

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(LandOwner).count()
        if count == 0:
            names = [
                'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
                'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
                'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
                'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
                'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
                'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
            ]
            statuses = ['CLEAR_TITLE', 'DISPUTED', 'MORTGAGED', 'LEASEHOLD']
            owners = []
            now = datetime.now(timezone.utc)
            for i in range(1, 101):
                code = f"LAND-{i:06d}"
                name = f"{names[(i % len(names))]} ({i:03d})"
                survey = f"SY-{1000 + i}/{chr(65 + (i % 6))}"
                val = Decimal(str(1500000 + (i * 85000.00)))
                st = statuses[i % len(statuses)]
                owners.append(LandOwner(
                    owner_code=code,
                    owner_name=name,
                    survey_number=survey,
                    property_value=val,
                    ownership_status=st,
                    last_updated=now - timedelta(hours=i)
                ))
            db.add_all(owners)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield

app = FastAPI(
    title="Land Department Legacy API",
    description="Simulated Land Department System serving land registry and ownership data.",
    version="1.0.0",
    lifespan=lifespan
)

class LandOwnerResponse(BaseModel):
    owner_code: str
    owner_name: str
    survey_number: str
    property_value: Decimal
    ownership_status: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "Department of Land Records API",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get(
    "/api/land/owner/{owner_code}",
    response_model=LandOwnerResponse,
    tags=["Land Ownership Records"]
)
def get_land_owner(owner_code: str, db: Session = Depends(get_db)):
    owner = db.query(LandOwner).filter(LandOwner.owner_code == owner_code).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Land record for owner code '{owner_code}' not found."
        )
    return owner
