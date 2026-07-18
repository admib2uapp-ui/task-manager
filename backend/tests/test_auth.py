from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
REFRESH = "/api/v1/auth/refresh"
ME = "/api/v1/auth/me"
SYNC = "/api/v1/auth/sync"

CREDENTIALS = {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "supersecret123",
}


async def test_register_creates_user(client: AsyncClient) -> None:
    response = await client.post(REGISTER, json=CREDENTIALS)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["name"] == "Ada Lovelace"
    assert "accessToken" in body
    assert "refreshToken" in body
    assert body["tokenType"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)
    response = await client.post(REGISTER, json=CREDENTIALS)
    assert response.status_code == 409


async def test_login_local_user(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)
    response = await client.post(
        LOGIN,
        json={"email": CREDENTIALS["email"], "password": CREDENTIALS["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["name"] == "Ada Lovelace"
    assert "accessToken" in body
    assert "refreshToken" in body


async def test_login_supabase_user_blocked(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.core.security import hash_password as _hash_pw
    from app.repositories.user_repository import UserRepository
    from app.services.workspace_service import WorkspaceService

    repo = UserRepository(db_session)
    user = await repo.create(
        name="Supabase User",
        email="supa@example.com",
        hashed_password=_hash_pw("somepassword"),
        supabase_id="test-supabase-id",
    )
    ws_service = WorkspaceService(db_session)
    await ws_service.create_for_user(user)
    await db_session.commit()

    response = await client.post(
        LOGIN,
        json={"email": "supa@example.com", "password": "somepassword"},
    )
    assert response.status_code == 400
    assert "Supabase" in response.text


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)
    response = await client.post(
        LOGIN,
        json={"email": CREDENTIALS["email"], "password": "wrongpass"},
    )
    assert response.status_code == 401
    assert "Invalid login credentials" in response.text


async def test_me_requires_authentication(client: AsyncClient) -> None:
    response = await client.get(ME)
    assert response.status_code == 401


async def test_me_returns_user(auth_client: AsyncClient) -> None:
    response = await auth_client.get(ME)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "grace@example.com"
    assert body["name"] == "Grace Hopper"
    assert "password" not in body
