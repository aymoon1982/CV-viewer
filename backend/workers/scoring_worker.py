"""
TalentLens — Background Scoring Worker (Stub)

FUTURE UPGRADE: When Redis is added, this will use arq or celery
for background job processing. For now, scoring is synchronous
via the /api/candidates/{id}/score endpoint.

Usage (future):
  cd backend && arq workers.scoring_worker.WorkerSettings
"""

# TODO: Implement background worker when Redis is added
#
# from arq import create_pool
# from arq.connections import RedisSettings
#
# async def process_cv(ctx, candidate_id: str, job_id: str):
#     """Background job: run scoring pipeline for a candidate."""
#     from agents.pipeline import run_scoring_pipeline
#     from models.database import async_session
#     from models.schemas import Candidate, JobProfile
#     from sqlalchemy import select
#
#     async with async_session() as db:
#         candidate = await db.get(Candidate, candidate_id)
#         job = await db.get(JobProfile, job_id)
#         if candidate and job:
#             result = await run_scoring_pipeline(candidate, job)
#             # Update candidate with results...
#             await db.commit()
#
# class WorkerSettings:
#     functions = [process_cv]
#     redis_settings = RedisSettings()
