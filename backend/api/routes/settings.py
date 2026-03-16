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
SETTING_KEYS = ["general", "ai", "notifications", "pipeline"]

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
    "pipeline": {
        "cvCharLimit": 8000,
        "minTextLength": 50,
        "skipCritic": False,
        "skipSummary": False,
        "extractionTemperature": 0.1,
        "scoringTemperature": 0.1,
        "criticTemperature": 0.1,
        "summaryTemperature": 0.3,
        "summaryMaxTokens": 300,
        "scoringMaxTokens": 4000,
        "shortlistThreshold": 0,
        "autoRejectThreshold": 0,
    },
}


@router.get("", response_model=SettingsResponse)
async def read_settings(db: AsyncSession = Depends(get_db)):
    """Get all application settings."""
    from config import get_settings as get_app_settings
    cfg = get_app_settings()

    result = await db.execute(select(AppSetting).where(AppSetting.key.in_(SETTING_KEYS)))
    rows = {r.key: json.loads(r.value) if r.value else {} for r in result.scalars().all()}

    # AI: config.py (.env) provides deployment defaults; DB values override them.
    # This means .env sets the key at deploy time; the Settings UI can change it at runtime.
    ai_base = {
        "provider": cfg.AI_PROVIDER,
        "apiKey": cfg.AI_API_KEY,
        "baseUrl": cfg.AI_API_BASE_URL,
        "model": cfg.AI_MODEL,
        "embeddingModel": cfg.AI_EMBEDDING_MODEL,
    }
    ai_merged = {**ai_base, **rows.get("ai", {})}

    return SettingsResponse(
        general=rows.get("general", DEFAULT_SETTINGS["general"]),
        ai=_sanitize_ai_settings(ai_merged),
        notifications=rows.get("notifications", DEFAULT_SETTINGS["notifications"]),
        pipeline=rows.get("pipeline", DEFAULT_SETTINGS["pipeline"]),
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    """Update application settings. Only provided sections are updated."""
    updates = data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if value is None:
            continue

        # For AI settings, prevent overwriting with masked keys
        if key == "ai" and "apiKey" in value:
            # value here is the Partial dict from frontend
            if not value["apiKey"] or "..." in value["apiKey"] or value["apiKey"] == "***":
                del value["apiKey"]

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
        ai_data = updates["ai"]
        # Skip updating apiKey if it's masked (e.g. contains "..." or is "***")
        # this happens when the frontend sends back the masked value from get_settings
        if "apiKey" in ai_data and ai_data["apiKey"]:
            key = ai_data["apiKey"]
            if "..." in key or key == "***":
                del ai_data["apiKey"]
        
        if ai_data:
            _apply_ai_settings(ai_data)

    return await read_settings(db)


@router.post("/test-ai")
async def test_ai_connection(data: dict | None = None):
    """
    Test the AI connection with provided or current settings.
    Does NOT save settings to the database.
    """
    from agents.llm_client import LLMClient
    from config import get_settings
    
    # Defaults from current config
    settings = get_settings()
    
    # Overrides from request if provided
    ai = data.get("ai", {}) if data else {}

    # If the apiKey sent is masked (display value) or empty, fall back to the
    # currently-configured runtime key so the test uses the real saved key.
    api_key = ai.get("apiKey")
    if not api_key or "..." in api_key or api_key == "***":
        api_key = settings.AI_API_KEY or None

    try:
        test_client = LLMClient(
            api_key=api_key,
            base_url=ai.get("baseUrl"),
            model=ai.get("model"),
            provider=ai.get("provider"),
            http_referer=settings.AI_HTTP_REFERER,
            site_name=settings.AI_SITE_NAME
        )
        
        model_results = await test_client.test_connection()
        
        chat_ok = model_results["chat"] == "passed"
        embed_ok = model_results["embedding"] in ["passed", "skipped"]
        
        if chat_ok and embed_ok:
            return {
                "status": "success",
                "message": "AI Connection Verified",
                "details": model_results
            }
        else:
            errors = []
            if not chat_ok: errors.append(f"Chat: {model_results['chat']}")
            if not embed_ok: errors.append(f"Embedding: {model_results['embedding']}")
            
            return {
                "status": "error",
                "message": " | ".join(errors),
                "details": model_results
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }



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
