import os
from typing import Any, Dict
from app.connectors.base import BaseConnector
from app.schemas.interoperability import IncomeInformation


class RevenueConnector(BaseConnector):
    """
    Connector for Revenue Department API.
    Transforms raw Revenue payload into normalized IncomeInformation model.
    """
    def __init__(self, base_url: str = None, timeout: float = None):
        url = base_url or os.getenv("REVENUE_API_URL", "http://localhost:8001")
        super().__init__(department_name="REVENUE", base_url=url, timeout=timeout)

    async def health_check(self) -> Dict[str, Any]:
        return await self._get("/health")

    async def fetch_normalized_data(self, department_citizen_id: str) -> IncomeInformation:
        if not department_citizen_id:
            return IncomeInformation(
                source="revenue",
                status="NOT_MAPPED",
                error_detail="No identity mapping found for Revenue Department"
            )

        res = await self._get(f"/api/revenue/person/{department_citizen_id}")
        if not res["success"]:
            return IncomeInformation(
                source="revenue",
                person_id=department_citizen_id,
                status="UNAVAILABLE" if res["error"] in ["TIMEOUT", "CONNECTION_FAILED", "HTTP_ERROR"] else "NOT_FOUND",
                error_detail=res.get("detail", "Error fetching revenue record")
            )

        data = res["data"]
        annual_inc = float(data["annual_income"]) if data.get("annual_income") is not None else None

        return IncomeInformation(
            source="revenue",
            person_id=data.get("revenue_person_id", department_citizen_id),
            annual_income=annual_inc,
            tax_status=data.get("tax_status"),
            income_verified=data.get("income_verified"),
            status="AVAILABLE"
        )
