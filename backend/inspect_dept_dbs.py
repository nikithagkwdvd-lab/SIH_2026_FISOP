import sqlite3, os

for db_name, label in [('revenue_dev.db', 'REVENUE'), ('land_dev.db', 'LAND'), ('welfare_dev.db', 'WELFARE')]:
    db_path = os.path.join('..', 'government-systems', db_name)
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cur.fetchall()
        print(f'{label} TABLES: {tables}')
        for (t,) in tables:
            cur.execute(f'PRAGMA table_info({t})')
            cols = [c[1] for c in cur.fetchall()]
            cur.execute(f'SELECT * FROM {t} LIMIT 6')
            rows = cur.fetchall()
            cur.execute(f'SELECT COUNT(*) FROM {t}')
            total = cur.fetchone()[0]
            print(f'  Table: {t}, cols: {cols}, total rows: {total}')
            for r in rows:
                print(f'    {dict(zip(cols, r))}')
        conn.close()
    else:
        print(f'{label}: db not found at {db_path}')
