"""
TalentLens Backend — Configuration
Loads all environment variables via Pydantic BaseSettings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ────────────────────────────────────────────────────
    APP_NAME: str = "TalentLens"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production-min-32-chars!"
    CORS_ORIGINS: str = "http://localhost:3000"

    # ─── Database ───────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./talentlens.db"

    # ─── AI Provider (Unified — one API for all AI features) ────────────
    AI_PROVIDER: str = "openrouter"  # openrouter | openai | anthropic | ollama | custom
    AI_API_KEY: str = ""
    AI_API_BASE_URL: str = "https://openrouter.ai/api/v1"
    AI_MODEL: str = "openai/gpt-4o"
    AI_EMBEDDING_MODEL: str = "openai/text-embedding-3-small"

    # OpenRouter-specific headers (required by their API)
    AI_HTTP_REFERER: str = "http://localhost:3000"  # Your site URL
    AI_SITE_NAME: str = "TalentLens"  # Your site name

    # ─── File Storage ───────────────────────────────────────────────────
    STORAGE_BACKEND: str = "local"  # local | s3
    UPLOAD_DIR: str = "./uploads"
    S3_ENDPOINT: str = ""
    S3_BUCKET: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # ─── WhatsApp ───────────────────────────────────────────────────────
    WA_ACCESS_TOKEN: str | None = None
    WA_PHONE_NUMBER_ID: str | None = None
    WA_VERIFY_TOKEN: str = "talentlens_webhook_secret"

    # ─── FUTURE: Redis (Job Queue) ──────────────────────────────────────
    # REDIS_URL: str = "redis://localhost:6379"

    # ─── FUTURE: Qdrant (upgrade from pgvector) ────────────────────────
    # QDRANT_URL: str = "http://localhost:6333"

    # ─── FUTURE: Neo4j ─────────────────────────────────────────────────
    # NEO4J_URL: str = "bolt://localhost:7687"
    # NEO4J_USER: str = "neo4j"
    # NEO4J_PASSWORD: str = ""

    # ─── FUTURE: WhatsApp Business API ─────────────────────────────────
    # WHATSAPP_API_TOKEN: str = ""
    # WHATSAPP_PHONE_ID: str = ""
    # WHATSAPP_VERIFY_TOKEN: str = ""
    # WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""

    # ─── Monitoring (Optional) ─────────────────────────────────────────
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "talentlens"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_ollama(self) -> bool:
        return self.AI_PROVIDER == "ollama"

    @property
    def is_openrouter(self) -> bool:
        return self.AI_PROVIDER == "openrouter"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

