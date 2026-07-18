from __future__ import annotations

import os
from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App ---
    PROJECT_NAME: str = "Orbit API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # --- Database ---
    # Accepts a standard Postgres URL (e.g. from Neon). It is normalised to the
    # asyncpg driver at the engine layer, so `postgresql://...` is fine here.
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/orbit"

    # --- File uploads (local disk; swap for S3 in production) ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_BYTES: int = 25 * 1024 * 1024  # 25 MB

    # --- Security / JWT (custom backend tokens — kept for backward compat) ---
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- Supabase Auth ---
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_JWT_ALGORITHM: str = "HS256"

    # --- CORS ---
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    # --- OAuth (optional; dormant until credentials are provided) ---
    FRONTEND_URL: str = "http://localhost:3000"
    OAUTH_REDIRECT_BASE: str = "http://localhost:8000"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # --- LLM (AI integration) ---
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.3

    # --- Background jobs ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Repository scanning ---
    REPO_STORAGE_DIR: str = "repo_cache"
    MAX_SCAN_FILES: int = 50000
    MAX_FILE_SIZE_BYTES: int = 2 * 1024 * 1024  # 2 MB

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}

    @property
    def is_vercel(self) -> bool:
        # Vercel automatically injects `VERCEL=1` in the runtime environment.
        return os.getenv("VERCEL") == "1"

    @property
    def effective_upload_dir(self) -> str:
        # Vercel file system is ephemeral and only writable under /tmp.
        if self.is_vercel:
            return "/tmp/uploads"
        return self.UPLOAD_DIR

    @property
    def google_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    @property
    def github_enabled(self) -> bool:
        return bool(self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
