from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import CurrentUser, CurrentWorkspace, DbSession
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsOverview)
async def analytics_overview(
    workspace: CurrentWorkspace, current_user: CurrentUser, db: DbSession
) -> AnalyticsOverview:
    service = AnalyticsService(db)
    return await service.overview(workspace.id, current_user.id)
