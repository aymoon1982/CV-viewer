"""
TalentLens — Settings API Routes
Get and update runtime application settings.
"""

import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import AppSetting
from schemas import SettingsUpdate, SettingsResponse

router = APIRouter()

# Setting keys
SETTING_KEYS = ["general", "ai", "notifications"]

DEFAULT_SETTINGS = {
    "general": {
        "companyName": "TalentLens",
        "timezone": "Asia/Dubai",
        "defaultLocation": "Dubai, UAE",
    },
    "ai": {
        "provider": "openrouter",
        "apiKey": "",
        "baseUrl": "https://openrouter.ai/api/v1",
        "model": "arcee-ai/trinity-large-preview:free",
        "embeddingModel": "openai/text-embedding-3-small",
    },
    "notifications": {
        "emailOnUploadComplete": True,
        "emailOnScoringComplete": True,
        "emailOnWhatsAppReply": True,
        "inAppNotifications": True,
    },
}


@router.get("", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get all application settings."""
    result = await db.execute(select(AppSetting).where(AppSetting.key.in_(SETTING_KEYS)))
    rows = {r.key: json.loads(r.value) if r.value else {} for r in result.scalars().all()}

    return SettingsResponse(
        general=rows.get("general", DEFAULT_SETTINGS["general"]),
        ai=_sanitize_ai_settings(rows.get("ai", DEFAULT_SETTINGS["ai"])),
        notifications=rows.get("notifications", DEFAULT_SETTINGS["notifications"]),
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    """Update application settings. Only provided sections are updated."""
    updates = data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if value is None:
            continue

        result = await db.execute(select(AppSetting).where(AppSetting.key == key))
        setting = result.scalar_one_or_none()

        if setting:
            # Merge existing with new
            existing = json.loads(setting.value) if setting.value else {}
            existing.update(value)
            setting.value = json.dumps(existing)
        else:
            setting = AppSetting(key=key, value=json.dumps(value))
            db.add(setting)

    await db.flush()

    # If AI settings changed, update the runtime config
    if "ai" in updates and updates["ai"]:
        _apply_ai_settings(updates["ai"])

    return await get_settings(db)


def _sanitize_ai_settings(ai: dict) -> dict:
    """Mask API key in response."""
    if ai.get("apiKey"):
        key = ai["apiKey"]
        ai["apiKey"] = key[:6] + "..." + key[-4:] if len(key) > 10 else "***"
    return ai


def _apply_ai_settings(ai_updates: dict):
    """
    Apply AI settings changes to the runtime configuration.
    This allows changing the AI provider without restarting the server.
    """
    from config import get_settings
    settings = get_settings()

    if "provider" in ai_updates:
        settings.AI_PROVIDER = ai_updates["provider"]
    if "apiKey" in ai_updates and ai_updates["apiKey"]:
        settings.AI_API_KEY = ai_updates["apiKey"]
    if "baseUrl" in ai_updates:
        settings.AI_API_BASE_URL = ai_updates["baseUrl"]
    if "model" in ai_updates:
        settings.AI_MODEL = ai_updates["model"]
    if "embeddingModel" in ai_updates:
        settings.AI_EMBEDDING_MODEL = ai_updates["embeddingModel"]

    # Clear the LLM client cache so it picks up new settings
    from agents.llm_client import _clear_client_cache
    _clear_client_cache()
