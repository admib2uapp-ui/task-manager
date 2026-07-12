from __future__ import annotations

from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

PROJECTS = "/api/v1/projects"
TASKS = "/api/v1/tasks"
TIME = "/api/v1/time-entries"


async def test_start_and_stop_timer(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "Timed"})).json()

    start = await auth_client.post(TIME + "/start", json={"projectId": project["id"]})
    assert start.status_code == 201
    assert start.json()["isRunning"] is True

    running = await auth_client.get(TIME + "/running")
    assert running.json() is not None

    stop = await auth_client.post(TIME + "/stop")
    assert stop.status_code == 200
    assert stop.json()["isRunning"] is False

    # nothing running now
    assert (await auth_client.get(TIME + "/running")).json() is None


async def test_starting_timer_stops_previous(auth_client: AsyncClient) -> None:
    p = (await auth_client.post(PROJECTS, json={"name": "P"})).json()
    await auth_client.post(TIME + "/start", json={"projectId": p["id"]})
    await auth_client.post(TIME + "/start", json={"projectId": p["id"]})
    # exactly one running
    entries = (await auth_client.get(TIME)).json()
    running = [e for e in entries if e["isRunning"]]
    assert len(running) == 1


async def test_manual_entry_updates_task_time(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "M"})).json()
    task = (
        await auth_client.post(
            TASKS, json={"projectId": project["id"], "title": "Work"}
        )
    ).json()

    end = datetime.now(UTC)
    start = end - timedelta(hours=2)
    entry = await auth_client.post(
        TIME,
        json={
            "taskId": task["id"],
            "startedAt": start.isoformat(),
            "endedAt": end.isoformat(),
        },
    )
    assert entry.status_code == 201
    assert entry.json()["durationSeconds"] == 7200
    assert entry.json()["projectId"] == project["id"]

    refreshed = (await auth_client.get(f"{TASKS}/{task['id']}")).json()
    assert refreshed["timeSpentSeconds"] == 7200


async def test_summary_and_dashboard(auth_client: AsyncClient) -> None:
    project = (await auth_client.post(PROJECTS, json={"name": "S"})).json()
    end = datetime.now(UTC)
    start = end - timedelta(minutes=30)
    await auth_client.post(
        TIME,
        json={
            "projectId": project["id"],
            "startedAt": start.isoformat(),
            "endedAt": end.isoformat(),
        },
    )

    summary = (await auth_client.get(TIME + "/summary")).json()
    assert summary["todaySeconds"] == 1800
    assert summary["weekSeconds"] == 1800
    assert summary["monthSeconds"] == 1800
    assert summary["perProject"][0]["seconds"] == 1800

    dash = (await auth_client.get("/api/v1/dashboard")).json()
    assert dash["stats"]["trackedTodaySeconds"] == 1800


async def test_manual_entry_invalid_range(auth_client: AsyncClient) -> None:
    end = datetime.now(UTC)
    resp = await auth_client.post(
        TIME,
        json={
            "startedAt": end.isoformat(),
            "endedAt": (end - timedelta(hours=1)).isoformat(),
        },
    )
    assert resp.status_code == 422


async def test_delete_entry(auth_client: AsyncClient) -> None:
    p = (await auth_client.post(PROJECTS, json={"name": "D"})).json()
    end = datetime.now(UTC)
    entry = (
        await auth_client.post(
            TIME,
            json={
                "projectId": p["id"],
                "startedAt": (end - timedelta(minutes=10)).isoformat(),
                "endedAt": end.isoformat(),
            },
        )
    ).json()
    resp = await auth_client.delete(f"{TIME}/{entry['id']}")
    assert resp.status_code == 200
    assert (await auth_client.get(TIME)).json() == []
