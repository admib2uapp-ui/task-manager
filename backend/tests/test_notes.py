from __future__ import annotations

from httpx import AsyncClient

NOTES = "/api/v1/notes"


async def test_note_crud(auth_client: AsyncClient) -> None:
    created = await auth_client.post(
        NOTES, json={"title": "Research", "content": "# Ideas\n- one"}
    )
    assert created.status_code == 201
    note = created.json()
    assert note["title"] == "Research"

    listing = await auth_client.get(NOTES)
    assert listing.status_code == 200
    assert any(n["id"] == note["id"] for n in listing.json())

    updated = await auth_client.patch(
        f"{NOTES}/{note['id']}", json={"content": "updated body"}
    )
    assert updated.json()["content"] == "updated body"

    got = await auth_client.get(f"{NOTES}/{note['id']}")
    assert got.json()["content"] == "updated body"

    deleted = await auth_client.delete(f"{NOTES}/{note['id']}")
    assert deleted.status_code == 200
    assert (await auth_client.get(NOTES)).json() == []


async def test_notes_require_auth(client: AsyncClient) -> None:
    assert (await client.get(NOTES)).status_code == 401
