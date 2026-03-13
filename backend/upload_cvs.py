import os
import time
import requests

API_URL = "http://localhost:8000/api"

def main():
    print("Fetching jobs...")
    jobs = requests.get(f"{API_URL}/jobs").json()
    if not jobs:
        print("No jobs found! Did the browser agent create one?")
        return
        
    job_id = jobs[0]['id']
    print(f"Found Job ID: {job_id} ({jobs[0].get('title')})")

    cv_dir = r"d:\Project\HR-system\test_cvs"
    pdf_files = [os.path.join(cv_dir, f) for f in os.listdir(cv_dir) if f.endswith('.pdf')]
    if not pdf_files:
        print("No PDFs found!")
        return

    # Prepare files
    files = []
    file_objs = []
    try:
        for f in pdf_files:
            file_obj = open(f, 'rb')
            file_objs.append(file_obj)
            files.append(('files', (os.path.basename(f), file_obj, 'application/pdf')))
            
        print(f"Uploading {len(files)} files to {API_URL}/jobs/{job_id}/upload...")
        resp = requests.post(f"{API_URL}/jobs/{job_id}/upload", files=files)
        print("Upload Status:", resp.status_code)
        upload_data = resp.json()
    finally:
        for f in file_objs:
            f.close()

    candidate_ids = upload_data.get("candidate_ids", [])
    if not candidate_ids:
        print("No candidates uploaded?")
        return

    print(f"\nTriggering AI processing for {len(candidate_ids)} candidates sequentially...")
    
    for cid in candidate_ids:
        print(f"\nScoring candidate {cid}...")
        start_time = time.time()
        score_resp = requests.post(f"{API_URL}/candidates/{cid}/score")
        elapsed = time.time() - start_time
        
        if score_resp.status_code == 200:
            data = score_resp.json()
            print(f" -> Success! Final Score: {data.get('final_score')} (took {elapsed:.1f}s)")
            print(f" -> AI Summary: {data.get('ai_summary')}")
        else:
            print(f" -> Error! Status: {score_resp.status_code}, Response: {score_resp.text}")

    print("\n✅ End-to-end Test Completed!")
    final_cands = requests.get(f"{API_URL}/jobs/{job_id}/candidates").json()
    print("\nFINAL LEADERBOARD:")
    for c in sorted(final_cands, key=lambda x: x.get('final_score', 0), reverse=True):
        print(f"- {c.get('name')} [{c.get('status')}] Score: {c.get('final_score'):.1f} | Experience: {c.get('years_experience')} yrs")

if __name__ == "__main__":
    main()
