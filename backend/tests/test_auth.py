from __future__ import annotations

from httpx import AsyncClient

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
REFRESH = "/api/v1/auth/refresh"
ME = "/api/v1/auth/me"

CREDENTIALS = {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "supersecret123",
}


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_register_returns_tokens_and_user(client: AsyncClient) -> None:
    response = await client.post(REGISTER, json=CREDENTIALS)
    assert response.status_code == 201
    body = response.json()
    assert body["tokenType"] == "bearer"
    assert body["accessToken"]
    assert body["refreshToken"]
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["name"] == "Ada Lovelace"
    assert "password" not in body["user"]


async def test_register_duplicate_email_conflicts(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)
    response = await client.post(REGISTER, json=CREDENTIALS)
    assert response.status_code == 409


async def test_login_success_and_me(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)

    login = await client.post(
        LOGIN,
        json={"email": CREDENTIALS["email"], "password": CREDENTIALS["password"]},
    )
    assert login.status_code == 200
    access = login.json()["accessToken"]

    me = await client.get(ME, headers=_auth_header(access))
    assert me.status_code == 200
    assert me.json()["email"] == CREDENTIALS["email"]


async def test_login_wrong_password_unauthorized(client: AsyncClient) -> None:
    await client.post(REGISTER, json=CREDENTIALS)
    response = await client.post(
        LOGIN,
        json={"email": CREDENTIALS["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401


async def test_me_requires_authentication(client: AsyncClient) -> None:
    response = await client.get(ME)
    assert response.status_code == 401


async def test_refresh_issues_new_tokens(client: AsyncClient) -> None:
    register = await client.post(REGISTER, json=CREDENTIALS)
    refresh_token = register.json()["refreshToken"]

    response = await client.post(REFRESH, json={"refreshToken": refresh_token})
    assert response.status_code == 200
    body = response.json()
    assert body["accessToken"]
    assert body["refreshToken"]


async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    register = await client.post(REGISTER, json=CREDENTIALS)
    access_token = register.json()["accessToken"]

    # Passing an access token to the refresh endpoint must fail.
    response = await client.post(REFRESH, json={"refreshToken": access_token})
    assert response.status_code == 401
