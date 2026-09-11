import os
from typing import Any, Dict
from app.connectors.base import BaseConnector
from app.schemas.interoperability import PropertyInformation


class LandConnector(BaseConnector):
    """
    Connector for Land Department API.
    Transforms raw Land payload into normalized PropertyInformation model.
    """
    def __init__(self, base_url: str = None, timeout: float = None):
        url = base_url or os.getenv("LAND_API_URL", "http://localhost:8002")
        super().__init__(department_name="LAND", base_url=url, timeout=timeout)

    async def health_check(self) -> Dict[str, Any]:
        return await self._get("/health")

    async def fetch_normalized_data(self, department_citizen_id: str) -> PropertyInformation:
        if not department_citizen_id:
            return PropertyInformation(
                source="land",
                status="NOT_MAPPED",
                error_detail="No identity mapping found for Land Department"
            )

        res = await self._get(f"/api/land/owner/{department_citizen_id}")
        if not res["success"]:
            return PropertyInformation(
                source="land",
                person_id=department_citizen_id,
                status="UNAVAILABLE" if res["error"] in ["TIMEOUT", "CONNECTION_FAILED", "HTTP_ERROR"] else "NOT_FOUND",
                error_detail=res.get("detail", "Error fetching land owner record")
            )

        data = res["data"]
        prop_val = float(data["property_value"]) if data.get("property_value") is not None else None

        return PropertyInformation(
            source="land",
            person_id=data.get("owner_code", department_citizen_id),
            survey_number=data.get("survey_number"),
            property_value=prop_val,
            ownership_status=data.get("ownership_status"),
            status="AVAILABLE"
        )
