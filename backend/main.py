"""
TalentLens Backend — FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from models.database import engine, Base
from api.routes import jobs, candidates, scoring, chat, whatsapp, outcomes, settings as settings_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: create tables on startup, dispose engine on shutdown."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Load dynamic AI settings from the database on startup
    try:
        from sqlalchemy import select
        from models.schemas import AppSetting
        from models.database import async_session
        import json
        from api.routes.settings import _apply_ai_settings
        
        async with async_session() as session:
            result = await session.execute(select(AppSetting).where(AppSetting.key == "ai"))
            ai_setting = result.scalar_one_or_none()
            if ai_setting and ai_setting.value:
                ai_data = json.loads(ai_setting.value)
                _apply_ai_settings(ai_data)
    except Exception as e:
        print(f"Failed to load AI settings from database on startup: {e}")

    yield
    await engine.dispose()


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered recruitment screening platform",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ─────────────────────────────────────────────────────────────────

app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(candidates.router, prefix="/api", tags=["Candidates"])
app.include_router(scoring.router, prefix="/api", tags=["Scoring"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(outcomes.router, prefix="/api", tags=["Outcomes"])
app.include_router(settings_routes.router, prefix="/api/settings", tags=["Settings"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
    }


# ─── Static File Serving (CV uploads) ───────────────────────────────────────
# Served at /api/files/{job_id}/{filename} — must come after all API routes.

_upload_dir = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/api/files", StaticFiles(directory=_upload_dir), name="files")
