import asyncio
from sqlalchemy import select
from models.database import async_session
from models.schemas import Candidate
from services.vector_store import index_candidate_cv
from services.cv_processor import extract_text

async def index_existing():
    async with async_session() as db:
        result = await db.execute(select(Candidate))
        candidates = result.scalars().all()
        
        for c in candidates:
            if c.cv_file_path:
                print(f"Indexing {c.name}...")
                text = extract_text(c.cv_file_path)
                if text:
                    index_candidate_cv(c.id, c.job_profile_id, text)
                else:
                    print(f"No text for {c.name}")
        
    print("Done indexing existing candidates.")

if __name__ == "__main__":
    asyncio.run(index_existing())
