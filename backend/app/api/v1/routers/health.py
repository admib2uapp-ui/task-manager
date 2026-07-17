from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.deps import DbSession
from app.schemas.common import DBHealthResponse, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        time=datetime.now(UTC),
    )


@router.get("/health/db", response_model=DBHealthResponse)
async def health_db(db: DbSession) -> DBHealthResponse:
    try:
        await db.execute(text("SELECT 1"))
        return DBHealthResponse(database="ok")
    except Exception as exc:  # noqa: BLE001 - report any driver/connection error
        return DBHealthResponse(database="error", detail=str(exc))
