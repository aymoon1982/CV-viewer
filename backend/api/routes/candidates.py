"""
TalentLens — Candidates API Routes
Upload CVs, list/get candidates, update status.
"""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.database import get_db
from models.schemas import Candidate, JobProfile
from schemas import CandidateResponse, CandidateStatusUpdate
from services.scoring_service import process_candidate_scoring

router = APIRouter()
settings = get_settings()


@router.post("/jobs/{job_id}/upload", status_code=202)
async def upload_cvs(
    job_id: str,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload one or more CV files (PDF/DOCX) for a job profile.
    Returns immediately with candidate stubs; processing happens async.
    """
    # Verify job exists
    result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")

    # Ensure upload directory exists
    upload_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(upload_dir, exist_ok=True)

    created = []
    for f in files:
        # Validate file type
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in (".pdf", ".docx"):
            continue

        # Check for duplicates based on original filename
        existing = await db.execute(
            select(Candidate).where(
                Candidate.job_profile_id == job_id,
                Candidate.cv_original_name == f.filename
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Save file
        file_id = str(uuid.uuid4())
        file_path = os.path.join(upload_dir, f"{file_id}{ext}")
        content = await f.read()
        with open(file_path, "wb") as fp:
            fp.write(content)

        # Create candidate stub
        candidate = Candidate(
            id=file_id,
            job_profile_id=job_id,
            name=os.path.splitext(f.filename or "Unknown")[0],
            cv_file_path=file_path,
            cv_original_name=f.filename,
            status="uploaded",
        )
        db.add(candidate)
        created.append(file_id)

    await db.flush()

    # Trigger async scoring pipeline for each created candidate
    for cid in created:
        background_tasks.add_task(process_candidate_scoring, cid)

    return {
        "message": f"{len(created)} CV(s) uploaded successfully",
        "candidate_ids": created,
        "job_id": job_id,
    }


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateResponse])
async def list_candidates(
    job_id: str,
    status: str | None = None,
    sort_by: str = "score_desc",
    db: AsyncSession = Depends(get_db),
):
    """List all candidates for a job profile, with optional filtering and sorting."""
    query = select(Candidate).where(Candidate.job_profile_id == job_id)

    if status:
        query = query.where(Candidate.status == status)

    if sort_by == "score_desc":
        query = query.order_by(Candidate.final_score.desc())
    elif sort_by == "score_asc":
        query = query.order_by(Candidate.final_score.asc())
    elif sort_by == "date":
        query = query.order_by(Candidate.created_at.desc())
    elif sort_by == "experience_desc":
        query = query.order_by(Candidate.years_experience.desc())
    else:
        query = query.order_by(Candidate.final_score.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed candidate profile."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.patch("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    data: CandidateStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update candidate status (shortlist, reject, etc.)."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    valid_statuses = {"shortlisted", "rejected", "under_review"}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    candidate.status = data.status
    if data.status == "shortlisted":
        candidate.shortlisted_at = datetime.utcnow()
    elif data.status == "rejected":
        candidate.rejected_at = datetime.utcnow()

    await db.flush()
    return {"message": f"Candidate status updated to {data.status}", "candidate_id": candidate_id}
