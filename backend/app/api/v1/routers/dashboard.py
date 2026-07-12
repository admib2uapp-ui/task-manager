from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import CurrentUser, CurrentWorkspace, DbSession
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    workspace: CurrentWorkspace, current_user: CurrentUser, db: DbSession
) -> DashboardResponse:
    service = DashboardService(db)
    return await service.summary(workspace.id, current_user.id)
