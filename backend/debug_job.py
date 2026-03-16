
import asyncio
from sqlalchemy import select
from models.database import async_session
from models.schemas import JobProfile

async def main():
    async with async_session() as db:
        result = await db.execute(select(JobProfile).order_by(JobProfile.id))
        jobs = result.scalars().all()
        for j in jobs:
            print(f"--- Job {j.id} ---")
            print(f"Title: {j.title}")
            print(f"Mandatory: {j.mandatory_criteria}")
            print(f"Preferred: {j.preferred_criteria}")
            print(f"Weights: {j.scoring_weights}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
