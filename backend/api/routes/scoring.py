"""
TalentLens — Scoring API Routes
Trigger and retrieve candidate scoring.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import Candidate, JobProfile
from schemas import ScoreResponse
from services.scoring_service import process_candidate_scoring

router = APIRouter()


@router.post("/candidates/{candidate_id}/score", response_model=ScoreResponse)
async def trigger_scoring(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """
    Trigger the AI scoring pipeline for a candidate.
    This will:
    1. Extract text from CV (if not already done)
    2. Run structured extraction
    3. Apply hard filters
    4. Score against criteria
    5. Generate AI summary
    """
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not candidate.cv_file_path:
        raise HTTPException(status_code=400, detail="No CV file found for this candidate")

    # Use the shared service to run parsing and save to DB
    await process_candidate_scoring(candidate_id)
    
    # Reload from DB session
    await db.refresh(candidate)

    return ScoreResponse(
        candidate_id=candidate.id,
        final_score=candidate.final_score,
        criterion_scores=candidate.criterion_scores or {},
        ai_summary=candidate.ai_summary,
        status=candidate.status,
    )


@router.get("/candidates/{candidate_id}/score", response_model=ScoreResponse)
async def get_score(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Get scoring results for a candidate."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return ScoreResponse(
        candidate_id=candidate.id,
        final_score=candidate.final_score,
        criterion_scores=candidate.criterion_scores or {},
        ai_summary=candidate.ai_summary,
        status=candidate.status,
    )
