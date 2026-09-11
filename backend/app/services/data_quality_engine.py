from typing import Dict, Any, List, Tuple
from dataclasses import dataclass, field


@dataclass
class DataQualityReport:
    department: str
    operation: str
    completeness_score: float
    validity_score: float
    overall_score: float
    errors: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "department": self.department,
            "operation": self.operation,
            "completeness_score": self.completeness_score,
            "validity_score": self.validity_score,
            "overall_score": round(self.overall_score, 2),
            "errors": self.errors
        }


class DataQualityEngine:
    """
    Deterministic (Non-AI/LLM) Data Quality Validation & Scoring Engine for Departmental Payloads.
    Structural Validity check: required fields, non-negative numeric fields, enum checks.
    """

    @staticmethod
    def validate_revenue_payload(data: Dict[str, Any]) -> DataQualityReport:
        errors = []
        req_count = 3  # annual_income, tax_status, income_verified
        valid_count = 3

        # 1. Required presence
        annual_income = data.get("annual_income")
        tax_status = data.get("tax_status")
        income_verified = data.get("income_verified")

        missing_fields = []
        if annual_income is None:
            missing_fields.append("annual_income")
        if tax_status is None:
            missing_fields.append("tax_status")
        if income_verified is None:
            missing_fields.append("income_verified")

        for m in missing_fields:
            errors.append({"field": m, "error": "REQUIRED_FIELD_MISSING"})

        comp_score = max(0.0, ((req_count - len(missing_fields)) / req_count) * 100.0)

        # 2. Validity checks
        invalid_fields = 0
        if annual_income is not None:
            try:
                val = float(annual_income)
                if val < 0:
                    errors.append({"field": "annual_income", "error": "NUMERIC_VALUE_NEGATIVE"})
                    invalid_fields += 1
            except (ValueError, TypeError):
                errors.append({"field": "annual_income", "error": "INVALID_NUMERIC_FORMAT"})
                invalid_fields += 1

        allowed_statuses = ["FILED", "PENDING", "EXEMPT", "AUDIT_FLAGGED", "UNKNOWN"]
        if tax_status is not None and str(tax_status).upper() not in allowed_statuses:
            errors.append({"field": "tax_status", "error": f"INVALID_ENUM_VALUE (Must be one of {allowed_statuses})"})
            invalid_fields += 1

        val_score = max(0.0, ((valid_count - invalid_fields) / valid_count) * 100.0)
        overall = round((comp_score * 0.5) + (val_score * 0.5), 2)

        return DataQualityReport(
            department="REVENUE",
            operation="INCOME_VERIFICATION",
            completeness_score=round(comp_score, 2),
            validity_score=round(val_score, 2),
            overall_score=overall,
            errors=errors
        )

    @staticmethod
    def validate_land_payload(data: Dict[str, Any]) -> DataQualityReport:
        errors = []
        req_count = 3  # property_value, survey_number, ownership_status
        valid_count = 3

        prop_val = data.get("property_value")
        survey = data.get("survey_number")
        status = data.get("ownership_status")

        missing_fields = []
        if prop_val is None:
            missing_fields.append("property_value")
        if survey is None:
            missing_fields.append("survey_number")
        if status is None:
            missing_fields.append("ownership_status")

        for m in missing_fields:
            errors.append({"field": m, "error": "REQUIRED_FIELD_MISSING"})

        comp_score = max(0.0, ((req_count - len(missing_fields)) / req_count) * 100.0)

        invalid_fields = 0
        if prop_val is not None:
            try:
                val = float(prop_val)
                if val < 0:
                    errors.append({"field": "property_value", "error": "NUMERIC_VALUE_NEGATIVE"})
                    invalid_fields += 1
            except (ValueError, TypeError):
                errors.append({"field": "property_value", "error": "INVALID_NUMERIC_FORMAT"})
                invalid_fields += 1

        allowed_statuses = ["CLEAR_TITLE", "DISPUTED", "MORTGAGED", "LEASEHOLD", "UNKNOWN"]
        if status is not None and str(status).upper() not in allowed_statuses:
            errors.append({"field": "ownership_status", "error": f"INVALID_ENUM_VALUE (Must be one of {allowed_statuses})"})
            invalid_fields += 1

        val_score = max(0.0, ((valid_count - invalid_fields) / valid_count) * 100.0)
        overall = round((comp_score * 0.5) + (val_score * 0.5), 2)

        return DataQualityReport(
            department="LAND",
            operation="PROPERTY_VERIFICATION",
            completeness_score=round(comp_score, 2),
            validity_score=round(val_score, 2),
            overall_score=overall,
            errors=errors
        )

    @staticmethod
    def validate_welfare_payload(data: Dict[str, Any]) -> DataQualityReport:
        errors = []
        req_count = 3  # benefit_status, eligibility_status, scheme_code
        valid_count = 3

        ben_status = data.get("benefit_status")
        el_status = data.get("eligibility_status")
        scheme = data.get("scheme_code")

        missing_fields = []
        if ben_status is None:
            missing_fields.append("benefit_status")
        if el_status is None:
            missing_fields.append("eligibility_status")
        if scheme is None:
            missing_fields.append("scheme_code")

        for m in missing_fields:
            errors.append({"field": m, "error": "REQUIRED_FIELD_MISSING"})

        comp_score = max(0.0, ((req_count - len(missing_fields)) / req_count) * 100.0)

        invalid_fields = 0
        allowed_benefits = ["DISBURSED", "HOLD", "APPLIED", "REJECTED", "UNKNOWN"]
        if ben_status is not None and str(ben_status).upper() not in allowed_benefits:
            errors.append({"field": "benefit_status", "error": f"INVALID_ENUM_VALUE (Must be one of {allowed_benefits})"})
            invalid_fields += 1

        allowed_eligibility = ["ELIGIBLE", "PENDING", "INELIGIBLE", "UNKNOWN"]
        if el_status is not None and str(el_status).upper() not in allowed_eligibility:
            errors.append({"field": "eligibility_status", "error": f"INVALID_ENUM_VALUE (Must be one of {allowed_eligibility})"})
            invalid_fields += 1

        val_score = max(0.0, ((valid_count - invalid_fields) / valid_count) * 100.0)
        overall = round((comp_score * 0.5) + (val_score * 0.5), 2)

        return DataQualityReport(
            department="WELFARE",
            operation="WELFARE_VERIFICATION",
            completeness_score=round(comp_score, 2),
            validity_score=round(val_score, 2),
            overall_score=overall,
            errors=errors
        )
