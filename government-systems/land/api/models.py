from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime
from land.api.database import Base

class LandOwner(Base):
    __tablename__ = "land_owners"

    owner_code = Column(String(50), primary_key=True, index=True)
    owner_name = Column(String(255), nullable=False)
    survey_number = Column(String(100), nullable=False)
    property_value = Column(Numeric(14, 2), nullable=False)
    ownership_status = Column(String(50), nullable=False)
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow)
