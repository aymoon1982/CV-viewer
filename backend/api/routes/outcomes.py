from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import get_db
from models.schemas import Candidate, JobProfile
from schemas import CandidateOutcomeUpdate, CandidateResponse, JobProfileResponse

router = APIRouter()

@router.patch("/candidates/{candidate_id}/outcome", response_model=CandidateResponse)
async def update_candidate_outcome(
    candidate_id: str, 
    data: CandidateOutcomeUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Update the hiring outcome for a candidate."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.hiring_outcome = data.hiring_outcome
    candidate.hiring_notes = data.hiring_notes
    
    # If hired, we might want to mark as settled or something, 
    # but for now just updating the outcome field is enough.
    
    await db.commit()
    await db.refresh(candidate)
    return candidate

@router.patch("/candidates/{candidate_id}/archive", response_model=CandidateResponse)
async def archive_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Archive a specific candidate."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.is_archived = True
    await db.commit()
    await db.refresh(candidate)
    return candidate

@router.patch("/jobs/{job_id}/archive", response_model=JobProfileResponse)
async def archive_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Archive a job profile and all its candidates."""
    # 1. Archive Job
    result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")
        
    job.is_archived = True
    job.status = "closed"
    
    # 2. Archive all candidates for this job
    await db.execute(
        select(Candidate)
        .where(Candidate.job_profile_id == job_id)
    )
    # Note: For bulk update in SQLAlchemy 2.0 async, it's better to use update()
    from sqlalchemy import update
    await db.execute(
        update(Candidate)
        .where(Candidate.job_profile_id == job_id)
        .values(is_archived=True)
    )
    
    await db.commit()
    await db.refresh(job)
    return job
