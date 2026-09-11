import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_complete_audit_and_workflow():
    print("==================================================")
    print("    FISOP PRODUCT + DATA AUDIT VERIFICATION")
    print("==================================================")

    # 1. Citizen A Login
    tok_res = requests.post(f"{BASE_URL}/api/dev/token", json={
        "sub": "dev-citizen-01-uuid",
        "username": "citizen_01",
        "roles": ["CITIZEN"],
        "preferred_username": "CIT-000001",
        "canonical_citizen_id": "CIT-000001",
        "email": "citizen.000001@synthetic-gov.example"
    })
    assert tok_res.status_code == 200
    token_a = tok_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}
    print("\n[OK] 1. Authenticated as Citizen A (CIT-000001)")

    # 2. Get Citizen A Applications (Should be exactly 3 before submission)
    apps_res = requests.get(f"{BASE_URL}/api/applications/citizens/CIT-000001/applications", headers=headers_a)
    assert apps_res.status_code == 200
    initial_apps = apps_res.json()
    print(f"[OK] 2. Citizen A Applications Count: {len(initial_apps)}")
    for a in initial_apps:
        print(f"       - {a['application_number']} | {a['service_type']} | Status: {a['status']}")
    assert len(initial_apps) == 3, f"Expected exactly 3 controlled demo apps, got {len(initial_apps)}"

    # 3. Submit Fresh Application with Idempotency Key
    idemp_key = "IDEMP-TEST-AUDIT-999"
    headers_a_idemp = {**headers_a, "Idempotency-Key": idemp_key}
    sub_res = requests.post(f"{BASE_URL}/api/applications", json={
        "service_type": "SCHOLARSHIP",
        "purpose": "SCHOLARSHIP_ELIGIBILITY"
    }, headers=headers_a_idemp)
    assert sub_res.status_code in [200, 201]
    new_app = sub_res.json()
    new_app_id = new_app["id"]
    print(f"\n[OK] 3. Submitted Fresh Application: {new_app['application_number']} (ID: {new_app_id}, Status: {new_app['status']})")

    # 4. Re-query Citizen A Applications (Should be exactly 4)
    apps_res_after = requests.get(f"{BASE_URL}/api/applications/citizens/CIT-000001/applications", headers=headers_a)
    assert len(apps_res_after.json()) == 4
    print(f"[OK] 4. Post-Submission Count: Exactly 4 applications for Citizen A")

    # 5. Duplicate Submission Test with same Idempotency Key
    dup_res = requests.post(f"{BASE_URL}/api/applications", json={
        "service_type": "SCHOLARSHIP",
        "purpose": "SCHOLARSHIP_ELIGIBILITY"
    }, headers=headers_a_idemp)
    assert dup_res.status_code in [200, 201]
    assert dup_res.json()["id"] == new_app_id
    apps_res_after_dup = requests.get(f"{BASE_URL}/api/applications/citizens/CIT-000001/applications", headers=headers_a)
    assert len(apps_res_after_dup.json()) == 4
    print(f"[OK] 5. Duplicate Idempotency Retry: Returns existing application {new_app['application_number']} without creating new record (Count remains 4)")

    # 6. Check Status Stepper Response for Fresh Application
    status_res = requests.get(f"{BASE_URL}/api/applications/{new_app_id}/status", headers=headers_a)
    assert status_res.status_code == 200
    st_data = status_res.json()
    print(f"\n[OK] 6. Live Status Stepper Pipeline for {st_data.get('application_number')}:")
    print(f"       - Overall Status: {st_data['status']}")
    print(f"       - Pipeline: {st_data['progress']}")

    # 7. Citizen B Login & Cross-Citizen Security Isolation
    tok_b_res = requests.post(f"{BASE_URL}/api/dev/token", json={
        "sub": "dev-citizen-02-uuid",
        "username": "citizen_02",
        "roles": ["CITIZEN"],
        "preferred_username": "CIT-000002",
        "canonical_citizen_id": "CIT-000002",
        "email": "citizen.000002@synthetic-gov.example"
    })
    assert tok_b_res.status_code == 200
    token_b = tok_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}", "Content-Type": "application/json"}
    print("\n[OK] 7. Authenticated as Citizen B (CIT-000002)")

    # Citizen B tries to view Citizen A's applications list -> 403
    unauth_list = requests.get(f"{BASE_URL}/api/applications/citizens/CIT-000001/applications", headers=headers_b)
    assert unauth_list.status_code == 403
    print(f"[OK] 8. Security Check: Citizen B cannot access Citizen A's applications list (HTTP {unauth_list.status_code})")

    # Citizen B tries to view Citizen A's application detail -> 403
    unauth_app = requests.get(f"{BASE_URL}/api/applications/{new_app_id}", headers=headers_b)
    assert unauth_app.status_code == 403
    print(f"[OK] 9. Security Check: Citizen B cannot access Citizen A's application detail (HTTP {unauth_app.status_code})")

    # Citizen B tries to view Citizen A's timeline -> 403
    unauth_timeline = requests.get(f"{BASE_URL}/api/operations/applications/{new_app_id}/timeline", headers=headers_b)
    assert unauth_timeline.status_code == 403
    print(f"[OK] 10. Security Check: Citizen B cannot access Citizen A's operational timeline (HTTP {unauth_timeline.status_code})")

    print("\n==================================================")
    print("    ALL 10 PRODUCT & DATA AUDIT TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_complete_audit_and_workflow()
