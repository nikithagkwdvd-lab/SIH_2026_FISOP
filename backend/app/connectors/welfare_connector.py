import os
from typing import Any, Dict
from app.connectors.base import BaseConnector
from app.schemas.interoperability import WelfareInformation


class WelfareConnector(BaseConnector):
    """
    Connector for Welfare Department API.
    Transforms raw Welfare payload into normalized WelfareInformation model.
    """
    def __init__(self, base_url: str = None, timeout: float = None):
        url = base_url or os.getenv("WELFARE_API_URL", "http://localhost:8003")
        super().__init__(department_name="WELFARE", base_url=url, timeout=timeout)

    async def health_check(self) -> Dict[str, Any]:
        return await self._get("/health")

    async def fetch_normalized_data(self, department_citizen_id: str) -> WelfareInformation:
        if not department_citizen_id:
            return WelfareInformation(
                source="welfare",
                status="NOT_MAPPED",
                error_detail="No identity mapping found for Welfare Department"
            )

        res = await self._get(f"/api/welfare/beneficiary/{department_citizen_id}")
        if not res["success"]:
            return WelfareInformation(
                source="welfare",
                person_id=department_citizen_id,
                status="UNAVAILABLE" if res["error"] in ["TIMEOUT", "CONNECTION_FAILED", "HTTP_ERROR"] else "NOT_FOUND",
                error_detail=res.get("detail", "Error fetching welfare beneficiary record")
            )

        data = res["data"]
        return WelfareInformation(
            source="welfare",
            person_id=data.get("beneficiary_id", department_citizen_id),
            scheme_code=data.get("scheme_code"),
            eligibility_status=data.get("eligibility_status"),
            benefit_status=data.get("benefit_status"),
            status="AVAILABLE"
        )
