from __future__ import annotations

from httpx import AsyncClient

BASE = "/api/v1/auth/oauth"


async def test_providers_disabled_by_default(client: AsyncClient) -> None:
    resp = await client.get(f"{BASE}/providers")
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"google": False, "github": False}


async def test_start_unconfigured_provider_returns_400(
    client: AsyncClient,
) -> None:
    resp = await client.get(f"{BASE}/google/start", follow_redirects=False)
    assert resp.status_code == 400


async def test_unknown_provider_returns_400(client: AsyncClient) -> None:
    resp = await client.get(f"{BASE}/bitbucket/start", follow_redirects=False)
    assert resp.status_code == 400
