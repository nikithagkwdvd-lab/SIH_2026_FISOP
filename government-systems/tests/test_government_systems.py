import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure government-systems root directory is in sys.path
GOV_SYSTEMS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if GOV_SYSTEMS_DIR not in sys.path:
    sys.path.insert(0, GOV_SYSTEMS_DIR)

from revenue.api.main import app as revenue_app
from land.api.main import app as land_app
from welfare.api.main import app as welfare_app

# 1. Test Revenue Department API
def test_revenue_health():
    with TestClient(revenue_app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Department of Revenue API"

def test_revenue_person_lookup_success():
    with TestClient(revenue_app) as client:
        response = client.get("/api/revenue/person/REV-000001")
        assert response.status_code == 200
        data = response.json()
        assert data["revenue_person_id"] == "REV-000001"
        assert "annual_income" in data
        assert "tax_status" in data
        assert "income_verified" in data

def test_revenue_person_lookup_not_found():
    with TestClient(revenue_app) as client:
        response = client.get("/api/revenue/person/REV-999999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# 2. Test Land Department API
def test_land_health():
    with TestClient(land_app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Department of Land Records API"

def test_land_owner_lookup_success():
    with TestClient(land_app) as client:
        response = client.get("/api/land/owner/LAND-000001")
        assert response.status_code == 200
        data = response.json()
        assert data["owner_code"] == "LAND-000001"
        assert "survey_number" in data
        assert "property_value" in data
        assert "ownership_status" in data

def test_land_owner_lookup_not_found():
    with TestClient(land_app) as client:
        response = client.get("/api/land/owner/LAND-999999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# 3. Test Welfare Department API
def test_welfare_health():
    with TestClient(welfare_app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Department of Social Welfare API"

def test_welfare_beneficiary_lookup_success():
    with TestClient(welfare_app) as client:
        response = client.get("/api/welfare/beneficiary/BEN-000001")
        assert response.status_code == 200
        data = response.json()
        assert data["beneficiary_id"] == "BEN-000001"
        assert "scheme_code" in data
        assert "eligibility_status" in data
        assert "benefit_status" in data

def test_welfare_beneficiary_lookup_alias_success():
    with TestClient(welfare_app) as client:
        response = client.get("/api/welfare/beneficiary/WEL-000001")
        assert response.status_code == 200
        data = response.json()
        assert data["beneficiary_id"] == "WEL-000001"

def test_welfare_beneficiary_lookup_not_found():
    with TestClient(welfare_app) as client:
        response = client.get("/api/welfare/beneficiary/BEN-999999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
