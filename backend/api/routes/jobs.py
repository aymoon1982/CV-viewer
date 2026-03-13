"""
TalentLens — Jobs API Routes
CRUD operations for job profiles.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import JobProfile, Candidate
from schemas import JobProfileCreate, JobProfileUpdate, JobProfileResponse, JobStatsResponse

router = APIRouter()


def _compute_score_distribution(candidates: list[Candidate]) -> list[dict]:
    """Compute score distribution buckets."""
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for c in candidates:
        s = c.final_score
        if s <= 20:
            buckets["0-20"] += 1
        elif s <= 40:
            buckets["21-40"] += 1
        elif s <= 60:
            buckets["41-60"] += 1
        elif s <= 80:
            buckets["61-80"] += 1
        else:
            buckets["81-100"] += 1
    return [{"range": k, "count": v} for k, v in buckets.items()]


def _build_stats(candidates: list[Candidate]) -> JobStatsResponse:
    scored = [c for c in candidates if c.status in ("scored", "shortlisted", "under_review", "rejected")]
    scores = [c.final_score for c in scored] if scored else []
    return JobStatsResponse(
        uploaded=len(candidates),
        scored=len(scored),
        shortlisted=len([c for c in candidates if c.status == "shortlisted"]),
        eliminated=len([c for c in candidates if c.status == "eliminated"]),
        avg_score=round(sum(scores) / len(scores), 1) if scores else 0,
        score_distribution=_compute_score_distribution(candidates),
    )


@router.get("", response_model=list[JobProfileResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """List all job profiles with computed stats."""
    result = await db.execute(select(JobProfile).order_by(JobProfile.created_at.desc()))
    jobs = result.scalars().all()

    responses = []
    for job in jobs:
        cand_result = await db.execute(
            select(Candidate).where(Candidate.job_profile_id == job.id)
        )
        candidates = cand_result.scalars().all()
        resp = JobProfileResponse(
            id=job.id,
            title=job.title,
            department=job.department,
            location=job.location,
            openings=job.openings,
            description=job.description,
            status=job.status,
            mandatory_criteria=job.mandatory_criteria or {},
            preferred_criteria=job.preferred_criteria or {},
            scoring_weights=job.scoring_weights or {},
            template_used=job.template_used,
            created_at=job.created_at,
            updated_at=job.updated_at,
            stats=_build_stats(candidates),
        )
        responses.append(resp)
    return responses


@router.get("/{job_id}", response_model=JobProfileResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single job profile by ID."""
    result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")

    cand_result = await db.execute(
        select(Candidate).where(Candidate.job_profile_id == job.id)
    )
    candidates = cand_result.scalars().all()

    return JobProfileResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        openings=job.openings,
        description=job.description,
        status=job.status,
        mandatory_criteria=job.mandatory_criteria or {},
        preferred_criteria=job.preferred_criteria or {},
        scoring_weights=job.scoring_weights or {},
        template_used=job.template_used,
        created_at=job.created_at,
        updated_at=job.updated_at,
        stats=_build_stats(candidates),
    )


@router.post("", response_model=JobProfileResponse, status_code=201)
async def create_job(data: JobProfileCreate, db: AsyncSession = Depends(get_db)):
    """Create a new job profile."""
    job = JobProfile(
        title=data.title,
        department=data.department,
        location=data.location,
        openings=data.openings,
        description=data.description,
        status=data.status,
        mandatory_criteria=data.mandatory_criteria,
        preferred_criteria=data.preferred_criteria,
        scoring_weights=data.scoring_weights,
        template_used=data.template_used,
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)

    return JobProfileResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        openings=job.openings,
        description=job.description,
        status=job.status,
        mandatory_criteria=job.mandatory_criteria or {},
        preferred_criteria=job.preferred_criteria or {},
        scoring_weights=job.scoring_weights or {},
        template_used=job.template_used,
        created_at=job.created_at,
        updated_at=job.updated_at,
        stats=JobStatsResponse(),
    )


@router.put("/{job_id}", response_model=JobProfileResponse)
async def update_job(job_id: str, data: JobProfileUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing job profile."""
    result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    job.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(job)

    cand_result = await db.execute(
        select(Candidate).where(Candidate.job_profile_id == job.id)
    )
    candidates = cand_result.scalars().all()

    return JobProfileResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        openings=job.openings,
        description=job.description,
        status=job.status,
        mandatory_criteria=job.mandatory_criteria or {},
        preferred_criteria=job.preferred_criteria or {},
        scoring_weights=job.scoring_weights or {},
        template_used=job.template_used,
        created_at=job.created_at,
        updated_at=job.updated_at,
        stats=_build_stats(candidates),
    )


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a job profile and all associated candidates."""
    result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")

    await db.delete(job)
