from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

import httpx
import jwt

from app.core.config import settings
from app.core.exceptions import BadRequestError

PROVIDERS: dict[str, dict[str, str]] = {
    "google": {
        "authorize": "https://accounts.google.com/o/oauth2/v2/auth",
        "token": "https://oauth2.googleapis.com/token",
        "userinfo": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
    },
    "github": {
        "authorize": "https://github.com/login/oauth/authorize",
        "token": "https://github.com/login/oauth/access_token",
        "userinfo": "https://api.github.com/user",
        "emails": "https://api.github.com/user/emails",
        "scope": "read:user user:email",
    },
}


class OAuthUserInfo:
    def __init__(self, email: str, name: str | None, avatar_url: str | None):
        self.email = email
        self.name = name
        self.avatar_url = avatar_url


def enabled_providers() -> dict[str, bool]:
    return {
        "google": settings.google_enabled,
        "github": settings.github_enabled,
    }


def _credentials(provider: str) -> tuple[str, str]:
    if provider == "google" and settings.google_enabled:
        return settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET
    if provider == "github" and settings.github_enabled:
        return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET
    raise BadRequestError(f"OAuth provider '{provider}' is not configured")


def redirect_uri(provider: str) -> str:
    return (
        f"{settings.OAUTH_REDIRECT_BASE}{settings.API_V1_PREFIX}"
        f"/auth/oauth/{provider}/callback"
    )


def _make_state(provider: str) -> str:
    payload = {
        "provider": provider,
        "nonce": secrets.token_urlsafe(16),
        "type": "oauth_state",
        "exp": datetime.now(UTC) + timedelta(minutes=10),
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def verify_state(provider: str, state: str) -> None:
    try:
        payload = jwt.decode(
            state, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.PyJWTError as exc:
        raise BadRequestError("Invalid OAuth state") from exc
    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise BadRequestError("Invalid OAuth state")


def build_authorize_url(provider: str) -> str:
    client_id, _ = _credentials(provider)
    meta = PROVIDERS[provider]
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri(provider),
        "scope": meta["scope"],
        "response_type": "code",
        "state": _make_state(provider),
    }
    if provider == "google":
        params["access_type"] = "offline"
        params["prompt"] = "consent"
    return f"{meta['authorize']}?{urlencode(params)}"


async def _exchange_code(provider: str, code: str) -> str:
    client_id, client_secret = _credentials(provider)
    meta = PROVIDERS[provider]
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri(provider),
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            meta["token"], data=data, headers={"Accept": "application/json"}
        )
        resp.raise_for_status()
        token = resp.json().get("access_token")
    if not token:
        raise BadRequestError("Failed to obtain access token")
    return str(token)


async def _fetch_userinfo(provider: str, token: str) -> OAuthUserInfo:
    meta = PROVIDERS[provider]
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "Orbit",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(meta["userinfo"], headers=headers)
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()

        if provider == "google":
            email = data.get("email")
            name = data.get("name")
            avatar = data.get("picture")
        else:  # github
            name = data.get("name") or data.get("login")
            avatar = data.get("avatar_url")
            email = data.get("email")
            if not email:
                emails_resp = await client.get(meta["emails"], headers=headers)
                emails_resp.raise_for_status()
                emails = emails_resp.json()
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None,
                ) or next((e for e in emails if e.get("verified")), None)
                email = primary["email"] if primary else None

    if not email:
        raise BadRequestError("Could not retrieve a verified email")
    return OAuthUserInfo(email=email, name=name, avatar_url=avatar)


async def complete_oauth(provider: str, code: str) -> OAuthUserInfo:
    token = await _exchange_code(provider, code)
    return await _fetch_userinfo(provider, token)
