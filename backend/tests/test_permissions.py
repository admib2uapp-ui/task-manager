from __future__ import annotations

from app.main import app
from httpx import ASGITransport, AsyncClient


def _make_client(token: str) -> AsyncClient:
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://testserver")
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


class TestProjectOwnership:
    async def test_owner_can_update_project(
        self, auth_client: AsyncClient
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
        )
        assert resp.status_code == 201
        pid = resp.json()["id"]

        resp = await auth_client.patch(
            f"/api/v1/projects/{pid}",
            json={"name": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"

    async def test_non_owner_cannot_update_project(
        self, auth_client: AsyncClient, create_user
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
        )
        assert resp.status_code == 201
        pid = resp.json()["id"]

        other_token = await create_user("Other", "other@example.com")
        async with _make_client(other_token) as other:
            resp = await other.patch(
                f"/api/v1/projects/{pid}",
                json={"name": "Hacked"},
            )
            assert resp.status_code == 403

    async def test_owner_can_delete_project(
        self, auth_client: AsyncClient
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
        )
        assert resp.status_code == 201
        pid = resp.json()["id"]

        resp = await auth_client.delete(f"/api/v1/projects/{pid}")
        assert resp.status_code == 200

    async def test_non_owner_cannot_delete_project(
        self, auth_client: AsyncClient, create_user
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
        )
        assert resp.status_code == 201
        pid = resp.json()["id"]

        other_token = await create_user("Other", "other@example.com")
        async with _make_client(other_token) as other:
            resp = await other.delete(f"/api/v1/projects/{pid}")
        assert resp.status_code == 403

    async def test_non_owner_can_read_project(
        self, auth_client: AsyncClient, create_user
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "My Project"},
        )
        assert resp.status_code == 201
        pid = resp.json()["id"]

        other_token = await create_user("Other", "other@example.com")
        async with _make_client(other_token) as other:
            resp = await other.get(f"/api/v1/projects/{pid}")
            assert resp.status_code == 200


class TestTaskOwnership:
    async def test_owner_can_update_task(
        self, auth_client: AsyncClient
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "Project"},
        )
        pid = resp.json()["id"]
        resp = await auth_client.post(
            "/api/v1/tasks",
            json={"projectId": pid, "title": "Task"},
        )
        assert resp.status_code == 201
        tid = resp.json()["id"]

        resp = await auth_client.patch(
            f"/api/v1/tasks/{tid}",
            json={"title": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"

    async def test_non_owner_cannot_update_task(
        self, auth_client: AsyncClient, create_user
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "Project"},
        )
        pid = resp.json()["id"]
        resp = await auth_client.post(
            "/api/v1/tasks",
            json={"projectId": pid, "title": "Task"},
        )
        tid = resp.json()["id"]

        other_token = await create_user("Other", "other@example.com")
        async with _make_client(other_token) as other:
            resp = await other.patch(
                f"/api/v1/tasks/{tid}",
                json={"title": "Hacked"},
            )
            assert resp.status_code == 403

    async def test_non_owner_cannot_delete_task(
        self, auth_client: AsyncClient, create_user
    ) -> None:
        resp = await auth_client.post(
            "/api/v1/projects",
            json={"name": "Project"},
        )
        pid = resp.json()["id"]
        resp = await auth_client.post(
            "/api/v1/tasks",
            json={"projectId": pid, "title": "Task"},
        )
        tid = resp.json()["id"]

        other_token = await create_user("Other", "other@example.com")
        async with _make_client(other_token) as other:
            resp = await other.delete(f"/api/v1/tasks/{tid}")
            assert resp.status_code == 403
