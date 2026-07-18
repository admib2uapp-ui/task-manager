from __future__ import annotations

from httpx import AsyncClient

GITHUB_STATUS = "/api/v1/auth/github/status"


async def test_github_status_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(GITHUB_STATUS)
    assert resp.status_code == 401


async def test_github_status_authenticated(auth_client: AsyncClient) -> None:
    resp = await auth_client.get(GITHUB_STATUS)
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"connected": False, "login": None, "avatarUrl": None}
