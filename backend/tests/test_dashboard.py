from __future__ import annotations

from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"
DASHBOARD = "/api/v1/dashboard"


async def test_dashboard_empty(auth_client: AsyncClient) -> None:
    resp = await auth_client.get(DASHBOARD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["totalTasks"] == 0
    assert body["stats"]["completionRate"] == 0
    assert body["todayTasks"] == []
    assert body["upcomingDeadlines"] == []


async def test_dashboard_aggregates(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Dash"})).json()
    now = datetime.now(UTC)
    today = now.replace(hour=12, minute=0, second=0, microsecond=0)
    in_three_days = today + timedelta(days=3)

    # due today
    await auth_client.post(
        TASKS,
        json={
            "projectId": project["id"],
            "title": "Due today",
            "deadline": today.isoformat(),
        },
    )
    # upcoming
    await auth_client.post(
        TASKS,
        json={
            "projectId": project["id"],
            "title": "Soon",
            "deadline": in_three_days.isoformat(),
        },
    )
    # completed
    await auth_client.post(
        TASKS,
        json={"projectId": project["id"], "title": "Done", "status": "done"},
    )

    body = (await auth_client.get(DASHBOARD)).json()
    assert body["stats"]["totalTasks"] == 3
    assert body["stats"]["completedTasks"] == 1
    assert body["stats"]["dueToday"] == 1
    assert body["stats"]["activeProjects"] == 1
    assert len(body["todayTasks"]) == 1
    assert body["todayTasks"][0]["title"] == "Due today"
    assert len(body["upcomingDeadlines"]) == 1
    assert body["upcomingDeadlines"][0]["title"] == "Soon"
    assert body["stats"]["completionRate"] == 33


async def test_dashboard_requires_auth(client: AsyncClient) -> None:
    resp = await client.get(DASHBOARD)
    assert resp.status_code == 401
