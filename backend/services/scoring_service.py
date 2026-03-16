import json
import logging
import os
from sqlalchemy import select
from models.database import async_session
from models.schemas import Candidate, JobProfile, AppSetting

# Set up a dedicated logger for scoring that writes to a file
scoring_log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scoring_debug.log")
file_handler = logging.FileHandler(scoring_log_path)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger = logging.getLogger("scoring_service")
logger.addHandler(file_handler)
logger.setLevel(logging.DEBUG)

async def process_candidate_scoring(candidate_id: str):
    """
    Background worker function to score a candidate.
    Creates its own DB session to avoid detached instance errors.
    """
    print(f"DEBUG: process_candidate_scoring started for {candidate_id}")
    from agents.pipeline import run_scoring_pipeline
    
    async with async_session() as db:
        print(f"DEBUG: DB session created for {candidate_id}")
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

            # 3. Load pipeline settings from DB
            pipeline_row = await db.execute(
                select(AppSetting).where(AppSetting.key == "pipeline")
            )
            pipeline_setting = pipeline_row.scalar_one_or_none()
            pipeline_cfg = (
                json.loads(pipeline_setting.value)
                if pipeline_setting and pipeline_setting.value
                else {}
            )

            # 4. Run Pipeline
            print(f"DEBUG: Starting scoring pipeline for {candidate_id}")
            logger.info(f"Starting scoring pipeline for candidate {candidate_id}")
            scores = await run_scoring_pipeline(candidate, job, pipeline_cfg=pipeline_cfg)
            print(f"DEBUG: Pipeline finished for {candidate_id}")

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
            logger.exception(f"CRITICAL ERROR scoring candidate {candidate_id}")
            try:
                await db.rollback()
            except Exception:
                pass
            # Re-fetch after rollback — the original `candidate` object is detached
            try:
                result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
                cand2 = result.scalar_one_or_none()
                if cand2:
                    cand2.status = "error"
                    cand2.final_score = 0
                    cand2.ai_summary = f"Scoring error: {str(e)}"
                    await db.commit()
                    logger.info(f"Marked candidate {candidate_id} as error")
            except Exception as inner_e:
                logger.error(f"Failed to update error status for {candidate_id}: {inner_e}")
