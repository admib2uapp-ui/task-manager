from __future__ import annotations

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"


async def test_attachment_upload_and_delete(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Files"})).json()
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project["id"], "title": "With files"}
        )
    ).json()

    files = {"file": ("notes.txt", b"hello world", "text/plain")}
    resp = await auth_client.post(f"{TASKS}/{task['id']}/attachments", files=files)
    assert resp.status_code == 201
    detail = resp.json()
    assert len(detail["attachments"]) == 1
    att = detail["attachments"][0]
    assert att["fileName"] == "notes.txt"
    assert att["sizeBytes"] == 11
    assert att["mimeType"] == "text/plain"
    assert att["fileUrl"].startswith("/uploads/")

    deleted = await auth_client.delete(f"{TASKS}/{task['id']}/attachments/{att['id']}")
    assert deleted.status_code == 200
    assert deleted.json()["attachments"] == []
