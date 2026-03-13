import logging
from sqlalchemy import select
from models.database import async_session
from models.schemas import Candidate, JobProfile

logger = logging.getLogger(__name__)

async def process_candidate_scoring(candidate_id: str):
    """
    Background worker function to score a candidate.
    Creates its own DB session to avoid detached instance errors.
    """
    from agents.pipeline import run_scoring_pipeline
    
    async with async_session() as db:
        try:
            # 1. Fetch Candidate
            result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
            candidate = result.scalar_one_or_none()
            if not candidate:
                logger.error(f"Scoring failed: Candidate {candidate_id} not found")
                return

            # Update status to extracting
            candidate.status = "extracting"
            await db.commit()

            # 2. Fetch Job Profile
            job_result = await db.execute(
                select(JobProfile).where(JobProfile.id == candidate.job_profile_id)
            )
            job = job_result.scalar_one_or_none()
            if not job:
                logger.error(f"Scoring failed: Job profile {candidate.job_profile_id} not found")
                candidate.status = "error"
                candidate.ai_summary = "Job profile not found."
                await db.commit()
                return

            if not candidate.cv_file_path:
                logger.error(f"Scoring failed: No CV file for candidate {candidate_id}")
                candidate.status = "error"
                candidate.ai_summary = "No CV file uploaded."
                await db.commit()
                return

            # Update status to scoring before we hit the heavy LLM pipeline
            candidate.status = "scoring"
            await db.commit()

            # 3. Run Pipeline
            logger.info(f"Starting scoring pipeline for candidate {candidate_id}")
            scores = await run_scoring_pipeline(candidate, job)

            # 4. Save Results
            candidate.status = scores.get("status", "scored")
            candidate.final_score = scores.get("final_score", 0)
            candidate.criterion_scores = scores.get("criterion_scores", {})
            candidate.ai_summary = scores.get("ai_summary", "")
            candidate.extraction_confidence = scores.get("extraction_confidence", 0)
            candidate.elimination_reason = scores.get("elimination_reason")

            # Update extracted data
            if "name" in scores: candidate.name = scores["name"]
            if "email" in scores: candidate.email = scores["email"]
            if "phone" in scores: candidate.phone = scores["phone"]
            if "years_experience" in scores: candidate.years_experience = scores["years_experience"]
            if "education" in scores: candidate.education = scores["education"]
            if "experience" in scores: candidate.experience = scores["experience"]
            if "skills" in scores: candidate.skills = scores["skills"]
            if "certifications" in scores: candidate.certifications = scores["certifications"]
                
            await db.commit()
            logger.info(f"Successfully scored candidate {candidate_id} (Score: {candidate.final_score})")

        except Exception as e:
            await db.rollback()
            logger.error(f"Exception during scoring candidate {candidate_id}: {str(e)}")
            try:
                candidate.status = "scored"
                candidate.final_score = 0
                candidate.ai_summary = f"Scoring error: {str(e)}"
                await db.commit()
            except Exception:
                pass
