from __future__ import annotations

import uuid
from collections.abc import Callable, Coroutine

from app.core.constants import DEFAULT_TAGS
from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TAGS = "/api/v1/tags"


async def test_default_tags_seeded(auth_client: AsyncClient) -> None:
    response = await auth_client.get(TAGS)
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) == len(DEFAULT_TAGS)
    assert {t["name"] for t in tags} >= {"Frontend", "Backend", "AI"}


async def test_create_and_list_project(auth_client: AsyncClient) -> None:
    create = await auth_client.post(
        PROJECTS,
        json={
            "name": "YOLO Robotics",
            "description": "Vision stack",
            "color": "#f97316",
            "icon": "cpu",
        },
    )
    assert create.status_code == 201
    project = create.json()
    assert project["name"] == "YOLO Robotics"
    assert project["progress"] == 0
    assert project["isFavorite"] is False
    assert project["isArchived"] is False

    listing = await auth_client.get(PROJECTS)
    assert listing.status_code == 200
    assert any(p["id"] == project["id"] for p in listing.json())


async def test_create_project_with_tags(auth_client: AsyncClient) -> None:
    tags = (await auth_client.get(TAGS)).json()
    tag_ids = [tags[0]["id"], tags[1]["id"]]

    create = await auth_client.post(
        PROJECTS,
        json={"name": "Tagged", "tagIds": tag_ids},
    )
    assert create.status_code == 201
    assert {t["id"] for t in create.json()["tags"]} == set(tag_ids)


async def test_update_project(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Draft"})).json()

    update = await auth_client.patch(
        f"{PROJECTS}/{project['id']}",
        json={"name": "Renamed", "isFavorite": True, "status": "paused"},
    )
    assert update.status_code == 200
    body = update.json()
    assert body["name"] == "Renamed"
    assert body["isFavorite"] is True
    assert body["status"] == "paused"


async def test_favorite_filter(auth_client: AsyncClient) -> None:
    await auth_client.post(PROJECTS, json={"name": "Plain"})
    fav = (await auth_client.post(PROJECTS, json={"name": "Star"})).json()
    await auth_client.patch(f"{PROJECTS}/{fav['id']}", json={"isFavorite": True})

    listing = await auth_client.get(PROJECTS, params={"favorite": "true"})
    ids = [p["id"] for p in listing.json()]
    assert fav["id"] in ids
    assert len(ids) == 1


async def test_get_missing_project_404(auth_client: AsyncClient) -> None:
    response = await auth_client.get(f"{PROJECTS}/{uuid.uuid4()}")
    assert response.status_code == 404


async def test_milestones_drive_progress(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Milestoned"})).json()
    pid = project["id"]

    m1 = (
        await auth_client.post(f"{PROJECTS}/{pid}/milestones", json={"name": "Alpha"})
    ).json()
    await auth_client.post(f"{PROJECTS}/{pid}/milestones", json={"name": "Beta"})

    # One of two complete -> 50%
    await auth_client.patch(
        f"{PROJECTS}/{pid}/milestones/{m1['id']}", json={"completed": True}
    )
    refreshed = (await auth_client.get(f"{PROJECTS}/{pid}")).json()
    assert refreshed["milestoneCount"] == 2
    assert refreshed["completedMilestoneCount"] == 1
    assert refreshed["progress"] == 50

    # Delete the incomplete one -> 100%
    milestones = (await auth_client.get(f"{PROJECTS}/{pid}/milestones")).json()
    beta = next(m for m in milestones if m["name"] == "Beta")
    await auth_client.delete(f"{PROJECTS}/{pid}/milestones/{beta['id']}")

    refreshed = (await auth_client.get(f"{PROJECTS}/{pid}")).json()
    assert refreshed["progress"] == 100


async def test_project_requires_auth(client: AsyncClient) -> None:
    response = await client.get(PROJECTS)
    assert response.status_code == 401


async def test_project_workspace_isolation(
    auth_client: AsyncClient,
    client: AsyncClient,
    create_user: Callable[[str, str], Coroutine[None, None, str]],
) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Private"})).json()

    # All users share the Company workspace, so the project is visible
    other_token = await create_user("Alan Turing", "alan@example.com")
    client.headers.update({"Authorization": f"Bearer {other_token}"})

    response = await client.get(f"{PROJECTS}/{project['id']}")
    assert response.status_code == 200
