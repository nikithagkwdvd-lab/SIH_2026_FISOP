import pytest
import httpx
from app.connectors.revenue_connector import RevenueConnector
from app.connectors.land_connector import LandConnector
from app.connectors.welfare_connector import WelfareConnector


@pytest.mark.anyio
async def test_revenue_connector_success(monkeypatch):
    """Test Revenue connector parses valid response correctly."""
    async def mock_get(self, endpoint):
        return {
            "success": True,
            "data": {
                "revenue_person_id": "REV-000001",
                "annual_income": "262500.50",
                "tax_status": "PENDING",
                "income_verified": False
            }
        }
    monkeypatch.setattr(RevenueConnector, "_get", mock_get)

    connector = RevenueConnector(base_url="http://mock-revenue")
    res = await connector.fetch_normalized_data("REV-000001")

    assert res.status == "AVAILABLE"
    assert res.source == "revenue"
    assert res.person_id == "REV-000001"
    assert res.annual_income == 262500.50
    assert res.tax_status == "PENDING"
    assert res.income_verified is False


@pytest.mark.anyio
async def test_land_connector_success(monkeypatch):
    """Test Land connector parses valid response correctly."""
    async def mock_get(self, endpoint):
        return {
            "success": True,
            "data": {
                "owner_code": "LAND-000001",
                "survey_number": "SY-1001/A",
                "property_value": "1500000.00",
                "ownership_status": "CLEAR_TITLE"
            }
        }
    monkeypatch.setattr(LandConnector, "_get", mock_get)

    connector = LandConnector(base_url="http://mock-land")
    res = await connector.fetch_normalized_data("LAND-000001")

    assert res.status == "AVAILABLE"
    assert res.source == "land"
    assert res.person_id == "LAND-000001"
    assert res.survey_number == "SY-1001/A"
    assert res.property_value == 1500000.00
    assert res.ownership_status == "CLEAR_TITLE"


@pytest.mark.anyio
async def test_welfare_connector_success(monkeypatch):
    """Test Welfare connector parses valid response correctly."""
    async def mock_get(self, endpoint):
        return {
            "success": True,
            "data": {
                "beneficiary_id": "BEN-000001",
                "scheme_code": "SCHOLARSHIP_2026",
                "eligibility_status": "ELIGIBLE",
                "benefit_status": "DISBURSED"
            }
        }
    monkeypatch.setattr(WelfareConnector, "_get", mock_get)

    connector = WelfareConnector(base_url="http://mock-welfare")
    res = await connector.fetch_normalized_data("BEN-000001")

    assert res.status == "AVAILABLE"
    assert res.source == "welfare"
    assert res.person_id == "BEN-000001"
    assert res.scheme_code == "SCHOLARSHIP_2026"
    assert res.eligibility_status == "ELIGIBLE"
    assert res.benefit_status == "DISBURSED"


@pytest.mark.anyio
async def test_connector_timeout_handling(monkeypatch):
    """Test connector gracefully handles timeout."""
    async def mock_get(self, endpoint):
        return {
            "success": False,
            "error": "TIMEOUT",
            "detail": "Timeout connecting to http://mock-api after 3.0s"
        }
    monkeypatch.setattr(RevenueConnector, "_get", mock_get)

    connector = RevenueConnector(base_url="http://mock-revenue")
    res = await connector.fetch_normalized_data("REV-000001")

    assert res.status == "UNAVAILABLE"
    assert "Timeout" in res.error_detail
