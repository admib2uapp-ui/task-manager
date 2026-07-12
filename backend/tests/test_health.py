from __future__ import annotations

from httpx import AsyncClient


async def test_health_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.1.0"


async def test_health_db_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"


async def test_root(client: AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert "name" in response.json()
