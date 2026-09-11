from typing import Dict, Any, List, Optional


class CanonicalFieldDefinition:
    def __init__(
        self,
        name: str,
        type: str,
        description: str,
        domain: str,
        example: Optional[Any] = None
    ):
        self.name = name
        self.type = type
        self.description = description
        self.domain = domain
        self.example = example

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "domain": self.domain,
            "example": self.example
        }


class CanonicalSchemaRegistry:
    """
    Single Source of Truth Canonical Schema Registry.
    Defines official canonical fields, data types, semantic descriptions, and domain tags.
    """
    def __init__(self):
        self.fields: Dict[str, CanonicalFieldDefinition] = {
            "citizen_id": CanonicalFieldDefinition(
                name="citizen_id",
                type="string",
                description="Unique canonical citizen identifier across digital platforms",
                domain="IDENTITY",
                example="CIT-000001"
            ),
            "annual_income": CanonicalFieldDefinition(
                name="annual_income",
                type="number",
                description="Total annual family income in INR",
                domain="REVENUE",
                example=250000.0
            ),
            "tax_status": CanonicalFieldDefinition(
                name="tax_status",
                type="string",
                description="Tax filing status e.g. FILED, PENDING, EXEMPT",
                domain="REVENUE",
                example="FILED"
            ),
            "income_verified": CanonicalFieldDefinition(
                name="income_verified",
                type="boolean",
                description="Tax or Income verification status flag",
                domain="REVENUE",
                example=True
            ),
            "survey_number": CanonicalFieldDefinition(
                name="survey_number",
                type="string",
                description="Land parcel survey or plot identification number",
                domain="LAND",
                example="SY-10293/A"
            ),
            "property_value": CanonicalFieldDefinition(
                name="property_value",
                type="number",
                description="Assessed valuation of land or property owned by family in INR",
                domain="LAND",
                example=450000.0
            ),
            "ownership_status": CanonicalFieldDefinition(
                name="ownership_status",
                type="string",
                description="Property ownership type e.g. SINGLE, JOINT, INHERITED",
                domain="LAND",
                example="SINGLE"
            ),
            "scheme_code": CanonicalFieldDefinition(
                name="scheme_code",
                type="string",
                description="Social welfare scheme identifier or code",
                domain="WELFARE",
                example="SCH-2026-WEL"
            ),
            "eligibility_status": CanonicalFieldDefinition(
                name="eligibility_status",
                type="string",
                description="Welfare scheme eligibility evaluation result e.g. ELIGIBLE, INELIGIBLE",
                domain="WELFARE",
                example="ELIGIBLE"
            ),
            "benefit_status": CanonicalFieldDefinition(
                name="benefit_status",
                type="string",
                description="Welfare benefit disbursement status e.g. ACTIVE, DISBURSED, SUSPENDED",
                domain="WELFARE",
                example="ACTIVE"
            )
        }

    def get_field(self, field_name: str) -> Optional[CanonicalFieldDefinition]:
        return self.fields.get(field_name.lower())

    def has_field(self, field_name: str) -> bool:
        return field_name.lower() in self.fields

    def get_all_fields(self) -> List[Dict[str, Any]]:
        return [f.to_dict() for f in self.fields.values()]
