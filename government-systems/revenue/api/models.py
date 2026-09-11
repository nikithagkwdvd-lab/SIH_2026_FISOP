from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime
from revenue.api.database import Base

class RevenuePerson(Base):
    __tablename__ = "revenue_persons"

    revenue_person_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    annual_income = Column(Numeric(12, 2), nullable=False)
    tax_status = Column(String(50), nullable=False)
    income_verified = Column(Boolean, nullable=False, default=False)
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow)
