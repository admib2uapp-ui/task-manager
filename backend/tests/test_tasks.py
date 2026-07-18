from __future__ import annotations

import uuid
from collections.abc import Callable, Coroutine

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"


async def _make_project(client: AsyncClient, name: str = "Board") -> str:
    resp = await client.post(PROJECTS, json={"name": name})
    return resp.json()["id"]


async def test_create_task(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    resp = await auth_client.post(
        TASKS,
        json={
            "projectId": project_id,
            "title": "Train YOLO model",
            "priority": "high",
            "status": "todo",
        },
    )
    assert resp.status_code == 201
    task = resp.json()
    assert task["title"] == "Train YOLO model"
    assert task["priority"] == "high"
    assert task["status"] == "todo"
    assert task["position"] > 0
    assert task["project"]["id"] == project_id
    assert task["subtasks"] == []
    assert task["dependencyIds"] == []


async def test_list_and_filter_tasks(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    await auth_client.post(
        TASKS,
        json={"projectId": project_id, "title": "A", "status": "todo"},
    )
    await auth_client.post(
        TASKS,
        json={"projectId": project_id, "title": "B", "status": "done"},
    )

    all_tasks = (await auth_client.get(TASKS, params={"projectId": project_id})).json()
    assert len(all_tasks) == 2

    done = (
        await auth_client.get(TASKS, params={"projectId": project_id, "status": "done"})
    ).json()
    assert len(done) == 1
    assert done[0]["title"] == "B"


async def test_move_task(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project_id, "title": "Move me"}
        )
    ).json()

    resp = await auth_client.post(
        f"{TASKS}/{task['id']}/move",
        json={"status": "in_progress", "position": 2048},
    )
    assert resp.status_code == 200
    moved = resp.json()
    assert moved["status"] == "in_progress"
    assert moved["position"] == 2048


async def test_update_task_tags(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    tags = (await auth_client.get("/api/v1/tags")).json()
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project_id, "title": "Tagged task"}
        )
    ).json()

    resp = await auth_client.patch(
        f"{TASKS}/{task['id']}",
        json={"tagIds": [tags[0]["id"]], "priority": "critical"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["priority"] == "critical"
    assert [t["id"] for t in body["tags"]] == [tags[0]["id"]]


async def test_subtasks_flow(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    task = (
        await auth_client.post(TASKS, json={"projectId": project_id, "title": "Parent"})
    ).json()

    detail = (
        await auth_client.post(
            f"{TASKS}/{task['id']}/subtasks", json={"title": "Step 1"}
        )
    ).json()
    assert len(detail["subtasks"]) == 1
    subtask_id = detail["subtasks"][0]["id"]

    detail = (
        await auth_client.patch(
            f"{TASKS}/{task['id']}/subtasks/{subtask_id}",
            json={"completed": True},
        )
    ).json()
    assert detail["subtasks"][0]["completed"] is True

    detail = (
        await auth_client.delete(f"{TASKS}/{task['id']}/subtasks/{subtask_id}")
    ).json()
    assert detail["subtasks"] == []


async def test_checklist_flow(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project_id, "title": "Checklist"}
        )
    ).json()

    detail = (
        await auth_client.post(
            f"{TASKS}/{task['id']}/checklist", json={"content": "Do X"}
        )
    ).json()
    assert len(detail["checklist"]) == 1


async def test_comments_flow(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project_id, "title": "Discuss"}
        )
    ).json()

    comment = (
        await auth_client.post(
            f"{TASKS}/{task['id']}/comments", json={"body": "Looks good"}
        )
    ).json()
    assert comment["body"] == "Looks good"
    assert comment["author"]["name"] == "Grace Hopper"

    detail = (await auth_client.get(f"{TASKS}/{task['id']}")).json()
    assert len(detail["comments"]) == 1

    await auth_client.delete(f"{TASKS}/{task['id']}/comments/{comment['id']}")
    detail = (await auth_client.get(f"{TASKS}/{task['id']}")).json()
    assert detail["comments"] == []


async def test_dependencies_flow(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    a = (
        await auth_client.post(TASKS, json={"projectId": project_id, "title": "A"})
    ).json()
    b = (
        await auth_client.post(TASKS, json={"projectId": project_id, "title": "B"})
    ).json()

    detail = (
        await auth_client.post(
            f"{TASKS}/{a['id']}/dependencies", json={"dependsOnId": b["id"]}
        )
    ).json()
    assert b["id"] in detail["dependencyIds"]

    # self-dependency rejected
    bad = await auth_client.post(
        f"{TASKS}/{a['id']}/dependencies", json={"dependsOnId": a["id"]}
    )
    assert bad.status_code == 400

    detail = (
        await auth_client.delete(f"{TASKS}/{a['id']}/dependencies/{b['id']}")
    ).json()
    assert detail["dependencyIds"] == []


async def test_project_task_counts(auth_client: AsyncClient) -> None:
    project_id = await _make_project(auth_client)
    await auth_client.post(
        TASKS,
        json={"projectId": project_id, "title": "one", "status": "done"},
    )
    await auth_client.post(TASKS, json={"projectId": project_id, "title": "two"})
    project = (await auth_client.get(f"{PROJECTS}/{project_id}")).json()
    assert project["taskCount"] == 2
    assert project["completedTaskCount"] == 1


async def test_task_not_found(auth_client: AsyncClient) -> None:
    resp = await auth_client.get(f"{TASKS}/{uuid.uuid4()}")
    assert resp.status_code == 404


async def test_task_workspace_isolation(
    auth_client: AsyncClient,
    client: AsyncClient,
    create_user: Callable[[str, str], Coroutine[None, None, str]],
) -> None:
    project_id = await _make_project(auth_client)
    task = (
        await auth_client.post(TASKS, json={"projectId": project_id, "title": "Secret"})
    ).json()

    other_token = await create_user("Alan Turing", "alan2@example.com")
    client.headers.update({"Authorization": f"Bearer {other_token}"})
    resp = await client.get(f"{TASKS}/{task['id']}")
    assert resp.status_code == 404
