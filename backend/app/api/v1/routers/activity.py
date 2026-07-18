from __future__ import annotations

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.core.deps import CurrentWorkspace, DbSession
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", response_model=list[AuditLogRead])
async def list_activity(
    workspace: CurrentWorkspace,
    db: DbSession,
    entity_type: str | None = Query(None, alias="entityType"),
    limit: int = Query(50, ge=1, le=200),
) -> list[AuditLogRead]:
    stmt = (
        select(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    result = await db.scalars(stmt)
    return [AuditLogRead.model_validate(log) for log in result.all()]
