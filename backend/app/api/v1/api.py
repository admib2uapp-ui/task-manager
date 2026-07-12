from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routers import (
    analytics,
    auth,
    dashboard,
    health,
    projects,
    search,
    tags,
    tasks,
    time_entries,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(tags.router)
api_router.include_router(tasks.router)
api_router.include_router(dashboard.router)
api_router.include_router(search.router)
api_router.include_router(time_entries.router)
api_router.include_router(analytics.router)
