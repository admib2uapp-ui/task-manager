from __future__ import annotations

import uuid
from urllib.parse import urlencode

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.github_repo_service import GitHubRepoService
from app.services.oauth_service import (
    PROVIDERS,
    build_authorize_url,
    build_github_connect_url,
    complete_github_connect,
    complete_oauth,
    enabled_providers,
    get_user_id_from_connect_state,
    verify_state,
)
from app.utils.crypto import decrypt_token, encrypt_token

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
    provider: str,
    db: DbSession,
    code: str | None = None,
    state: str | None = None,
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


# ── GitHub Account Connect (repo access, separate from login OAuth) ──

github_router = APIRouter(prefix="/auth/github", tags=["github-connect"])


@github_router.get("/status")
async def github_status(current_user: CurrentUser) -> dict:
    return {
        "connected": current_user.github_token is not None,
        "login": current_user.github_login,
        "avatarUrl": current_user.avatar_url
        if current_user.github_login
        else None,
    }


@github_router.get("/connect")
async def github_connect_start(
    db: DbSession,
    token: str,
) -> RedirectResponse:
    user = await AuthService(db).get_user_from_access_token(token)
    url = build_github_connect_url(str(user.id))
    return RedirectResponse(url, status_code=302)


@github_router.get("/callback")
async def github_connect_callback(
    db: DbSession,
    code: str | None = None,
    state: str | None = None,
) -> RedirectResponse:
    try:
        user_id_str = get_user_id_from_connect_state(state)
        user_id = uuid.UUID(user_id_str)
        result = await complete_github_connect(code)
    except Exception:
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/github?error=github_connect", status_code=302
        )

    user = await db.get(User, user_id)
    if user is None:
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/github?error=user_not_found", status_code=302
        )

    user.github_token = encrypt_token(result["access_token"])
    user.github_login = result["login"]
    if not user.avatar_url:
        user.avatar_url = result["avatar_url"]
    await db.flush()

    return RedirectResponse(
        f"{settings.FRONTEND_URL}/github?connected=1", status_code=302
    )


@github_router.get("/repos")
async def github_list_repos(
    current_user: CurrentUser,
    db: DbSession,
    search: str | None = None,
) -> list[dict]:
    if not current_user.github_token:
        raise BadRequestError("GitHub account not connected")

    token = decrypt_token(current_user.github_token)
    gh = GitHubRepoService(token)

    repos: list[dict] = []
    page = 1
    while len(repos) < 100:
        async with __import__("httpx").AsyncClient(
            timeout=30,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "Orbit/1.0",
            },
        ) as client:
            params = {
                "per_page": min(100 - len(repos), 100),
                "page": page,
                "sort": "updated",
            }
            if search:
                params["q"] = search
                resp = await client.get(
                    "https://api.github.com/search/repositories", params=params
                )
                resp.raise_for_status()
                data = resp.json()
                items = data.get("items", [])
                repos.extend(items)
                if len(items) < 100:
                    break
            else:
                resp = await client.get(
                    "https://api.github.com/user/repos", params=params
                )
                resp.raise_for_status()
                items = resp.json()
                repos.extend(items)
                if len(items) < 100:
                    break
        page += 1

    return [
        {
            "id": r.get("id"),
            "fullName": r.get("full_name", ""),
            "owner": r.get("owner", {}).get("login", ""),
            "name": r.get("name", ""),
            "description": r.get("description"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "openIssues": r.get("open_issues_count", 0),
            "defaultBranch": r.get("default_branch", "main"),
            "language": r.get("language"),
            "topics": r.get("topics", []),
            "isPrivate": r.get("private", False),
            "updatedAt": r.get("updated_at"),
            "htmlUrl": r.get("html_url", ""),
        }
        for r in repos[:100]
    ]


@github_router.post("/disconnect")
async def github_disconnect(
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    current_user.github_token = None
    current_user.github_login = None
    await db.flush()
    return {"message": "GitHub account disconnected"}
