from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.deps import CurrentWorkspace, DbSession
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    workspace: CurrentWorkspace,
    db: DbSession,
    q: str = Query("", max_length=200),
) -> SearchResponse:
    service = SearchService(db)
    return await service.search(workspace.id, q)
