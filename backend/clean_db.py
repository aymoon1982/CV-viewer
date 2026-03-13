import asyncio
from sqlalchemy import select
from models.database import engine, get_db
from models.schemas import Candidate, JobProfile
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)

def clean_duplicates():
    session = Session()
    # Get the job
    job = session.query(JobProfile).order_by(JobProfile.created_at.desc()).first()
    if not job:
        return
        
    print(f"Cleaning duplicates for Job: {job.title}")
    
    candidates = session.query(Candidate).filter(Candidate.job_profile_id == job.id).all()
    
    # group by filename
    from collections import defaultdict
    grouped = defaultdict(list)
    for c in candidates:
        grouped[c.cv_original_name].append(c)
        
    for filename, c_list in grouped.items():
        if len(c_list) > 1:
            print(f"Found {len(c_list)} copies of {filename}. Keeping highest score, deleting rest.")
            c_list.sort(key=lambda x: x.final_score, reverse=True)
            # Keep first
            keep = c_list[0]
            for to_delete in c_list[1:]:
                session.delete(to_delete)
                
    session.commit()
    print("Done cleaning duplicates.")

if __name__ == "__main__":
    clean_duplicates()
