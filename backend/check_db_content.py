import sqlite3
import json

db_path = "d:/Project/HR-system/backend/talentlens.db"

def check_candidates():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Recent Candidates ---")
    cursor.execute("SELECT id, name, status, final_score, job_profile_id, created_at FROM candidates ORDER BY created_at DESC LIMIT 10")
    rows = cursor.fetchall()
    for row in rows:
        print(dict(row))
    
    print("\n--- Status Summary ---")
    cursor.execute("SELECT status, COUNT(*) as count FROM candidates GROUP BY status")
    rows = cursor.fetchall()
    for row in rows:
        print(f"{row['status']}: {row['count']}")
        
    conn.close()

if __name__ == "__main__":
    check_candidates()
