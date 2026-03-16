import sqlite3

db_path = "d:/Project/HR-system/backend/talentlens.db"

def check_jobs_and_candidates():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Job Profiles ---")
    cursor.execute("SELECT id, title, department FROM job_profiles")
    jobs = cursor.fetchall()
    for job in jobs:
        cursor.execute("SELECT COUNT(*) as count FROM candidates WHERE job_profile_id = ?", (job['id'],))
        count = cursor.fetchone()['count']
        print(f"ID: {job['id']} | Title: {job['title']} | Candidates: {count}")
        
    conn.close()

if __name__ == "__main__":
    check_jobs_and_candidates()
