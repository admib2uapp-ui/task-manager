from __future__ import annotations

import logging
from importlib import import_module

from fastapi import APIRouter

logger = logging.getLogger(__name__)

api_router = APIRouter()


def _include_router(module_path: str, attr_name: str = "router", *, optional: bool = False) -> None:
    try:
        module = import_module(module_path)
        router = getattr(module, attr_name)
        api_router.include_router(router)
    except Exception:  # noqa: BLE001 - keep API bootable in serverless runtime
        if optional:
            logger.exception("Skipping optional router %s.%s", module_path, attr_name)
            return
        raise


# Core API routers that must be present.
_include_router("app.api.v1.routers.health")
_include_router("app.api.v1.routers.auth")
_include_router("app.api.v1.routers.oauth")
_include_router("app.api.v1.routers.oauth", "github_router", optional=True)
_include_router("app.api.v1.routers.projects")
_include_router("app.api.v1.routers.tags")
_include_router("app.api.v1.routers.tasks")
_include_router("app.api.v1.routers.dashboard")
_include_router("app.api.v1.routers.search")
_include_router("app.api.v1.routers.time_entries")
_include_router("app.api.v1.routers.analytics")
_include_router("app.api.v1.routers.notes")
_include_router("app.api.v1.routers.notifications")

# Optional routers often affected by serverless runtime limitations.
_include_router("app.api.v1.routers.repositories", optional=True)
_include_router("app.api.v1.routers.ws", optional=True)
