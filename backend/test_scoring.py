
import asyncio
import logging
from services.scoring_service import process_candidate_scoring
from models.database import async_session
from sqlalchemy import select
from models.schemas import Candidate

logging.basicConfig(level=logging.INFO)

async def test_scoring():
    async with async_session() as db:
        # Get the latest uploaded but unscored candidate
        result = await db.execute(
            select(Candidate).where(Candidate.status == "uploaded").order_by(Candidate.created_at.desc()).limit(1)
        )
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            print("No candidates with 'uploaded' status found.")
            # Let's just pick one to re-score
            result = await db.execute(select(Candidate).limit(1))
            candidate = result.scalar_one_or_none()
            
        if candidate:
            print(f"Testing scoring for candidate: {candidate.id} ({candidate.cv_original_name})")
            await process_candidate_scoring(candidate.id)
            print("Scoring test complete.")
        else:
            print("No candidates found in DB.")

if __name__ == "__main__":
    asyncio.run(test_scoring())
