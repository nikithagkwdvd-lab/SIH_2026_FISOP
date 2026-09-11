from datetime import datetime, timezone
from typing import Optional, Dict, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class IdentityResolutionResponse(BaseModel):
    canonical_id: str
    citizen_uuid: Optional[UUID] = None
    departments: Dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Map of department codes to legacy department citizen identifiers"
    )

    model_config = ConfigDict(from_attributes=True)


class IncomeInformation(BaseModel):
    source: str = "revenue"
    person_id: Optional[str] = None
    annual_income: Optional[float] = None
    tax_status: Optional[str] = None
    income_verified: Optional[bool] = None
    status: str = "AVAILABLE"  # AVAILABLE, UNAVAILABLE, NOT_MAPPED, TIMEOUT
    error_detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PropertyInformation(BaseModel):
    source: str = "land"
    person_id: Optional[str] = None
    survey_number: Optional[str] = None
    property_value: Optional[float] = None
    ownership_status: Optional[str] = None
    status: str = "AVAILABLE"  # AVAILABLE, UNAVAILABLE, NOT_MAPPED, TIMEOUT
    error_detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WelfareInformation(BaseModel):
    source: str = "welfare"
    person_id: Optional[str] = None
    scheme_code: Optional[str] = None
    eligibility_status: Optional[str] = None
    benefit_status: Optional[str] = None
    status: str = "AVAILABLE"  # AVAILABLE, UNAVAILABLE, NOT_MAPPED, TIMEOUT
    error_detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UnifiedCitizenOverview(BaseModel):
    citizen_id: str
    citizen_name: Optional[str] = None
    identity: Dict[str, Optional[str]] = Field(default_factory=dict)
    income: IncomeInformation
    property: PropertyInformation
    welfare: WelfareInformation
    sources: List[str] = Field(default_factory=list)
    department_status: Dict[str, str] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
