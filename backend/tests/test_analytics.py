from __future__ import annotations

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"
ANALYTICS = "/api/v1/analytics"


async def test_analytics_overview(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "A"})).json()
    await auth_client.post(
        TASKS,
        json={
            "projectId": project["id"],
            "title": "Done one",
            "status": "done",
            "priority": "high",
        },
    )
    await auth_client.post(
        TASKS,
        json={"projectId": project["id"], "title": "Todo", "status": "todo"},
    )

    resp = await auth_client.get(ANALYTICS)
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalTasks"] == 2
    assert body["completedTasks"] == 1
    assert body["completionRate"] == 50
    assert len(body["completedPerDay"]) == 14
    assert len(body["hoursPerDay"]) == 14
    statuses = {s["label"]: s["count"] for s in body["statusDistribution"]}
    assert statuses.get("done") == 1
    assert statuses.get("todo") == 1


async def test_analytics_requires_auth(client: AsyncClient) -> None:
    resp = await client.get(ANALYTICS)
    assert resp.status_code == 401
