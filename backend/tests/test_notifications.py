from __future__ import annotations

from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"
NOTIF = "/api/v1/notifications"


async def test_overdue_notification_generated(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "N"})).json()
    yesterday = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    await auth_client.post(
        TASKS,
        json={
            "projectId": project["id"],
            "title": "Late task",
            "deadline": yesterday,
        },
    )

    resp = await auth_client.get(NOTIF)
    assert resp.status_code == 200
    body = resp.json()
    assert body["unreadCount"] >= 1
    assert any(n["type"] == "overdue" for n in body["items"])

    # calling again does not duplicate
    again = (await auth_client.get(NOTIF)).json()
    overdue = [n for n in again["items"] if n["type"] == "overdue"]
    assert len(overdue) == 1


async def test_mark_read_flow(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "N2"})).json()
    yesterday = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    await auth_client.post(
        TASKS,
        json={
            "projectId": project["id"],
            "title": "Late",
            "deadline": yesterday,
        },
    )
    items = (await auth_client.get(NOTIF)).json()["items"]
    first = items[0]["id"]

    read = await auth_client.post(f"{NOTIF}/{first}/read")
    assert read.json()["isRead"] is True

    await auth_client.post(f"{NOTIF}/read-all")
    count = (await auth_client.get(NOTIF + "/unread-count")).json()["count"]
    assert count == 0


async def test_notifications_require_auth(client: AsyncClient) -> None:
    assert (await client.get(NOTIF)).status_code == 401
