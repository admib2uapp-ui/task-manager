from __future__ import annotations

from urllib.parse import urlencode

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.deps import DbSession
from app.core.exceptions import BadRequestError
from app.services.auth_service import AuthService
from app.services.oauth_service import (
    PROVIDERS,
    build_authorize_url,
    complete_oauth,
    enabled_providers,
    verify_state,
)

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])


@router.get("/providers", response_model=dict)
async def list_providers() -> dict[str, bool]:
    return enabled_providers()


@router.get("/{provider}/start")
async def oauth_start(provider: str) -> RedirectResponse:
    if provider not in PROVIDERS:
        raise BadRequestError("Unknown OAuth provider")
    return RedirectResponse(build_authorize_url(provider), status_code=302)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str, code: str, state: str, db: DbSession
) -> RedirectResponse:
    try:
        if provider not in PROVIDERS:
            raise BadRequestError("Unknown OAuth provider")
        verify_state(provider, state)
        info = await complete_oauth(provider, code)
        auth = await AuthService(db).oauth_login(
            email=info.email, name=info.name, avatar_url=info.avatar_url
        )
    except Exception:  # noqa: BLE001 - any failure returns to the login page
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/login?error=oauth", status_code=302
        )

    fragment = urlencode(
        {
            "accessToken": auth.access_token,
            "refreshToken": auth.refresh_token,
        }
    )
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/oauth/callback#{fragment}", status_code=302
    )
