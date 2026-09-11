from datetime import datetime
from sqlalchemy import Column, String, DateTime
from welfare.api.database import Base

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    beneficiary_id = Column(String(50), primary_key=True, index=True)
    beneficiary_name = Column(String(255), nullable=False)
    scheme_code = Column(String(100), nullable=False)
    eligibility_status = Column(String(50), nullable=False)
    benefit_status = Column(String(50), nullable=False)
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow)
