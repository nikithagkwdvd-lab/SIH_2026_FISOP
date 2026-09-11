import sqlite3

conn = sqlite3.connect('fisop_local.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cur.fetchall()
print("TABLES:", tables)

cur.execute("SELECT COUNT(*) FROM applications")
print("Application count:", cur.fetchone()[0])

cur.execute("PRAGMA table_info(applications)")
cols = cur.fetchall()
print("\nApplications columns:")
for c in cols:
    print(" ", c)

cur.execute("PRAGMA table_info(notifications)")
cols = cur.fetchall()
print("\nNotifications columns:")
for c in cols:
    print(" ", c)

conn.close()
print("\nDone.")
