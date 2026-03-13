import asyncio
from models.database import engine, Base
from models.schemas import *

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(init())
    print("Database initialized")
