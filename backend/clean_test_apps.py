import sqlite3

conn = sqlite3.connect("fisop_local.db")
cur = conn.cursor()

cur.execute("DELETE FROM notifications WHERE application_id NOT IN (SELECT id FROM applications WHERE application_number LIKE 'APP-2026-%-%')")
cur.execute("DELETE FROM workflow_instances WHERE application_id NOT IN (SELECT id FROM applications WHERE application_number LIKE 'APP-2026-%-%')")
cur.execute("DELETE FROM audit_logs WHERE resource_id NOT IN (SELECT application_number FROM applications WHERE application_number LIKE 'APP-2026-%-%')")
cur.execute("DELETE FROM applications WHERE application_number NOT LIKE 'APP-2026-%-%'")

conn.commit()

cur.execute("SELECT c.email, COUNT(a.id) FROM citizens c LEFT JOIN applications a ON c.id = a.citizen_id WHERE c.email IN ('citizen.000002@synthetic-gov.example', 'citizen.000004@synthetic-gov.example', 'citizen.000008@synthetic-gov.example') GROUP BY c.email")
for r in cur.fetchall():
    print("Citizen apps count:", r)

conn.close()
