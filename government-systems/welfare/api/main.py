from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import text

from welfare.api.database import get_db, engine, Base, SessionLocal
from welfare.api.models import Beneficiary

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Beneficiary).count()
        if count == 0:
            names = [
                'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
                'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
                'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
                'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
                'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
                'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
            ]
            schemes = ['SCHOLARSHIP_2026', 'HOUSING_SUBSIDY', 'SENIOR_PENSION', 'DISABILITY_BENEFIT']
            eligibilities = ['ELIGIBLE', 'PENDING', 'INELIGIBLE']
            benefits = ['DISBURSED', 'HOLD', 'APPLIED', 'REJECTED']
            beneficiaries = []
            now = datetime.now(timezone.utc)
            for i in range(1, 101):
                b_id = f"BEN-{i:06d}"
                w_id = f"WEL-{i:06d}"
                name = f"{names[(i % len(names))]} ({i:03d})"
                sch = schemes[i % len(schemes)]
                el = eligibilities[i % len(eligibilities)]
                ben = benefits[i % len(benefits)]
                
                beneficiaries.append(Beneficiary(
                    beneficiary_id=b_id,
                    beneficiary_name=name,
                    scheme_code=sch,
                    eligibility_status=el,
                    benefit_status=ben,
                    last_updated=now - timedelta(hours=i)
                ))
                beneficiaries.append(Beneficiary(
                    beneficiary_id=w_id,
                    beneficiary_name=name,
                    scheme_code=sch,
                    eligibility_status=el,
                    benefit_status=ben,
                    last_updated=now - timedelta(hours=i)
                ))
            db.add_all(beneficiaries)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield

app = FastAPI(
    title="Welfare Department Legacy API",
    description="Simulated Welfare Department System serving social benefit entitlements and beneficiary data.",
    version="1.0.0",
    lifespan=lifespan
)

class BeneficiaryResponse(BaseModel):
    beneficiary_id: str
    beneficiary_name: str
    scheme_code: str
    eligibility_status: str
    benefit_status: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "Department of Social Welfare API",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get(
    "/api/welfare/beneficiary/{beneficiary_id}",
    response_model=BeneficiaryResponse,
    tags=["Welfare Beneficiary Records"]
)
def get_beneficiary(beneficiary_id: str, db: Session = Depends(get_db)):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.beneficiary_id == beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Welfare beneficiary record for identifier '{beneficiary_id}' not found."
        )
    return beneficiary
