import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class FieldDefinitionInput(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "yearlyFamilyEarnings"}, description="Field name in external department schema")
    type: str = Field("string", json_schema_extra={"example": "number"}, description="Data type e.g. string, number, boolean")
    description: Optional[str] = Field(None, json_schema_extra={"example": "Annual family income in INR"}, description="Semantic description of the field")


class SchemaAnalysisRequest(BaseModel):
    department: str = Field(..., json_schema_extra={"example": "Education"}, description="Name of external/new government department")
    schema_version: str = Field("1.0", json_schema_extra={"example": "1.0"}, description="Version of the incoming schema")
    fields: List[FieldDefinitionInput] = Field(..., description="List of schema fields to analyze")


class MappingSuggestionResponse(BaseModel):
    id: uuid.UUID
    department: str
    schema_version: str
    source_field: str
    source_type: str
    source_description: Optional[str] = None
    canonical_field: str
    canonical_type: str
    confidence_score: float
    confidence_category: str
    reason: str
    candidate_fields: Optional[List[str]] = None
    requires_human_approval: bool
    status: str
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    model_provider: str
    model_name: str
    trace_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchemaAnalysisResponse(BaseModel):
    analysis_id: str
    department: str
    schema_version: str
    suggestions_count: int
    suggestions: List[Dict[str, Any]]
    trace_id: str


class MappingApprovalRequest(BaseModel):
    comments: Optional[str] = Field(None, description="Optional data steward approval notes")


class MappingRejectionRequest(BaseModel):
    reason: Optional[str] = Field("Rejected by data steward", description="Reason for rejecting candidate mapping")


class CanonicalFieldResponse(BaseModel):
    name: str
    type: str
    description: str
    domain: str
    example: Optional[Any] = None
