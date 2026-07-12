from __future__ import annotations

from app.main import app
from httpx import ASGITransport, AsyncClient


async def _client() -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver")


async def test_health_ok() -> None:
    async with await _client() as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.1.0"


async def test_health_db_ok() -> None:
    async with await _client() as client:
        response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"


async def test_root() -> None:
    async with await _client() as client:
        response = await client.get("/")
    assert response.status_code == 200
    assert "name" in response.json()
