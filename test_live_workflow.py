import requests

def main():
    print("--- LIVE WORKFLOW TEST SUITE ---\n")
    
    # 1. Dev Citizen Login
    tok_res = requests.post("http://127.0.0.1:8000/api/dev/token", json={
        "sub": "dev-citizen-01-uuid",
        "username": "citizen_01",
        "roles": ["CITIZEN"],
        "preferred_username": "CIT-000001",
        "canonical_citizen_id": "CIT-000001",
        "email": "citizen.000001@synthetic-gov.example"
    })
    assert tok_res.status_code == 200, f"Failed token: {tok_res.text}"
    cit_token = tok_res.json()["access_token"]
    print(f"[TEST 1] Citizen Authentication: SUCCESS (Token prefix: {cit_token[:20]}...)")

    # 2. Submit Scholarship Application
    headers = {
        "Authorization": f"Bearer {cit_token}",
        "Content-Type": "application/json",
        "Idempotency-Key": "LIVE-DEMO-APP-001"
    }
    app_res = requests.post("http://127.0.0.1:8000/api/applications", json={
        "service_type": "SCHOLARSHIP",
        "purpose": "SCHOLARSHIP_ELIGIBILITY"
    }, headers=headers)
    assert app_res.status_code in [200, 201], f"Failed submission: {app_res.text}"
    app_data = app_res.json()
    app_id = app_data["id"]
    app_num = app_data["application_number"]
    print(f"[TEST 2] Application Submission: SUCCESS ({app_num}, ID: {app_id}, Status: {app_data['status']})")

    # 3. Query Application Status
    status_res = requests.get(f"http://127.0.0.1:8000/api/applications/{app_id}/status", headers=headers)
    assert status_res.status_code == 200, f"Failed status: {status_res.text}"
    status_data = status_res.json()
    print(f"[TEST 3] Application Status Check: SUCCESS (Status: {status_data['status']}, Citizen: {status_data.get('canonical_citizen_id')})")
    print(f"         Department Pipeline: {status_data['progress']}")

    # 4. Dev Official Login
    off_tok_res = requests.post("http://127.0.0.1:8000/api/dev/token", json={
        "sub": "dev-rev-official-uuid",
        "username": "revenue_official",
        "roles": ["DEPARTMENT_OFFICIAL"],
        "preferred_username": "revenue_official",
        "department_code": "REV",
        "email": "revenue.officer@rev.gov.example"
    })
    assert off_tok_res.status_code == 200, f"Failed official token: {off_tok_res.text}"
    off_token = off_tok_res.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}
    print(f"[TEST 4] Department Official Auth: SUCCESS")

    # 5. Cross-Department Interoperability Overview
    overview_res = requests.get("http://127.0.0.1:8000/api/interoperability/citizens/CIT-000001/overview", headers=off_headers)
    assert overview_res.status_code == 200, f"Failed overview: {overview_res.text}"
    overview_data = overview_res.json()
    print(f"[TEST 5] Interoperability Overview: SUCCESS (Sources: {overview_data.get('sources')})")
    print(f"         Revenue Income: Rs. {overview_data['income'].get('annual_income')} (Status: {overview_data['income'].get('status')})")
    print(f"         Land Survey: {overview_data['property'].get('survey_number')} (Status: {overview_data['property'].get('status')})")
    print(f"         Welfare Scheme: {overview_data['welfare'].get('scheme_code')} (Status: {overview_data['welfare'].get('status')})")

    # 6. Operations Timeline
    timeline_res = requests.get(f"http://127.0.0.1:8000/api/operations/applications/{app_id}/timeline", headers=off_headers)
    assert timeline_res.status_code == 200, f"Failed timeline: {timeline_res.text}"
    timeline_data = timeline_res.json()
    print(f"[TEST 6] Operations Audit Timeline: SUCCESS ({len(timeline_data.get('events', []))} events recorded)")

    # 7. Operations Health Probes
    health_res = requests.get("http://127.0.0.1:8000/api/operations/health", headers=off_headers)
    assert health_res.status_code == 200, f"Failed health: {health_res.text}"
    health_data = health_res.json()
    print(f"[TEST 7] Operations Telemetry: SUCCESS")
    for svc in health_data.get("services", []):
        print(f"         -> {svc['service']}: {svc['status']} ({svc['response_time_ms']} ms)")

    print("\nALL 7 LIVE WORKFLOW TESTS PASSED!")

if __name__ == "__main__":
    main()
