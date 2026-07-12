from __future__ import annotations

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"
SEARCH = "/api/v1/search"


async def test_search_empty_query(auth_client: AsyncClient) -> None:
    resp = await auth_client.get(SEARCH, params={"q": ""})
    assert resp.status_code == 200
    assert resp.json() == {"projects": [], "tasks": []}


async def test_search_finds_projects_and_tasks(
    auth_client: AsyncClient,
) -> None:
    project = (
        await auth_client.post(PROJECTS, json={"name": "Robotics Vision"})
    ).json()
    await auth_client.post(
        TASKS,
        json={"projectId": project["id"], "title": "Vision calibration"},
    )
    await auth_client.post(
        TASKS, json={"projectId": project["id"], "title": "Unrelated"}
    )

    resp = await auth_client.get(SEARCH, params={"q": "vision"})
    assert resp.status_code == 200
    body = resp.json()
    assert any(p["name"] == "Robotics Vision" for p in body["projects"])
    assert any(t["title"] == "Vision calibration" for t in body["tasks"])
    assert body["tasks"][0]["projectName"] == "Robotics Vision"
