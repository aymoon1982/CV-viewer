import sqlite3
import json

def debug_db():
    conn = sqlite3.connect('talentlens.db')
    cursor = conn.cursor()
    
    print("--- TABLES ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print([r[0] for r in cursor.fetchall()])
    
    print("\n--- APP SETTINGS ---")
    try:
        cursor.execute("SELECT key, value FROM app_settings")
        rows = cursor.fetchall()
        print(f"Count: {len(rows)}")
        for k, v in rows:
            print(f"Key: {k}, Value: {v}")
    except Exception as e:
        print(f"Error reading app_settings: {e}")
        
    print("\n--- CANDIDATE STATUS ---")
    try:
        cursor.execute("SELECT status, COUNT(*) FROM candidates GROUP BY status")
        print(cursor.fetchall())
        
        print("\n--- RECENT CANDIDATES ---")
        cursor.execute("SELECT name, status, created_at, elimination_reason FROM candidates ORDER BY created_at DESC LIMIT 10")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(f"Error reading candidates: {e}")
    
    conn.close()

if __name__ == "__main__":
    debug_db()
